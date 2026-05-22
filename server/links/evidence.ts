import "server-only";

// Phase A foundation. The Evidence type is the contract every later phase
// of the verifier builds on: each "reason" a URL is flagged carries a
// machine-readable code, a source the user can attribute it to, a severity,
// and an optional structured payload the UI can render without bespoke
// per-code rendering logic.
//
// This module is dormant in Phase A — `server/links/service.ts` still
// returns the legacy `reasons` array. Phase B refactors the heuristic
// analyzer to emit Evidence and consumers switch over.

export type EvidenceSource =
  | "heuristic"
  | "dns"
  | "probe"
  | "tls"
  | "safe_browsing"
  | "threat_feed"
  | "cache";

export type EvidenceSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type EvidenceDataValue = string | number | boolean;

export interface Evidence {
  readonly code: string;
  readonly source: EvidenceSource;
  readonly severity: EvidenceSeverity;
  readonly message: string;
  readonly observedAt: string;
  readonly data?: Readonly<Record<string, EvidenceDataValue>>;
}

export interface ProbeRedirectHop {
  readonly url: string;
  readonly status: number;
}

export interface ProbeTlsSummary {
  readonly issuer: string;
  readonly subject: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly daysToExpiry: number;
  readonly selfSigned: boolean;
  readonly hostnameMatches: boolean;
}

export interface ProbeSummary {
  readonly initialUrl: string;
  readonly finalUrl: string;
  readonly redirectChain: readonly ProbeRedirectHop[];
  readonly httpStatus: number | null;
  readonly contentType: string | null;
  readonly tls: ProbeTlsSummary | null;
  readonly durationMs: number;
  readonly truncated: boolean;
  readonly error: string | null;
}

export type VerificationVerdict =
  | "safe"
  | "caution"
  | "suspicious"
  | "malicious";

export interface VerificationCacheMetadata {
  readonly hit: boolean;
  readonly cacheable: boolean;
  readonly checkedAt: string | null;
  readonly expiresAt: string | null;
}

export interface VerificationResult {
  readonly verdict: VerificationVerdict;
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly evidence: readonly Evidence[];
  readonly probe: ProbeSummary | null;
  readonly checkedAt: string;
  readonly cache: VerificationCacheMetadata;
}

/** Deduplicates evidence by `${source}:${code}`. Later entries win. */
export function mergeEvidence(
  ...lists: ReadonlyArray<readonly Evidence[]>
): readonly Evidence[] {
  const byKey = new Map<string, Evidence>();
  for (const list of lists) {
    for (const entry of list) {
      byKey.set(`${entry.source}:${entry.code}`, entry);
    }
  }

  return Array.from(byKey.values());
}

/** Returns evidence filtered to a single source, preserving order. */
export function filterEvidenceBySource(
  evidence: readonly Evidence[],
  source: EvidenceSource
): readonly Evidence[] {
  return evidence.filter((entry) => entry.source === source);
}

/** Returns the highest severity present in the evidence list, or null. */
export function getMaxSeverity(
  evidence: readonly Evidence[]
): EvidenceSeverity | null {
  const order: readonly EvidenceSeverity[] = [
    "info",
    "low",
    "medium",
    "high",
    "critical",
  ];
  let maxIndex = -1;
  for (const entry of evidence) {
    const idx = order.indexOf(entry.severity);
    if (idx > maxIndex) maxIndex = idx;
  }

  return maxIndex === -1 ? null : order[maxIndex] ?? null;
}
