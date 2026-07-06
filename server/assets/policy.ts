import { ASSET_PURPOSE, type AssetPurpose } from "@/server/assets/constants";
import { AssetValidationError } from "@/server/assets/errors";

export interface AssetUploadPolicyInput {
  readonly purpose: AssetPurpose;
  readonly contentType: string;
  readonly fileSizeBytes: number;
}

export interface WorkspaceAssetKeyInput {
  readonly workspaceId: string;
  readonly assetId: string;
  readonly purpose: AssetPurpose;
  readonly contentType: string;
  readonly qrCodeId?: string;
  readonly landingPageId?: string;
}

export interface AssetUploadPolicy {
  readonly maxSizeBytes: number;
  readonly contentType: string;
  readonly extension: string;
}

const MEGABYTE = 1024 * 1024;

const CONTENT_TYPE_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
  ["application/pdf", "pdf"],
  ["audio/mpeg", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/wav", "wav"],
  ["audio/webm", "webm"],
]);

const QR_LOGO_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const LANDING_PAGE_MEDIA_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
]);

const QR_FILE_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function getAssetUploadPolicy({
  purpose,
  contentType,
  fileSizeBytes,
}: AssetUploadPolicyInput): AssetUploadPolicy {
  const normalizedContentType = contentType.trim().toLowerCase();
  const extension = CONTENT_TYPE_EXTENSIONS.get(normalizedContentType);
  const maxSizeBytes = getMaxSizeBytes(purpose, normalizedContentType);

  if (!extension || !isAllowedContentType(purpose, normalizedContentType)) {
    throw new AssetValidationError("This file type is not supported.");
  }

  if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
    throw new AssetValidationError("File size must be a positive integer.");
  }

  if (fileSizeBytes > maxSizeBytes) {
    throw new AssetValidationError("This file exceeds the allowed upload size.");
  }

  return {
    maxSizeBytes,
    contentType: normalizedContentType,
    extension,
  };
}

export function buildWorkspaceAssetKey({
  workspaceId,
  assetId,
  purpose,
  contentType,
  qrCodeId,
  landingPageId,
}: WorkspaceAssetKeyInput): string {
  const extension = getRequiredExtension(contentType);

  if (purpose === ASSET_PURPOSE.QR_LOGO) {
    if (!qrCodeId) {
      throw new AssetValidationError("QR logo uploads require a QR code.");
    }

    return `workspaces/${workspaceId}/qr/${qrCodeId}/logos/${assetId}.${extension}`;
  }

  if (purpose === ASSET_PURPOSE.LANDING_PAGE_MEDIA) {
    const ownerSegment = landingPageId ?? "unassigned";

    return `workspaces/${workspaceId}/landing-pages/${ownerSegment}/media/${assetId}.${extension}`;
  }

  if (purpose === ASSET_PURPOSE.QR_FILE) {
    // Uploaded before the QR exists (same ordering as landing-page media);
    // the create transaction links the asset to its QR code afterwards.
    const ownerSegment = qrCodeId ?? "unassigned";

    return `workspaces/${workspaceId}/qr/${ownerSegment}/files/${assetId}.${extension}`;
  }

  throw new AssetValidationError("This upload purpose is not user-uploadable.");
}

function isAllowedContentType(
  purpose: AssetPurpose,
  contentType: string
): boolean {
  if (purpose === ASSET_PURPOSE.QR_LOGO) {
    return QR_LOGO_CONTENT_TYPES.has(contentType);
  }

  if (purpose === ASSET_PURPOSE.LANDING_PAGE_MEDIA) {
    return LANDING_PAGE_MEDIA_CONTENT_TYPES.has(contentType);
  }

  if (purpose === ASSET_PURPOSE.QR_FILE) {
    return QR_FILE_CONTENT_TYPES.has(contentType);
  }

  return false;
}

function getMaxSizeBytes(purpose: AssetPurpose, contentType: string): number {
  if (purpose === ASSET_PURPOSE.QR_LOGO) return 2 * MEGABYTE;
  if (
    purpose !== ASSET_PURPOSE.LANDING_PAGE_MEDIA &&
    purpose !== ASSET_PURPOSE.QR_FILE
  ) {
    return 0;
  }
  if (contentType === "application/pdf") return 25 * MEGABYTE;
  if (contentType.startsWith("audio/")) return 50 * MEGABYTE;

  return 10 * MEGABYTE;
}

function getRequiredExtension(contentType: string): string {
  const extension = CONTENT_TYPE_EXTENSIONS.get(contentType.trim().toLowerCase());
  if (!extension) throw new AssetValidationError("This file type is not supported.");

  return extension;
}
