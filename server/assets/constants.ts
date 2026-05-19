export const ASSET_PURPOSE = {
  QR_EXPORT: "qr.export",
  QR_LOGO: "qr.logo",
  LANDING_PAGE_MEDIA: "landing_page.media",
} as const;

export const ASSET_STATUS = {
  READY: "ready",
  PENDING: "pending",
  DELETED: "deleted",
} as const;

export type AssetPurpose = (typeof ASSET_PURPOSE)[keyof typeof ASSET_PURPOSE];
export type AssetStatus = (typeof ASSET_STATUS)[keyof typeof ASSET_STATUS];
