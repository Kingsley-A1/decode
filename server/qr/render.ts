import "server-only";

import sharp from "sharp";
import {
  QR_EXPORT_FORMAT,
  type QRExportFormat,
} from "@/server/qr/constants";
import { buildQRRenderPlan } from "@/server/qr/geometry";
import { renderQRPdf } from "@/server/qr/pdf";
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
  // One render plan drives every format so PNG, JPG, SVG, and PDF are
  // identical and honour the full design (dot style, corners, colors, logo,
  // frame). The PDF is drawn as vectors and its page equals the artwork.
  if (format === QR_EXPORT_FORMAT.PDF) {
    const body = await renderQRPdf(
      buildQRRenderPlan({ value, design, title, logo })
    );

    return {
      body,
      contentType: "application/pdf",
      extension: QR_EXPORT_FORMAT.PDF,
    };
  }

  const svg = buildStyledQRSvg({ value, design, title, logo });

  if (format === QR_EXPORT_FORMAT.SVG) {
    return {
      body: svg,
      contentType: "image/svg+xml; charset=utf-8",
      extension: QR_EXPORT_FORMAT.SVG,
    };
  }

  if (format === QR_EXPORT_FORMAT.JPG) {
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

  const body = await sharp(Buffer.from(svg)).png().toBuffer();

  return {
    body,
    contentType: "image/png",
    extension: QR_EXPORT_FORMAT.PNG,
  };
}
