export const SCAN_IMAGE_CONTENT_TYPES = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
} as const;

export const MAX_SCAN_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_SCAN_IMAGE_PIXELS = 16_000_000;
