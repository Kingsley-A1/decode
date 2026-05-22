import "server-only";

import type {
  Evidence,
  EvidenceSource,
  VerificationVerdict,
} from "@/server/links/evidence";
import {
  CONFIDENCE_BOUNDS,
  HARD_BLOCK_CODES,
  MALICIOUS_CODES,
  POSITIVE_EVIDENCE_BONUS,
  POSITIVE_EVIDENCE_CODES,
  SEVERITY_WEIGHT,
  SOURCE_CONFIDENCE,
  VERDICT_THRESHOLDS,
} from "@/server/links/scoring-weights";

// Pure verdict scorer. No I/O, no side effects, no dates. Replaces the
// flat-90% confidence calculation in the original analyzer. The verdict
// and the confidence are both *derived* from the evidence set, so the
// user-facing claim "based on N signals across M sources" is verifiable.
//
// Phase A leaves the rest of the verifier untouched. Phase B onward calls
// this from `server/links/service.ts`.

export interface ScoredResult {
  readonly verdict: VerificationVerdict;
  readonly confidence: number;
  readonly riskScore: number;
  readonly positiveSignal: number;
  readonly sourcesPresent: readonly EvidenceSource[];
}

export function scoreEvidence(evidence: readonly Evidence[]): ScoredResult {
  const sourcesPresent = collectSources(evidence);

  // Categorical short-circuits — corroborated external signals dominate.
  if (evidence.some((entry) => MALICIOUS_CODES.has(entry.code))) {
    return {
      verdict: "malicious",
      confidence: CONFIDENCE_BOUNDS.MALICIOUS,
      riskScore: 100,
      positiveSignal: 0,
      sourcesPresent,
    };
  }

  if (evidence.some((entry) => HARD_BLOCK_CODES.has(entry.code))) {
    return {
      verdict: "suspicious",
      confidence: CONFIDENCE_BOUNDS.HARD_BLOCK,
      riskScore: 100,
      positiveSignal: 0,
      sourcesPresent,
    };
  }

  const riskScore = computeRiskScore(evidence);
  const positiveSignal = computePositiveSignal(evidence);
  const verdict = bucketVerdict(riskScore);
  const confidence = computeConfidence({
    verdict,
    riskScore,
    positiveSignal,
    sourcesPresent,
  });

  return { verdict, confidence, riskScore, positiveSignal, sourcesPresent };
}

function collectSources(
  evidence: readonly Evidence[]
): readonly EvidenceSource[] {
  const ordered: readonly EvidenceSource[] = [
    "heuristic",
    "dns",
    "probe",
    "tls",
    "safe_browsing",
    "threat_feed",
    "cache",
  ];
  const present = new Set(evidence.map((entry) => entry.source));

  return ordered.filter((source) => present.has(source));
}

function computeRiskScore(evidence: readonly Evidence[]): number {
  return evidence.reduce((sum, entry) => {
    if (POSITIVE_EVIDENCE_CODES.has(entry.code)) return sum;
    const severity = SEVERITY_WEIGHT[entry.severity];
    const sourceMult = SOURCE_CONFIDENCE[entry.source];

    return sum + severity * sourceMult;
  }, 0);
}

function computePositiveSignal(evidence: readonly Evidence[]): number {
  return evidence.reduce((sum, entry) => {
    if (!POSITIVE_EVIDENCE_CODES.has(entry.code)) return sum;

    return sum + POSITIVE_EVIDENCE_BONUS * SOURCE_CONFIDENCE[entry.source];
  }, 0);
}

function bucketVerdict(riskScore: number): VerificationVerdict {
  if (riskScore >= VERDICT_THRESHOLDS.SUSPICIOUS_MIN) return "suspicious";
  if (riskScore >= VERDICT_THRESHOLDS.CAUTION_MIN) return "caution";

  return "safe";
}

function computeConfidence(args: {
  readonly verdict: VerificationVerdict;
  readonly riskScore: number;
  readonly positiveSignal: number;
  readonly sourcesPresent: readonly EvidenceSource[];
}): number {
  const { verdict, riskScore, positiveSignal, sourcesPresent } = args;

  if (verdict === "suspicious") {
    return clamp(
      CONFIDENCE_BOUNDS.SUSPICIOUS_BASE + Math.round(riskScore),
      CONFIDENCE_BOUNDS.SUSPICIOUS_BASE,
      CONFIDENCE_BOUNDS.SUSPICIOUS_MAX
    );
  }

  if (verdict === "caution") {
    return clamp(
      CONFIDENCE_BOUNDS.CAUTION_BASE + Math.round(riskScore),
      CONFIDENCE_BOUNDS.CAUTION_BASE,
      CONFIDENCE_BOUNDS.CAUTION_MAX
    );
  }

  // SAFE: heuristic alone is weak; each non-heuristic source raises base.
  const corroborating = sourcesPresent.filter(
    (source) => source !== "heuristic"
  ).length;

  const base =
    CONFIDENCE_BOUNDS.SAFE_BASE +
    corroborating * CONFIDENCE_BOUNDS.SAFE_PER_CORROBORATING_SOURCE +
    Math.round(positiveSignal);

  return clamp(
    base,
    CONFIDENCE_BOUNDS.ABSOLUTE_MIN,
    CONFIDENCE_BOUNDS.ABSOLUTE_MAX
  );
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;

  return value;
}
