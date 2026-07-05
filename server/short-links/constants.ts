export const SHORT_LINK_STATUS = {
  ACTIVE: "active",
  FLAGGED: "flagged",
  DISABLED: "disabled",
} as const;

export type ShortLinkStatus =
  (typeof SHORT_LINK_STATUS)[keyof typeof SHORT_LINK_STATUS];

export const SHORT_LINK_ERROR_CODE = {
  INVALID_URL: "SHORT_LINK_INVALID_URL",
  URL_ALREADY_SHORT: "URL_ALREADY_SHORT",
  BLOCKED: "SHORT_LINK_BLOCKED",
  REQUIRES_OVERRIDE: "SHORT_LINK_REQUIRES_OVERRIDE",
  MINT_FAILED: "SHORT_LINK_MINT_FAILED",
  NOT_FOUND: "SHORT_LINK_NOT_FOUND",
} as const;

export type ShortLinkErrorCode =
  (typeof SHORT_LINK_ERROR_CODE)[keyof typeof SHORT_LINK_ERROR_CODE];

/** Compact summary of the verifier's verdict, returned to the caller so the
 *  UI can explain why a link was issued, blocked, or requires an override. */
export interface ShortLinkEvidenceSummary {
  readonly verdict: string;
  readonly confidence: number;
  readonly signalCount: number;
  readonly sourceCount: number;
  readonly topConcerns: readonly string[];
}
