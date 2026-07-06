export const QR_CODE_MODE = {
  STATIC: "static",
  DYNAMIC: "dynamic",
} as const;

export const QR_CODE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const QR_CODE_TYPE = {
  URL: "url",
  TEXT: "text",
  EMAIL: "email",
  PHONE: "phone",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  WIFI: "wifi",
  VCARD: "vcard",
  // Dynamic-only types: the QR encodes a /r/<slug> redirect and the content
  // is hosted or served by Decode, so it stays editable after printing.
  FILE: "file",
  LANDING_PAGE: "landing_page",
} as const;

/** Content types a dynamic QR can resolve to. */
export const DYNAMIC_QR_CODE_TYPES = [
  QR_CODE_TYPE.URL,
  QR_CODE_TYPE.TEXT,
  QR_CODE_TYPE.VCARD,
  QR_CODE_TYPE.FILE,
  QR_CODE_TYPE.LANDING_PAGE,
] as const;

/** Types that only exist as dynamic codes (no static payload equivalent). */
export const DYNAMIC_ONLY_QR_CODE_TYPES = [
  QR_CODE_TYPE.FILE,
  QR_CODE_TYPE.LANDING_PAGE,
] as const;

export const QR_DOT_STYLE = {
  SQUARE: "square",
  ROUNDED: "rounded",
  DOTS: "dots",
  CLASSY: "classy",
  EXTRA_ROUNDED: "extra-rounded",
} as const;

export const QR_CORNER_STYLE = {
  SQUARE: "square",
  ROUNDED: "rounded",
  DOT: "dot",
} as const;

export const QR_ERROR_CORRECTION_LEVEL = {
  LOW: "L",
  MEDIUM: "M",
  QUARTILE: "Q",
  HIGH: "H",
} as const;

export const QR_EXPORT_FORMAT = {
  PNG: "png",
  JPG: "jpg",
  SVG: "svg",
  PDF: "pdf",
} as const;

export type QRCodeMode = (typeof QR_CODE_MODE)[keyof typeof QR_CODE_MODE];
export type QRCodeStatus =
  (typeof QR_CODE_STATUS)[keyof typeof QR_CODE_STATUS];
export type QRCodeType = (typeof QR_CODE_TYPE)[keyof typeof QR_CODE_TYPE];
export type QRDotStyle = (typeof QR_DOT_STYLE)[keyof typeof QR_DOT_STYLE];
export type QRCornerStyle =
  (typeof QR_CORNER_STYLE)[keyof typeof QR_CORNER_STYLE];
export type QRErrorCorrectionLevel =
  (typeof QR_ERROR_CORRECTION_LEVEL)[keyof typeof QR_ERROR_CORRECTION_LEVEL];
export type QRExportFormat =
  (typeof QR_EXPORT_FORMAT)[keyof typeof QR_EXPORT_FORMAT];
