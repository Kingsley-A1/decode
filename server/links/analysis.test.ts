import { describe, expect, it } from "vitest";
import { analyzeLink } from "@/server/links/analysis";
import { LINK_REASON_CODE, LINK_VERDICT } from "@/server/links/constants";

describe("analyzeLink", () => {
  it("returns safe verdicts for normal public HTTPS URLs", () => {
    const result = analyzeLink("https://example.com/docs");

    expect(result.verdict).toBe(LINK_VERDICT.SAFE);
    expect(result.normalizedUrl).toBe("https://example.com/docs");
    expect(result.reasons).toHaveLength(0);
    expect(result.ssrfProtected).toBe(true);
  });

  it("returns suspicious verdicts for malformed URLs", () => {
    const result = analyzeLink("http://[::1");

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(result.normalizedUrl).toBeNull();
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.MALFORMED_URL);
  });

  it("detects punycode domains", () => {
    const result = analyzeLink("https://xn--pple-43d.com");

    expect(result.verdict).toBe(LINK_VERDICT.CAUTION);
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.PUNYCODE_HOST);
  });

  it("blocks raw private-network IP destinations without fetching them", () => {
    const result = analyzeLink("http://192.168.1.10/admin");

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(result.ssrfProtected).toBe(true);
    expect(getReasonCodes(result)).toEqual(
      expect.arrayContaining([
        LINK_REASON_CODE.RAW_IP_HOST,
        LINK_REASON_CODE.PRIVATE_NETWORK_HOST,
      ])
    );
  });

  it("blocks localhost destinations without fetching them", () => {
    const result = analyzeLink("http://localhost:3000/login");

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(result.ssrfProtected).toBe(true);
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.LOCALHOST_HOST);
  });

  it("detects risky top-level domains", () => {
    const result = analyzeLink("https://download-example.zip/file");

    expect(result.verdict).toBe(LINK_VERDICT.CAUTION);
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.RISKY_TLD);
  });

  it("detects long paths", () => {
    const result = analyzeLink(`https://example.com/${"a".repeat(220)}`);

    expect(result.verdict).toBe(LINK_VERDICT.CAUTION);
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.LONG_PATH);
  });

  it("detects brand spoof patterns", () => {
    const result = analyzeLink("https://paypal-secure.example.com/login");

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.BRAND_SPOOF);
  });

  it("detects excessive subdomains", () => {
    const result = analyzeLink("https://a.b.c.d.example.com");

    expect(result.verdict).toBe(LINK_VERDICT.CAUTION);
    expect(getReasonCodes(result)).toContain(
      LINK_REASON_CODE.EXCESSIVE_SUBDOMAINS
    );
  });

  it("detects nonstandard ports", () => {
    const result = analyzeLink("https://example.com:8443/pay");

    expect(result.verdict).toBe(LINK_VERDICT.CAUTION);
    expect(getReasonCodes(result)).toContain(LINK_REASON_CODE.NONSTANDARD_PORT);
  });

  it("detects encoded control characters", () => {
    const result = analyzeLink("https://example.com/login%0d%0aSet-Cookie:x");

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(getReasonCodes(result)).toContain(
      LINK_REASON_CODE.ENCODED_CONTROL_CHARS
    );
  });
});

function getReasonCodes(result: ReturnType<typeof analyzeLink>): string[] {
  return result.reasons.map((reason) => reason.code);
}
