import "server-only";

import jsQR from "jsqr";
import sharp from "sharp";
import {
  MAX_SCAN_IMAGE_PIXELS,
  MAX_SCAN_IMAGE_SIZE_BYTES,
  SCAN_IMAGE_CONTENT_TYPES,
} from "@/server/scans/constants";
import {
  ScanImageDecodeError,
  ScanImageValidationError,
} from "@/server/scans/errors";
import { analyzeLink } from "@/server/links/analysis";

export interface DecodeQRCodeImageInput {
  readonly file: File;
}

export interface QRCodeImageDecodeResult {
  readonly text: string;
  readonly contentType: "url" | "text";
  readonly normalizedUrl: string | null;
  readonly linkVerification: ReturnType<typeof analyzeLink> | null;
  readonly image: {
    readonly contentType: string;
    readonly fileSizeBytes: number;
    readonly width: number;
    readonly height: number;
  };
}

const ALLOWED_CONTENT_TYPES = new Set<string>([
  SCAN_IMAGE_CONTENT_TYPES.PNG,
  SCAN_IMAGE_CONTENT_TYPES.JPEG,
  SCAN_IMAGE_CONTENT_TYPES.WEBP,
]);

export async function decodeQRCodeImage({
  file,
}: DecodeQRCodeImageInput): Promise<QRCodeImageDecodeResult> {
  validateScanImageFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer, {
    limitInputPixels: MAX_SCAN_IMAGE_PIXELS,
  });
  const { data, info } = await image
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const code = jsQR(
    new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    info.width,
    info.height
  );

  if (!code?.data) {
    throw new ScanImageDecodeError(
      "No QR code was detected in this image. Try a clearer image with the full QR code visible."
    );
  }

  const linkVerification = getLinkVerification(code.data);
  const isUrl = linkVerification !== null;

  return {
    text: code.data,
    contentType: isUrl ? "url" : "text",
    normalizedUrl: isUrl ? linkVerification.normalizedUrl : null,
    linkVerification: isUrl ? linkVerification : null,
    image: {
      contentType: file.type,
      fileSizeBytes: file.size,
      width: info.width,
      height: info.height,
    },
  };
}

function getLinkVerification(text: string): ReturnType<typeof analyzeLink> | null {
  if (!hasUrlShape(text)) return null;

  const result = analyzeLink(text);
  if (!result.normalizedUrl || !result.host) return null;

  return result;
}

function hasUrlShape(text: string): boolean {
  const trimmedText = text.trim();
  if (/^https?:\/\//i.test(trimmedText)) return true;

  return /^[^\s/]+\.[^\s/]+/.test(trimmedText);
}

function validateScanImageFile(file: File): void {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new ScanImageValidationError(
      "Upload a PNG, JPG, or WebP image containing a QR code."
    );
  }

  if (file.size <= 0) {
    throw new ScanImageValidationError("Uploaded image is empty.");
  }

  if (file.size > MAX_SCAN_IMAGE_SIZE_BYTES) {
    throw new ScanImageValidationError("Uploaded image must be 8 MB or smaller.");
  }
}
