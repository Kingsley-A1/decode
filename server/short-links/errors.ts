import {
  SHORT_LINK_ERROR_CODE,
  type ShortLinkErrorCode,
  type ShortLinkEvidenceSummary,
} from "@/server/short-links/constants";

/** Domain error for the short-link service. Carries a stable `code` the API
 *  layer maps to an HTTP status, and an optional verifier `summary` so the
 *  caller can explain a block or override requirement. */
export class ShortLinkError extends Error {
  readonly code: ShortLinkErrorCode;
  readonly summary?: ShortLinkEvidenceSummary;

  constructor(
    code: ShortLinkErrorCode,
    message: string,
    summary?: ShortLinkEvidenceSummary
  ) {
    super(message);
    this.code = code;
    this.summary = summary;
    this.name = "ShortLinkError";
  }
}

/** Stable mapping from service error code to HTTP status. Kept here so the
 *  API layer and tests share one definition. */
export function getShortLinkErrorStatus(code: ShortLinkErrorCode): number {
  switch (code) {
    case SHORT_LINK_ERROR_CODE.INVALID_URL:
      return 400;
    case SHORT_LINK_ERROR_CODE.URL_ALREADY_SHORT:
      return 422;
    case SHORT_LINK_ERROR_CODE.BLOCKED:
      return 409;
    case SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE:
      return 409;
    case SHORT_LINK_ERROR_CODE.MINT_FAILED:
      return 503;
    default:
      return 500;
  }
}
