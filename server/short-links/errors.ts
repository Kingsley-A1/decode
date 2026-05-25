import type {
  ShortLinkErrorCode,
  ShortLinkEvidenceSummary,
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
