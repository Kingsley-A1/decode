import { describe, expect, it, vi } from "vitest";
import { probeUrl } from "@/server/links/probe";
import type { ProbeFetchImpl, ProbeTlsImpl } from "@/server/links/probe";
import {
  SAFE_FETCH_ERROR_CODE,
  SafeFetchError,
  type SafeFetchResult,
} from "@/server/net/safeFetch";
import type { TlsInspectionResult } from "@/server/net/tlsInspect";

function makeResponse(
  url: string,
  status: number,
  headers: Record<string, string> = {},
  contentType: string | null = null
): SafeFetchResult {
  return {
    url,
    status,
    headers: new Headers(headers),
    contentType,
    resolvedAddresses: ["203.0.113.7"],
    body: new Uint8Array(),
    truncated: false,
    durationMs: 10,
  };
}

function validTlsInspection(): TlsInspectionResult {
  return {
    issuer: "O=Let's Encrypt, CN=R3",
    subject: "CN=example.com",
    validFrom: "Jan  1 00:00:00 2026 GMT",
    validTo: "Dec 31 00:00:00 2026 GMT",
    daysToExpiry: 120,
    selfSigned: false,
    hostnameMatches: true,
    chainAuthorized: true,
    error: null,
  };
}

const okTls: ProbeTlsImpl = async () => validTlsInspection();

describe("probeUrl", () => {
  it("records a single terminal response and inspects TLS for HTTPS", async () => {
    const fetchImpl: ProbeFetchImpl = vi.fn(async (url) =>
      makeResponse(url, 200, {}, "text/html")
    );
    const inspectTlsImpl = vi.fn(okTls);

    const summary = await probeUrl("https://example.com/", {
      safeFetchImpl: fetchImpl,
      inspectTlsImpl,
    });

    expect(summary.httpStatus).toBe(200);
    expect(summary.redirectChain).toHaveLength(1);
    expect(summary.finalUrl).toBe("https://example.com/");
    expect(summary.tls?.hostnameMatches).toBe(true);
    expect(summary.error).toBeNull();
    expect(inspectTlsImpl).toHaveBeenCalledOnce();
  });

  it("follows redirects manually and resolves relative Location headers", async () => {
    const fetchImpl: ProbeFetchImpl = vi.fn(async (url) => {
      if (url === "https://example.com/") {
        return makeResponse(url, 301, { location: "/landing" });
      }
      return makeResponse(url, 200, {}, "text/html");
    });

    const summary = await probeUrl("https://example.com/", {
      safeFetchImpl: fetchImpl,
      inspectTlsImpl: okTls,
    });

    expect(summary.redirectChain.map((hop) => hop.url)).toEqual([
      "https://example.com/",
      "https://example.com/landing",
    ]);
    expect(summary.finalUrl).toBe("https://example.com/landing");
    expect(summary.httpStatus).toBe(200);
  });

  it("stops and flags too_many_redirects past the hop cap", async () => {
    let n = 0;
    const fetchImpl: ProbeFetchImpl = vi.fn(async (url) => {
      n += 1;
      return makeResponse(url, 302, { location: `/hop-${n}` });
    });

    const summary = await probeUrl("https://example.com/", {
      maxHops: 3,
      safeFetchImpl: fetchImpl,
      inspectTlsImpl: okTls,
    });

    expect(summary.redirectChain).toHaveLength(3);
    expect(summary.error).toBe("too_many_redirects");
  });

  it("maps an SSRF block during a redirect to redirect_to_private_network", async () => {
    const fetchImpl: ProbeFetchImpl = vi.fn(async (url) => {
      if (url === "https://example.com/") {
        return makeResponse(url, 301, { location: "https://internal.example/" });
      }
      throw new SafeFetchError(
        SAFE_FETCH_ERROR_CODE.PRIVATE_NETWORK,
        "blocked"
      );
    });

    const summary = await probeUrl("https://example.com/", {
      safeFetchImpl: fetchImpl,
      inspectTlsImpl: okTls,
    });

    expect(summary.error).toBe("redirect_to_private_network");
  });

  it("reports timeouts as a probe error", async () => {
    const fetchImpl: ProbeFetchImpl = vi.fn(async () => {
      throw new SafeFetchError(SAFE_FETCH_ERROR_CODE.TIMEOUT, "slow");
    });

    const summary = await probeUrl("https://example.com/", {
      safeFetchImpl: fetchImpl,
      inspectTlsImpl: okTls,
    });

    expect(summary.error).toBe("timeout");
    expect(summary.httpStatus).toBeNull();
  });

  it("does not inspect TLS for plain HTTP destinations", async () => {
    const fetchImpl: ProbeFetchImpl = vi.fn(async (url) =>
      makeResponse(url, 200, {}, "text/html")
    );
    const inspectTlsImpl = vi.fn(okTls);

    const summary = await probeUrl("http://example.com/", {
      safeFetchImpl: fetchImpl,
      inspectTlsImpl,
    });

    expect(summary.tls).toBeNull();
    expect(inspectTlsImpl).not.toHaveBeenCalled();
  });

  it("aborts before fetching when the time budget is already spent", async () => {
    const fetchImpl: ProbeFetchImpl = vi.fn(async (url) =>
      makeResponse(url, 200)
    );
    let clock = 1000;
    const summary = await probeUrl("https://example.com/", {
      totalBudgetMs: 0,
      now: () => (clock += 5),
      safeFetchImpl: fetchImpl,
      inspectTlsImpl: okTls,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(summary.error).toBe("timeout");
  });
});
