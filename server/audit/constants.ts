export const AUDIT_ACTION = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  PUBLISH: "publish",
  UNPUBLISH: "unpublish",
  ARCHIVE: "archive",
  RESTORE: "restore",
  ASSET_UPLOAD: "asset.upload",
  DESTINATION_CHANGE: "destination.change",
} as const;

export const AUDIT_ENTITY_TYPE = {
  WORKSPACE: "workspace",
  QR_CODE: "qr_code",
  QR_CODE_ASSET: "qr_code_asset",
  LANDING_PAGE: "landing_page",
  USER: "user",
  SHORT_LINK: "short_link",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPE)[keyof typeof AUDIT_ENTITY_TYPE];
