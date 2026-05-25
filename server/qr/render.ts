import "server-only";

import PDFDocument from "pdfkit";
import sharp from "sharp";
import {
  QR_EXPORT_FORMAT,
  type QRExportFormat,
} from "@/server/qr/constants";
import type { QRDesignConfig } from "@/server/qr/schemas";
import { buildStyledQRSvg, type StyledQRLogo } from "@/server/qr/svg";

export interface RenderQRCodeInput {
  readonly value: string;
  readonly design: QRDesignConfig;
  readonly format: QRExportFormat;
  readonly title?: string;
  /** Optional centered logo, composited into every output format. */
  readonly logo?: StyledQRLogo | null;
}

export interface RenderedQRCode {
  readonly body: Buffer | string;
  readonly contentType: string;
  readonly extension: QRExportFormat;
}

export async function renderQRCode({
  value,
  design,
  format,
  title,
  logo,
}: RenderQRCodeInput): Promise<RenderedQRCode> {
  // One styled SVG drives every format so PNG, JPG, SVG, and PDF are identical
  // and honour the full design (dot style, corners, colors, logo, frame).
  const svg = buildStyledQRSvg({ value, design, title, logo });

  if (format === QR_EXPORT_FORMAT.SVG) {
    return {
      body: svg,
      contentType: "image/svg+xml; charset=utf-8",
      extension: QR_EXPORT_FORMAT.SVG,
    };
  }

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  if (format === QR_EXPORT_FORMAT.PNG) {
    return {
      body: pngBuffer,
      contentType: "image/png",
      extension: QR_EXPORT_FORMAT.PNG,
    };
  }

  if (format === QR_EXPORT_FORMAT.JPG) {
    return renderJpgQRCode(svg);
  }

  return renderPdfQRCode(pngBuffer, title);
}

async function renderJpgQRCode(svg: string): Promise<RenderedQRCode> {
  const body = await sharp(Buffer.from(svg))
    .flatten({ background: "#FFFFFF" })
    .jpeg({ quality: 92 })
    .toBuffer();

  return {
    body,
    contentType: "image/jpeg",
    extension: QR_EXPORT_FORMAT.JPG,
  };
}

async function renderPdfQRCode(
  pngBuffer: Buffer,
  title = "Decode QR Code"
): Promise<RenderedQRCode> {
  const { width, height } = await sharp(pngBuffer).metadata();
  const body = await createPdfBuffer({
    pngBuffer,
    title,
    imageWidth: width ?? 1024,
    imageHeight: height ?? 1024,
  });

  return {
    body,
    contentType: "application/pdf",
    extension: QR_EXPORT_FORMAT.PDF,
  };
}

function createPdfBuffer({
  pngBuffer,
  title,
  imageWidth,
  imageHeight,
}: {
  readonly pngBuffer: Buffer;
  readonly title: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 72 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(18).text(title, { align: "center" });
    document.moveDown(2);

    // Fit the rendered QR (which may include a non-square frame) into a centered
    // box while preserving its aspect ratio.
    const box = 360;
    const aspect = imageWidth / imageHeight;
    const drawWidth = aspect >= 1 ? box : box * aspect;
    const drawHeight = aspect >= 1 ? box / aspect : box;
    const pageWidth = document.page.width - document.page.margins.left * 2;
    const offsetX = document.page.margins.left + (pageWidth - drawWidth) / 2;

    document.image(pngBuffer, offsetX, document.y, {
      width: drawWidth,
      height: drawHeight,
    });
    document.end();
  });
}
