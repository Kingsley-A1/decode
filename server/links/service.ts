import "server-only";

import {
  analyzeLink,
  toLegacyReasons,
  type LegacyReason,
} from "@/server/links/analysis";
import {
  mergeEvidence,
  type Evidence,
  type ProbeSummary,
  type VerificationVerdict,
} from "@/server/links/evidence";
import { probeUrl } from "@/server/links/probe";
import { getProbeEvidence } from "@/server/links/probeEvidence";
import {
  checkSafeBrowsing,
  type SafeBrowsingResult,
} from "@/server/links/safeBrowsing";
import {
  prismaLinkCheckRepository,
  type LinkCheckRecord,
  type LinkCheckRepository,
} from "@/server/links/repository";
import { scoreEvidence } from "@/server/links/score";

export interface VerifyLinkInput {
  readonly url: string;
  readonly now?: Date;
  /** Skip the network probe and Safe Browsing lookup; return the instant
   *  heuristic-only verdict. Used for the UI's optimistic first paint. */
  readonly skipProbe?: boolean;
}

export type ProbeRunner = (url: string) => Promise<ProbeSummary>;
export type SafeBrowsingRunner = (url: string) => Promise<SafeBrowsingResult>;

export interface VerifyLinkDeps {
  readonly repository?: LinkCheckRepository;
  readonly probe?: ProbeRunner;
  readonly safeBrowsing?: SafeBrowsingRunner;
}

// Heuristic codes that mean the host is not a public destination. We never
// probe or send these to Safe Browsing — they are internal / malformed.
const HOST_BLOCKING_CODES: ReadonlySet<string> = new Set([
  "private_network_host",
  "localhost_host",
  "raw_ip_host",
]);

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
  deps: VerifyLinkDeps = {}
): Promise<LinkVerificationResult> {
  const repository = deps.repository ?? prismaLinkCheckRepository;
  const probeRunner = deps.probe ?? probeUrl;
  const safeBrowsingRunner = deps.safeBrowsing ?? checkSafeBrowsing;
  const now = input.now ?? new Date();
  const analysis = analyzeLink(input.url);

  if (!analysis.normalizedUrl) {
    return buildResult(
      toWire(analysis.evidence, analysis.normalizedUrl, analysis.host, null),
      uncacheable(null)
    );
  }

  // A fresh cached verdict is always backed by external evidence (we never
  // cache heuristic-only results), so a cache hit is the best answer we
  // have — honour it even when the caller asked to skip the probe.
  const cached = await findCached(repository, analysis.normalizedUrl, now);
  if (cached) {
    return getCachedVerificationResult(cached);
  }

  // External lookups run only for public hosts: we never fetch or disclose
  // internal / private / IP-literal targets. `skipProbe` opts out of both.
  const external = !input.skipProbe;
  const publicHost = !hasHostBlockingEvidence(analysis.evidence);

  // The probe is additionally skipped when heuristics already condemned the
  // URL — fetching a likely-phishing page buys nothing. Safe Browsing still
  // runs on suspicious public URLs: authoritative intel can upgrade a
  // heuristic "suspicious" to a confirmed "malicious".
  const wantProbe =
    external &&
    publicHost &&
    analysis.verdict !== "suspicious" &&
    analysis.verdict !== "malicious";
  const wantSafeBrowsing = external && publicHost;

  const [probe, safeBrowsing] = await Promise.all([
    wantProbe
      ? probeRunner(analysis.normalizedUrl)
      : Promise.resolve<ProbeSummary | null>(null),
    wantSafeBrowsing
      ? safeBrowsingRunner(analysis.normalizedUrl)
      : Promise.resolve<SafeBrowsingResult | null>(null),
  ]);

  let evidence = analysis.evidence;
  if (probe) {
    evidence = mergeEvidence(evidence, getProbeEvidence(probe));
  }
  if (safeBrowsing && safeBrowsing.evidence.length > 0) {
    evidence = mergeEvidence(evidence, safeBrowsing.evidence);
  }

  const wire = toWire(evidence, analysis.normalizedUrl, analysis.host, probe);

  // Cache only verdicts backed by external evidence. A probe result, or a
  // completed Safe Browsing lookup, qualifies. Heuristic-only verdicts are
  // free to recompute and caching them would shadow a later full check.
  const hasExternalEvidence =
    probe !== null ||
    Boolean(safeBrowsing?.checked && safeBrowsing.evidence.length > 0);
  if (!hasExternalEvidence) {
    return buildResult(wire, uncacheable(now));
  }

  try {
    const expiresAt = new Date(now.getTime() + LINK_CHECK_CACHE_TTL_MS);
    const safeBrowsingTtl =
      safeBrowsing?.checked && safeBrowsing.cacheTtlMs !== null
        ? new Date(now.getTime() + safeBrowsing.cacheTtlMs)
        : null;
    const stored = await repository.upsertVerdict(wire, {
      checkedAt: now,
      expiresAt,
      safeBrowsingTtl,
    });

    return buildResult(wire, {
      hit: false,
      cacheable: true,
      checkedAt: stored.checkedAt.toISOString(),
      expiresAt: stored.expiresAt.toISOString(),
    });
  } catch {
    return buildResult(wire, uncacheable(now));
  }
}

function hasHostBlockingEvidence(evidence: readonly Evidence[]): boolean {
  return evidence.some((entry) => HOST_BLOCKING_CODES.has(entry.code));
}

/** Looks up a fresh cached verdict, degrading to a miss if the store is
 *  unavailable so verification still works when the database is down. */
async function findCached(
  repository: LinkCheckRepository,
  normalizedUrl: string,
  now: Date
): Promise<LinkCheckRecord | null> {
  try {
    return await repository.findFreshByNormalizedUrl(normalizedUrl, now);
  } catch {
    return null;
  }
}

type WireResult = Omit<LinkVerificationResult, "cache">;

function toWire(
  evidence: readonly Evidence[],
  normalizedUrl: string | null,
  host: string | null,
  probe: ProbeSummary | null
): WireResult {
  const scored = scoreEvidence(evidence);

  return {
    verdict: scored.verdict,
    confidence: scored.confidence,
    normalizedUrl,
    host,
    reasons: toLegacyReasons(evidence),
    evidence,
    probe,
    ssrfProtected: probe !== null,
  };
}

function buildResult(
  wire: WireResult,
  cache: LinkVerificationCacheMetadata
): LinkVerificationResult {
  return { ...wire, cache };
}

function uncacheable(now: Date | null): LinkVerificationCacheMetadata {
  return {
    hit: false,
    cacheable: false,
    checkedAt: now ? now.toISOString() : null,
    expiresAt: null,
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
