import { describe, expect, it } from "vitest";
import {
  filterEvidenceBySource,
  getMaxSeverity,
  mergeEvidence,
  type Evidence,
} from "@/server/links/evidence";

function makeEvidence(
  overrides: Partial<Evidence> = {}
): Evidence {
  return {
    code: "test_code",
    source: "heuristic",
    severity: "low",
    message: "test",
    observedAt: "2026-05-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeEvidence", () => {
  it("dedupes by source:code with later entries winning", () => {
    const a = makeEvidence({ code: "x", message: "first" });
    const b = makeEvidence({ code: "x", message: "second" });
    const c = makeEvidence({ code: "y" });

    const merged = mergeEvidence([a, c], [b]);

    expect(merged).toHaveLength(2);
    const x = merged.find((e) => e.code === "x");
    expect(x?.message).toBe("second");
  });

  it("treats the same code from different sources as distinct entries", () => {
    const heuristic = makeEvidence({ code: "x", source: "heuristic" });
    const probe = makeEvidence({ code: "x", source: "probe" });

    expect(mergeEvidence([heuristic, probe])).toHaveLength(2);
  });

  it("returns an empty array when given no lists", () => {
    expect(mergeEvidence()).toHaveLength(0);
  });
});

describe("filterEvidenceBySource", () => {
  it("returns only entries matching the requested source", () => {
    const evidence = [
      makeEvidence({ code: "a", source: "heuristic" }),
      makeEvidence({ code: "b", source: "probe" }),
      makeEvidence({ code: "c", source: "heuristic" }),
    ];

    const heuristic = filterEvidenceBySource(evidence, "heuristic");

    expect(heuristic.map((e) => e.code)).toEqual(["a", "c"]);
  });
});

describe("getMaxSeverity", () => {
  it("returns the highest-severity level present", () => {
    expect(
      getMaxSeverity([
        makeEvidence({ severity: "low" }),
        makeEvidence({ severity: "high" }),
        makeEvidence({ severity: "medium" }),
      ])
    ).toBe("high");
  });

  it("returns null for an empty evidence list", () => {
    expect(getMaxSeverity([])).toBeNull();
  });
});
