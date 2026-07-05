import "server-only";

import PDFDocument from "pdfkit";
import sharp from "sharp";
import type {
  QRFilledShape,
  QRPlacement,
  QRRenderPlan,
} from "@/server/qr/geometry";

// Plan coordinates are CSS pixels (96dpi); PDF points are 72dpi. Scaling the
// whole page by 0.75 keeps the PDF's physical size identical to the raster
// exports while every shape stays a true vector.
const PX_TO_PT = 0.75;

// Approximates SVG `dominant-baseline="central"` for the uppercase frame
// captions: Helvetica-Bold's cap height is ~0.718em, so the visual center of
// a caps-only line sits ~0.359em above the baseline, and pdfkit places text
// by the top of the ascender (~0.718em above the baseline).
const CAPTION_CENTER_TO_TOP_EM = 0.359;
const CAPTION_LETTER_SPACING = 0.5;
const CAPTION_FONT = "Helvetica-Bold";

/**
 * Renders a QR render plan as a print-ready vector PDF: the page is sized to
 * the artwork itself (QR plus quiet zone, plus the frame when one is chosen).
 * Only logos are embedded as images; everything else is vector geometry.
 */
export async function renderQRPdf(plan: QRRenderPlan): Promise<Buffer> {
  const logoImages = await resolveLogoImages(plan);

  return await new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({
      size: [plan.width * PX_TO_PT, plan.height * PX_TO_PT],
      margin: 0,
    });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    try {
      document.scale(PX_TO_PT);

      for (const shape of plan.underlay) {
        drawFilledShape(document, shape, logoImages);
      }
      drawQRPlacement(document, plan.qr, logoImages);
      for (const shape of plan.overlay) {
        drawFilledShape(document, shape, logoImages);
      }

      document.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawQRPlacement(
  document: PDFKit.PDFDocument,
  qr: QRPlacement,
  logoImages: ReadonlyMap<string, Buffer>
): void {
  document.save();
  document.translate(qr.x, qr.y);
  document.scale(qr.scale);

  document.rect(0, 0, qr.dim, qr.dim).fill(qr.background);

  for (const shape of qr.modules) {
    if (shape.kind === "module-dot") {
      document.circle(shape.cx, shape.cy, 0.5).fill(qr.foreground);
    } else if (shape.radius > 0) {
      document
        .roundedRect(shape.x, shape.y, 1, 1, shape.radius)
        .fill(qr.foreground);
    } else {
      document.rect(shape.x, shape.y, 1, 1).fill(qr.foreground);
    }
  }

  for (const shape of qr.eyes) {
    drawFilledShape(document, shape, logoImages);
  }
  for (const shape of qr.logo) {
    drawFilledShape(document, shape, logoImages);
  }

  document.restore();
}

function drawFilledShape(
  document: PDFKit.PDFDocument,
  shape: QRFilledShape,
  logoImages: ReadonlyMap<string, Buffer>
): void {
  switch (shape.kind) {
    case "eye-circle":
      document.circle(shape.cx, shape.cy, shape.r).fill(shape.fill);
      return;
    case "plain-rect":
      rectPath(document, shape.x, shape.y, shape.width, shape.height, shape.radius).fill(
        shape.fill
      );
      return;
    case "stroked-rect":
      if (shape.strokeWidth > 0) {
        // The plan already inset the rect by half the stroke width; PDF
        // strokes are centered on the path just like SVG strokes.
        rectPath(document, shape.x, shape.y, shape.width, shape.height, shape.radius)
          .lineWidth(shape.strokeWidth)
          .fillAndStroke(shape.fill, shape.stroke);
      } else {
        rectPath(document, shape.x, shape.y, shape.width, shape.height, shape.radius).fill(
          shape.fill
        );
      }
      return;
    case "caption": {
      document.font(CAPTION_FONT).fontSize(shape.fontSize);
      const textWidth =
        document.widthOfString(shape.text) +
        CAPTION_LETTER_SPACING * Math.max(shape.text.length - 1, 0);

      document
        .fillColor(shape.fill)
        .text(
          shape.text,
          shape.x - textWidth / 2,
          shape.y - shape.fontSize * CAPTION_CENTER_TO_TOP_EM,
          { characterSpacing: CAPTION_LETTER_SPACING, lineBreak: false }
        );
      return;
    }
    case "logo-image": {
      const image = logoImages.get(shape.dataUrl);
      // An undecodable logo is skipped rather than failing the export; the
      // QR itself stays intact and scannable (error correction covers the
      // cleared plate behind the logo).
      if (!image) return;

      document.image(image, shape.x, shape.y, {
        fit: [shape.width, shape.height],
        align: "center",
        valign: "center",
      });
      return;
    }
  }
}

function rectPath(
  document: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): PDFKit.PDFDocument {
  return radius > 0
    ? document.roundedRect(x, y, width, height, radius)
    : document.rect(x, y, width, height);
}

async function resolveLogoImages(
  plan: QRRenderPlan
): Promise<Map<string, Buffer>> {
  const images = new Map<string, Buffer>();
  const shapes = [...plan.underlay, ...plan.qr.logo, ...plan.overlay];

  for (const shape of shapes) {
    if (shape.kind !== "logo-image" || images.has(shape.dataUrl)) continue;

    const decoded = await decodeLogoDataUrl(shape.dataUrl);
    if (decoded) {
      images.set(shape.dataUrl, decoded);
    }
  }

  return images;
}

async function decodeLogoDataUrl(dataUrl: string): Promise<Buffer | null> {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;

  const [, mimeType = "", base64Flag, data] = match;

  try {
    const buffer = base64Flag
      ? Buffer.from(data, "base64")
      : Buffer.from(decodeURIComponent(data), "utf8");

    if (buffer.byteLength === 0) return null;

    // pdfkit embeds PNG and JPEG natively; everything else (webp/svg) is
    // normalized through sharp, mirroring the raster export path's tolerance.
    if (mimeType === "image/png" || mimeType === "image/jpeg") {
      return buffer;
    }

    return await sharp(buffer).png().toBuffer();
  } catch {
    return null;
  }
}
