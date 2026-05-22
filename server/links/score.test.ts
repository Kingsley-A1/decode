import { describe, expect, it } from "vitest";
import type { Evidence } from "@/server/links/evidence";
import { scoreEvidence } from "@/server/links/score";
import { CONFIDENCE_BOUNDS } from "@/server/links/scoring-weights";

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    code: "test_code",
    source: "heuristic",
    severity: "low",
    message: "test",
    observedAt: "2026-05-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("scoreEvidence", () => {
  it("returns safe with low confidence when no evidence is supplied", () => {
    const result = scoreEvidence([]);

    expect(result.verdict).toBe("safe");
    expect(result.confidence).toBeLessThanOrEqual(50);
    expect(result.confidence).toBeGreaterThanOrEqual(
      CONFIDENCE_BOUNDS.ABSOLUTE_MIN
    );
    expect(result.riskScore).toBe(0);
    expect(result.sourcesPresent).toEqual([]);
  });

  it("raises a SAFE verdict's confidence with corroborating sources", () => {
    const heuristicOnly = scoreEvidence([
      makeEvidence({
        code: "dns_resolved",
        source: "heuristic",
        severity: "info",
      }),
    ]);

    const corroborated = scoreEvidence([
      makeEvidence({
        code: "probe_clean_response",
        source: "probe",
        severity: "info",
      }),
      makeEvidence({
        code: "safe_browsing_clean",
        source: "safe_browsing",
        severity: "info",
      }),
      makeEvidence({
        code: "tls_valid",
        source: "tls",
        severity: "info",
      }),
    ]);

    expect(corroborated.verdict).toBe("safe");
    expect(heuristicOnly.verdict).toBe("safe");
    expect(corroborated.confidence).toBeGreaterThan(heuristicOnly.confidence);
  });

  it("returns caution when low-severity heuristic evidence is present", () => {
    const result = scoreEvidence([
      makeEvidence({ code: "risky_tld", severity: "medium" }),
    ]);

    expect(result.verdict).toBe("caution");
    expect(result.confidence).toBeGreaterThanOrEqual(
      CONFIDENCE_BOUNDS.CAUTION_BASE
    );
  });

  it("escalates to suspicious once the risk threshold is exceeded", () => {
    // Three medium-severity probe signals: 3 * 18 * 0.85 = 45.9 ≥ SUSPICIOUS_MIN.
    const result = scoreEvidence([
      makeEvidence({ code: "probe_5xx", source: "probe", severity: "medium" }),
      makeEvidence({
        code: "redirect_to_url_shortener",
        source: "probe",
        severity: "medium",
      }),
      makeEvidence({
        code: "content_type_executable",
        source: "probe",
        severity: "medium",
      }),
    ]);

    expect(result.verdict).toBe("suspicious");
  });

  it("hard-blocks to suspicious on categorical heuristic codes", () => {
    const result = scoreEvidence([
      makeEvidence({ code: "private_network_host", severity: "high" }),
    ]);

    expect(result.verdict).toBe("suspicious");
    expect(result.confidence).toBe(CONFIDENCE_BOUNDS.HARD_BLOCK);
  });

  it("returns malicious when Safe Browsing reports a threat", () => {
    const result = scoreEvidence([
      makeEvidence({
        code: "safe_browsing_malware",
        source: "safe_browsing",
        severity: "critical",
      }),
    ]);

    expect(result.verdict).toBe("malicious");
    expect(result.confidence).toBe(CONFIDENCE_BOUNDS.MALICIOUS);
  });

  it("treats positive-evidence codes as confidence contributors, not risk", () => {
    const result = scoreEvidence([
      makeEvidence({
        code: "tls_valid",
        source: "tls",
        severity: "info",
      }),
    ]);

    expect(result.verdict).toBe("safe");
    expect(result.riskScore).toBe(0);
    expect(result.positiveSignal).toBeGreaterThan(0);
  });

  it("returns sources in canonical order", () => {
    const result = scoreEvidence([
      makeEvidence({ source: "safe_browsing", code: "safe_browsing_clean" }),
      makeEvidence({ source: "heuristic", code: "info" }),
      makeEvidence({ source: "probe", code: "probe_clean_response" }),
    ]);

    expect(result.sourcesPresent).toEqual([
      "heuristic",
      "probe",
      "safe_browsing",
    ]);
  });

  it("clamps confidence within configured bounds", () => {
    const piles = Array.from({ length: 20 }, (_, i) =>
      makeEvidence({ code: `c_${i}`, severity: "high" })
    );

    const result = scoreEvidence(piles);

    expect(result.confidence).toBeLessThanOrEqual(CONFIDENCE_BOUNDS.SUSPICIOUS_MAX);
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_BOUNDS.SUSPICIOUS_BASE);
  });
});
