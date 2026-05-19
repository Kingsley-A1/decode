import "server-only";

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  QR_EXPORT_FORMAT,
  type QRExportFormat,
} from "@/server/qr/constants";
import type { QRDesignConfig } from "@/server/qr/schemas";

export interface RenderQRCodeInput {
  readonly value: string;
  readonly design: QRDesignConfig;
  readonly format: QRExportFormat;
  readonly title?: string;
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
}: RenderQRCodeInput): Promise<RenderedQRCode> {
  if (format === QR_EXPORT_FORMAT.SVG) {
    return renderSvgQRCode(value, design);
  }

  const pngBuffer = await renderPngBuffer(value, design);

  if (format === QR_EXPORT_FORMAT.PNG) {
    return {
      body: pngBuffer,
      contentType: "image/png",
      extension: QR_EXPORT_FORMAT.PNG,
    };
  }

  if (format === QR_EXPORT_FORMAT.JPG) {
    return renderJpgQRCode(pngBuffer);
  }

  return renderPdfQRCode(pngBuffer, title);
}

async function renderSvgQRCode(
  value: string,
  design: QRDesignConfig
): Promise<RenderedQRCode> {
  const body = await QRCode.toString(value, {
    type: "svg",
    width: design.size,
    margin: design.margin,
    errorCorrectionLevel: design.errorCorrectionLevel,
    color: {
      dark: design.foregroundColor,
      light: design.backgroundColor,
    },
  });

  return {
    body,
    contentType: "image/svg+xml; charset=utf-8",
    extension: QR_EXPORT_FORMAT.SVG,
  };
}

function renderPngBuffer(
  value: string,
  design: QRDesignConfig
): Promise<Buffer> {
  return QRCode.toBuffer(value, {
    type: "png",
    width: design.size,
    margin: design.margin,
    errorCorrectionLevel: design.errorCorrectionLevel,
    color: {
      dark: design.foregroundColor,
      light: design.backgroundColor,
    },
  });
}

async function renderJpgQRCode(pngBuffer: Buffer): Promise<RenderedQRCode> {
  const body = await sharp(pngBuffer)
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
  const body = await createPdfBuffer({ pngBuffer, title });

  return {
    body,
    contentType: "application/pdf",
    extension: QR_EXPORT_FORMAT.PDF,
  };
}

function createPdfBuffer({
  pngBuffer,
  title,
}: {
  readonly pngBuffer: Buffer;
  readonly title: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 72 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    document.fontSize(18).text(title, { align: "center" });
    document.moveDown(2);
    document.image(pngBuffer, 171, 170, { width: 250, height: 250 });
    document.end();
  });
}
