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
} as const;

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
