import { describe, expect, it } from "vitest";
import type { ProbeSummary, ProbeTlsSummary } from "@/server/links/evidence";
import { getProbeEvidence } from "@/server/links/probeEvidence";

function baseProbe(overrides: Partial<ProbeSummary> = {}): ProbeSummary {
  return {
    initialUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    redirectChain: [{ url: "https://example.com/", status: 200 }],
    httpStatus: 200,
    contentType: "text/html",
    tls: null,
    durationMs: 100,
    truncated: false,
    error: null,
    ...overrides,
  };
}

function validTls(overrides: Partial<ProbeTlsSummary> = {}): ProbeTlsSummary {
  return {
    issuer: "O=Let's Encrypt, CN=R3",
    subject: "CN=example.com",
    validFrom: "Jan  1 00:00:00 2026 GMT",
    validTo: "Dec 31 00:00:00 2026 GMT",
    daysToExpiry: 90,
    selfSigned: false,
    hostnameMatches: true,
    ...overrides,
  };
}

function codes(probe: ProbeSummary): string[] {
  return getProbeEvidence(probe).map((entry) => entry.code);
}

describe("getProbeEvidence", () => {
  it("emits a positive clean-response signal for a 2xx", () => {
    expect(codes(baseProbe())).toContain("probe_clean_response");
  });

  it("flags 4xx and 5xx responses at low severity", () => {
    expect(codes(baseProbe({ httpStatus: 404 }))).toContain("probe_4xx");
    expect(codes(baseProbe({ httpStatus: 503 }))).toContain("probe_5xx");
  });

  it("maps a private-network redirect error to a critical malicious code", () => {
    const evidence = getProbeEvidence(
      baseProbe({ httpStatus: null, error: "redirect_to_private_network" })
    );
    const entry = evidence.find(
      (e) => e.code === "redirect_to_private_network"
    );
    expect(entry?.severity).toBe("critical");
    expect(entry?.source).toBe("probe");
  });

  it("treats transient errors as unreachable, not malicious", () => {
    expect(codes(baseProbe({ httpStatus: null, error: "timeout" }))).toEqual([
      "probe_unreachable",
    ]);
    expect(
      codes(baseProbe({ httpStatus: null, error: "dns_failed" }))
    ).toEqual(["probe_unreachable"]);
  });

  it("flags a redirect chain through a known URL shortener", () => {
    const probe = baseProbe({
      redirectChain: [
        { url: "https://example.com/", status: 301 },
        { url: "https://bit.ly/abc123", status: 301 },
        { url: "https://final.example.org/", status: 200 },
      ],
    });
    expect(codes(probe)).toContain("redirect_to_url_shortener");
  });

  it("flags executable content types", () => {
    expect(
      codes(baseProbe({ contentType: "application/x-msdownload" }))
    ).toContain("content_type_executable");
    expect(
      codes(baseProbe({ contentType: "application/octet-stream; charset=binary" }))
    ).toContain("content_type_executable");
  });

  it("emits tls_valid for a healthy certificate", () => {
    expect(codes(baseProbe({ tls: validTls() }))).toContain("tls_valid");
  });

  it("hard-flags self-signed, expired, and mismatched certificates", () => {
    expect(
      codes(baseProbe({ tls: validTls({ selfSigned: true }) }))
    ).toContain("tls_self_signed");
    expect(
      codes(baseProbe({ tls: validTls({ daysToExpiry: -3 }) }))
    ).toContain("tls_expired");
    expect(
      codes(baseProbe({ tls: validTls({ hostnameMatches: false }) }))
    ).toContain("tls_hostname_mismatch");
  });

  it("does not emit tls_valid when the certificate is unhealthy", () => {
    expect(
      codes(baseProbe({ tls: validTls({ selfSigned: true }) }))
    ).not.toContain("tls_valid");
  });

  it("all probe evidence carries the probe or tls source", () => {
    const evidence = getProbeEvidence(baseProbe({ tls: validTls() }));
    for (const entry of evidence) {
      expect(["probe", "tls"]).toContain(entry.source);
    }
  });
});
