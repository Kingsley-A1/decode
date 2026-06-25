import { describe, expect, it } from "vitest";
import { initialDesignState } from "./constants";
import { getScanability } from "./scanability";
import type { DesignState } from "./types";

function designWith(overrides: Partial<DesignState>): DesignState {
  return { ...initialDesignState, ...overrides };
}

describe("getScanability", () => {
  it("reports ready for a safe default design", () => {
    const result = getScanability({
      design: initialDesignState,
      hasLogo: false,
    });

    expect(result.state).toBe("ready");
    expect(result.blocksPublish).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks publishing when contrast is far too low", () => {
    const result = getScanability({
      design: designWith({
        foregroundColor: "#777777",
        backgroundColor: "#888888",
      }),
      hasLogo: false,
    });

    expect(result.state).toBe("blocked");
    expect(result.blocksPublish).toBe(true);
  });

  it("warns about inverted (light-on-dark) codes without blocking", () => {
    const result = getScanability({
      design: designWith({
        foregroundColor: "#FFFFFF",
        backgroundColor: "#0F172A",
      }),
      hasLogo: false,
    });

    expect(result.state).toBe("needs-attention");
    expect(result.reasons.some((reason) => /inverted/i.test(reason))).toBe(true);
  });

  it("blocks when the quiet zone is removed", () => {
    const result = getScanability({
      design: designWith({ margin: 1 }),
      hasLogo: false,
    });

    expect(result.state).toBe("blocked");
  });

  it("warns when the quiet zone is small", () => {
    const result = getScanability({
      design: designWith({ margin: 3 }),
      hasLogo: false,
    });

    expect(result.state).toBe("needs-attention");
    expect(result.reasons.some((reason) => /quiet zone/i.test(reason))).toBe(true);
  });

  it("blocks an oversized logo", () => {
    const result = getScanability({
      design: designWith({ logoSizeRatio: 0.32 }),
      hasLogo: true,
    });

    expect(result.state).toBe("blocked");
  });

  it("warns about low error correction when a logo is present", () => {
    const result = getScanability({
      design: designWith({ logoSizeRatio: 0.2, errorCorrectionLevel: "L" }),
      hasLogo: true,
    });

    expect(result.state).toBe("needs-attention");
    expect(
      result.reasons.some((reason) => /error correction/i.test(reason))
    ).toBe(true);
  });
});
