import { describe, expect, it } from "vitest";
import {
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
});
