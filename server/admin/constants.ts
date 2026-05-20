export const ADMIN_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
} as const;

export const ADMIN_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
} as const;

export const ADMIN_AUTH_EVENT = {
  REGISTER: "register",
  LOGIN: "login",
  LOGOUT: "logout",
  SESSION_CHECK: "session.check",
} as const;

export const ADMIN_AUTH_OUTCOME = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

export const PLATFORM_AUDIT_ACTION = {
  ADMIN_REGISTER: "admin.register",
  ADMIN_LOGIN: "admin.login",
  ADMIN_LOGOUT: "admin.logout",
  ADMIN_DISABLE: "admin.disable",
  ADMIN_ENABLE: "admin.enable",
  ADMIN_SESSION_REVOKE: "admin.session.revoke",
  REVIEW_MODERATE: "review.moderate",
  QR_ARCHIVE: "qr.archive",
  QR_RESTORE: "qr.restore",
  WORKSPACE_REVIEW: "workspace.review",
} as const;

export const PLATFORM_ENTITY_TYPE = {
  ADMIN_USER: "admin_user",
  ADMIN_SESSION: "admin_session",
  REVIEW: "review",
  QR_CODE: "qr_code",
  WORKSPACE: "workspace",
} as const;

export const ADMIN_SESSION_COOKIE = "__Host-decode_admin_session";

export const ADMIN_SESSION_TTL_MS = getEnvNumber(
  "ADMIN_SESSION_TTL_SECONDS",
  60 * 60 * 8
) * 1000;

export const ADMIN_AUTH_WINDOW_MS = getEnvNumber(
  "ADMIN_AUTH_RATE_LIMIT_WINDOW_SECONDS",
  60 * 15
) * 1000;

export const ADMIN_AUTH_MAX_ATTEMPTS = getEnvNumber(
  "ADMIN_AUTH_MAX_ATTEMPTS",
  8
);

export type AdminRole = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];
export type AdminStatus = (typeof ADMIN_STATUS)[keyof typeof ADMIN_STATUS];
export type AdminAuthEvent =
  (typeof ADMIN_AUTH_EVENT)[keyof typeof ADMIN_AUTH_EVENT];
export type AdminAuthOutcome =
  (typeof ADMIN_AUTH_OUTCOME)[keyof typeof ADMIN_AUTH_OUTCOME];
export type PlatformAuditAction =
  (typeof PLATFORM_AUDIT_ACTION)[keyof typeof PLATFORM_AUDIT_ACTION];
export type PlatformEntityType =
  (typeof PLATFORM_ENTITY_TYPE)[keyof typeof PLATFORM_ENTITY_TYPE];

function getEnvNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}
