import { describe, expect, it } from "vitest";
import { initialDesignState } from "./constants";
import {
  getApiDesign,
  getContrastRatio,
  getCornerSquareType,
  getSafeHex,
  isValidHexColor,
  normalizeHexDraft,
} from "./design";

describe("color helpers", () => {
  it("computes maximum contrast for black on white", () => {
    expect(Math.round(getContrastRatio("#000000", "#FFFFFF"))).toBe(21);
  });

  it("returns 1 for invalid colors", () => {
    expect(getContrastRatio("nope", "#FFFFFF")).toBe(1);
  });

  it("validates 6-digit hex colors", () => {
    expect(isValidHexColor("#0F172A")).toBe(true);
    expect(isValidHexColor("#FFF")).toBe(false);
  });

  it("normalizes a hex draft to an uppercase #-prefixed value", () => {
    expect(normalizeHexDraft("abcdef")).toBe("#ABCDEF");
    expect(normalizeHexDraft("#abcdef")).toBe("#ABCDEF");
  });

  it("falls back to a default when a hex value is invalid", () => {
    expect(getSafeHex("zzz", "#123456")).toBe("#123456");
    expect(getSafeHex("#abcdef", "#123456")).toBe("#ABCDEF");
  });
});

describe("getCornerSquareType", () => {
  it("maps rounded corners to extra-rounded", () => {
    expect(getCornerSquareType("rounded")).toBe("extra-rounded");
  });

  it("maps dot corners to dot", () => {
    expect(getCornerSquareType("dot")).toBe("dot");
  });

  it("defaults to square", () => {
    expect(getCornerSquareType("square")).toBe("square");
  });
});

describe("getApiDesign", () => {
  it("omits the logo and zeroes the ratio when no logo is present", () => {
    const design = getApiDesign(
      { ...initialDesignState, logoSizeRatio: 0.26 },
      ""
    );

    expect(design.logoSizeRatio).toBe(0);
    expect("logo" in design).toBe(false);
  });

  it("includes the logo and preserves the ratio when a logo is present", () => {
    const design = getApiDesign(
      { ...initialDesignState, logoSizeRatio: 0.26 },
      "data:image/png;base64,AAAA"
    );

    expect(design.logoSizeRatio).toBe(0.26);
    expect(design.logo).toBe("data:image/png;base64,AAAA");
  });

  it("carries the margin and error-correction level through to the API shape", () => {
    const design = getApiDesign(
      { ...initialDesignState, margin: 8, errorCorrectionLevel: "H" },
      ""
    );

    expect(design.margin).toBe(8);
    expect(design.errorCorrectionLevel).toBe("H");
  });
});
