import "server-only";

import type {
  EvidenceSeverity,
  EvidenceSource,
} from "@/server/links/evidence";

// The verdict scorer in `score.ts` is intentionally a pure function that
// consumes these tables. Weights live as data, separated from logic, so
// product and security reviewers can audit them without reading TypeScript.

/** Risk weight applied per evidence severity (before source multiplier). */
export const SEVERITY_WEIGHT: Readonly<Record<EvidenceSeverity, number>> = {
  info: 0,
  low: 8,
  medium: 18,
  high: 35,
  critical: 60,
};

/** Multiplier applied per evidence source. Higher = more trustworthy and
 *  therefore counts more toward the final verdict. */
export const SOURCE_CONFIDENCE: Readonly<Record<EvidenceSource, number>> = {
  heuristic: 0.6,
  dns: 0.8,
  probe: 0.85,
  tls: 0.85,
  web_risk: 1.0,
  threat_feed: 0.95,
  cache: 0.7,
};

/** Evidence codes that promote the verdict to `suspicious` regardless of
 *  any other accumulated score. These are categorical signals that we
 *  refuse to allow as SAFE even with overwhelming positive evidence. */
export const HARD_BLOCK_CODES: ReadonlySet<string> = new Set([
  // Heuristic — URL is structurally unfit.
  "malformed_url",
  "unsupported_protocol",
  "private_network_host",
  "localhost_host",
  "raw_ip_host",
  "brand_spoof",
  "url_credentials",
  "encoded_control_chars",
  // Probe — destination is overtly malformed.
  "redirect_to_private_network",
  // TLS — chain is unverifiable.
  "tls_self_signed",
  "tls_expired",
  "tls_hostname_mismatch",
]);

/** Evidence codes that escalate the verdict to `malicious`. These are
 *  high-confidence categorical signals from corroborated external sources.
 *  A single one is enough — they short-circuit scoring. */
export const MALICIOUS_CODES: ReadonlySet<string> = new Set([
  "web_risk_malware",
  "web_risk_social_engineering",
  "web_risk_unwanted_software",
  "redirect_to_private_network",
]);

/** Evidence codes that contribute positively to a SAFE verdict's
 *  confidence rather than penalising it. They never produce risk. */
export const POSITIVE_EVIDENCE_CODES: ReadonlySet<string> = new Set([
  "web_risk_clean",
  "probe_clean_response",
  "tls_valid",
  "dns_resolved",
]);

/** Per-positive-evidence contribution to confidence (before source mult). */
export const POSITIVE_EVIDENCE_BONUS = 15;

/** Risk score thresholds used to bucket the verdict. */
export const VERDICT_THRESHOLDS = {
  CAUTION_MIN: 1,
  SUSPICIOUS_MIN: 45,
} as const;

/** Confidence bounds used by `score.ts`. */
export const CONFIDENCE_BOUNDS = {
  ABSOLUTE_MIN: 20,
  ABSOLUTE_MAX: 95,
  // Base confidence for SAFE before any corroborating source adjusts it.
  // Intentionally low — heuristic alone is not strong evidence the URL is
  // safe; later phases raise it with real probe + threat-intel signals.
  SAFE_BASE: 40,
  // Bonus per non-heuristic source that contributed to a SAFE verdict.
  SAFE_PER_CORROBORATING_SOURCE: 20,
  CAUTION_BASE: 50,
  CAUTION_MAX: 85,
  SUSPICIOUS_BASE: 55,
  SUSPICIOUS_MAX: 95,
  MALICIOUS: 95,
  HARD_BLOCK: 88,
} as const;
