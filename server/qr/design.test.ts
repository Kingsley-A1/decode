import { describe, expect, it } from "vitest";
import { getQRDesignWarnings } from "@/server/qr/design";

describe("getQRDesignWarnings", () => {
  it("warns for low contrast, inverted contrast, small quiet zone, large logo, and weak error correction", () => {
    const warnings = getQRDesignWarnings({
      foregroundColor: "#FFFFFF",
      backgroundColor: "#F8FAFC",
      frameColor: "#2563EB",
      margin: 1,
      logoSizeRatio: 0.27,
      dotStyle: "square",
      cornerStyle: "square",
      errorCorrectionLevel: "M",
      size: 512,
      frameStyle: "none",
    });

    expect(warnings.map((warning) => warning.code)).toEqual([
      "LOW_CONTRAST",
      "INVERTED_CONTRAST",
      "QUIET_ZONE_TOO_SMALL",
      "LOGO_TOO_LARGE",
      "LOW_ERROR_CORRECTION_WITH_LOGO",
    ]);
  });

  it("flags inverted contrast for light dots on a dark background", () => {
    const warnings = getQRDesignWarnings({
      foregroundColor: "#FFFFFF",
      backgroundColor: "#0F172A",
      frameColor: "#2563EB",
      margin: 16,
      logoSizeRatio: 0,
      dotStyle: "square",
      cornerStyle: "square",
      errorCorrectionLevel: "Q",
      size: 512,
      frameStyle: "none",
    });

    expect(warnings.map((warning) => warning.code)).toEqual([
      "INVERTED_CONTRAST",
    ]);
  });

  it("returns no warnings for a safe dark-on-light default", () => {
    const warnings = getQRDesignWarnings({
      foregroundColor: "#0F172A",
      backgroundColor: "#FFFFFF",
      frameColor: "#2563EB",
      margin: 16,
      logoSizeRatio: 0,
      dotStyle: "square",
      cornerStyle: "square",
      errorCorrectionLevel: "Q",
      size: 512,
      frameStyle: "none",
    });

    expect(warnings).toHaveLength(0);
  });
});
