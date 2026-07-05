import { describe, expect, it } from "vitest";
import {
  createGeneratedDynamicSlug,
  DYNAMIC_SLUG_ALPHABET,
  DYNAMIC_SLUG_PATTERN,
  GENERATED_DYNAMIC_SLUG_LENGTH,
  getDynamicQRCodeRedirectUrl,
  isReservedDynamicSlug,
  isValidDynamicSlug,
  normalizeDynamicSlug,
} from "@/server/qr/slugs";

describe("dynamic QR slugs", () => {
  it("normalizes slugs for stable redirect URLs", () => {
    expect(normalizeDynamicSlug(" Spring-Campaign ")).toBe("spring-campaign");
    expect(
      getDynamicQRCodeRedirectUrl("Spring-Campaign", "https://decode.example")
    ).toBe(
      "https://decode.example/r/spring-campaign"
    );
  });

  it("rejects reserved and malformed slugs", () => {
    expect(isReservedDynamicSlug("api")).toBe(true);
    expect(isValidDynamicSlug("api")).toBe(false);
    expect(isValidDynamicSlug("-campaign")).toBe(false);
    expect(isValidDynamicSlug("campaign-")).toBe(false);
    expect(isValidDynamicSlug("campaign_launch")).toBe(false);
  });

  it("accepts predictable public slugs", () => {
    expect(isValidDynamicSlug("spring-campaign-2026")).toBe(true);
  });

  it("generates short, lowercase, unambiguous slugs", () => {
    const alphabetPattern = new RegExp(
      `^[${DYNAMIC_SLUG_ALPHABET}]{${GENERATED_DYNAMIC_SLUG_LENGTH}}$`
    );

    for (let i = 0; i < 50; i += 1) {
      const slug = createGeneratedDynamicSlug();

      expect(slug).toMatch(alphabetPattern);
      expect(slug).toMatch(DYNAMIC_SLUG_PATTERN);
      expect(isValidDynamicSlug(slug)).toBe(true);
    }
  });

  it("keeps the default generated payload inside QR version 4 at level H", () => {
    const slug = createGeneratedDynamicSlug();
    const payload = getDynamicQRCodeRedirectUrl(slug, "https://decode.com.ng");

    // QR v4-H holds 34 bytes; the old qr-<12 hex> form needed v5.
    expect(payload.length).toBeLessThanOrEqual(34);
  });
});
