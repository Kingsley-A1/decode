// Adaptive error-correction policy shared by the generator UI and the server
// QR pipeline. Level H (30% damage tolerance) is the product default wherever
// it is affordable; Q (25%) protects module density on long static payloads
// (vCard/WiFi/long text), where H would make the code visibly denser and
// slower to scan. An explicit user/API choice always wins over this rule.

export type AdaptiveErrorCorrectionLevel = "H" | "Q";

/**
 * Payloads at or below this length take level H: they fit comfortably in a
 * low QR version (≤ v7 at H), so the extra redundancy costs little density.
 */
export const ADAPTIVE_EC_SHORT_PAYLOAD_MAX_LENGTH = 100;

export function getAdaptiveErrorCorrectionLevel({
  isDynamic,
  hasLogo,
  payloadLength,
}: {
  /** Dynamic payloads are short `decode.com.ng/r/<slug>` URLs — H is cheap. */
  readonly isDynamic: boolean;
  /** A centered logo obscures modules; H recovers what it covers. */
  readonly hasLogo: boolean;
  readonly payloadLength: number;
}): AdaptiveErrorCorrectionLevel {
  if (hasLogo) return "H";
  if (isDynamic) return "H";
  if (payloadLength <= ADAPTIVE_EC_SHORT_PAYLOAD_MAX_LENGTH) return "H";

  return "Q";
}
