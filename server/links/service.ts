import "server-only";

import {
  analyzeLink,
  toLegacyReasons,
  type LegacyReason,
  type LinkAnalysisResult,
} from "@/server/links/analysis";
import type {
  Evidence,
  ProbeSummary,
  VerificationVerdict,
} from "@/server/links/evidence";
import {
  prismaLinkCheckRepository,
  type LinkCheckRecord,
  type LinkCheckRepository,
} from "@/server/links/repository";
import { scoreEvidence } from "@/server/links/score";

export interface VerifyLinkInput {
  readonly url: string;
  readonly now?: Date;
}

export interface LinkVerificationCacheMetadata {
  readonly hit: boolean;
  readonly cacheable: boolean;
  readonly checkedAt: string | null;
  readonly expiresAt: string | null;
}

/** Wire shape returned from POST /api/links/verify. Phase B adds
 *  `evidence` and `probe`; `reasons` is now a projection of `evidence`
 *  filtered to heuristic-source items and is kept for the existing UI. */
export interface LinkVerificationResult {
  readonly verdict: VerificationVerdict;
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly reasons: readonly LegacyReason[];
  readonly evidence: readonly Evidence[];
  readonly probe: ProbeSummary | null;
  readonly ssrfProtected: boolean;
  readonly cache: LinkVerificationCacheMetadata;
}

const LINK_CHECK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function verifyLink(
  input: VerifyLinkInput,
  repository: LinkCheckRepository = prismaLinkCheckRepository
): Promise<LinkVerificationResult> {
  const now = input.now ?? new Date();
  const analysis = analyzeForWire(input.url);

  if (!analysis.normalizedUrl) {
    return {
      ...analysis,
      cache: {
        hit: false,
        cacheable: false,
        checkedAt: null,
        expiresAt: null,
      },
    };
  }

  try {
    const cached = await repository.findFreshByNormalizedUrl(
      analysis.normalizedUrl,
      now
    );

    if (cached) {
      return getCachedVerificationResult(cached);
    }

    const expiresAt = new Date(now.getTime() + LINK_CHECK_CACHE_TTL_MS);
    const stored = await repository.upsertVerdict(analysis, now, expiresAt);

    return {
      ...analysis,
      cache: {
        hit: false,
        cacheable: true,
        checkedAt: stored.checkedAt.toISOString(),
        expiresAt: stored.expiresAt.toISOString(),
      },
    };
  } catch {
    return {
      ...analysis,
      cache: {
        hit: false,
        cacheable: false,
        checkedAt: now.toISOString(),
        expiresAt: null,
      },
    };
  }
}

/** Runs the heuristic analyzer and adds the wire-only fields. Phase B
 *  has no probe, so `probe` is null and `ssrfProtected` is false. */
function analyzeForWire(
  url: string
): Omit<LinkVerificationResult, "cache"> {
  const analysis: LinkAnalysisResult = analyzeLink(url);

  return {
    verdict: analysis.verdict,
    confidence: analysis.confidence,
    normalizedUrl: analysis.normalizedUrl,
    host: analysis.host,
    reasons: toLegacyReasons(analysis.evidence),
    evidence: analysis.evidence,
    probe: null,
    ssrfProtected: analysis.ssrfProtected,
  };
}

function getCachedVerificationResult(
  record: LinkCheckRecord
): LinkVerificationResult {
  const evidence = readStoredEvidence(record);
  const scored = scoreEvidence(evidence);
  const host = safeHostname(record.normalizedUrl);

  return {
    verdict: scored.verdict,
    confidence: scored.confidence,
    normalizedUrl: record.normalizedUrl,
    host,
    reasons: toLegacyReasons(evidence),
    evidence,
    probe: readStoredProbe(record),
    ssrfProtected: readStoredProbe(record) !== null,
    cache: {
      hit: true,
      cacheable: true,
      checkedAt: record.checkedAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
    },
  };
}

function readStoredEvidence(record: LinkCheckRecord): readonly Evidence[] {
  if (Array.isArray(record.evidence)) {
    return record.evidence
      .map((entry) => coerceEvidence(entry))
      .filter((entry): entry is Evidence => entry !== null);
  }

  // Legacy rows written before Phase B only carry the `reasons` column.
  // Lift them into the Evidence shape so the scorer can consume them.
  if (Array.isArray(record.reasons)) {
    return record.reasons
      .map((entry) => coerceLegacyReasonToEvidence(entry, record.checkedAt))
      .filter((entry): entry is Evidence => entry !== null);
  }

  return [];
}

function readStoredProbe(record: LinkCheckRecord): ProbeSummary | null {
  const stored = record.probeSummary;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return null;
  }

  // Trust persisted shape until Phase C adds a validator. The wire field
  // is null in Phase B because nothing writes to probeSummary yet.
  return stored as unknown as ProbeSummary;
}

function coerceEvidence(value: unknown): Evidence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  if (
    typeof record.code !== "string" ||
    typeof record.source !== "string" ||
    typeof record.severity !== "string" ||
    typeof record.message !== "string" ||
    typeof record.observedAt !== "string"
  ) {
    return null;
  }

  const evidence: Evidence = {
    code: record.code,
    source: record.source as Evidence["source"],
    severity: record.severity as Evidence["severity"],
    message: record.message,
    observedAt: record.observedAt,
    ...(record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? { data: record.data as Evidence["data"] }
      : {}),
  };

  return evidence;
}

function coerceLegacyReasonToEvidence(
  value: unknown,
  observedAt: Date
): Evidence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  if (
    typeof record.code !== "string" ||
    typeof record.message !== "string" ||
    typeof record.severity !== "string"
  ) {
    return null;
  }

  if (
    record.severity !== "low" &&
    record.severity !== "medium" &&
    record.severity !== "high"
  ) {
    return null;
  }

  return {
    code: record.code,
    source: "heuristic",
    severity: record.severity,
    message: record.message,
    observedAt: observedAt.toISOString(),
  };
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
