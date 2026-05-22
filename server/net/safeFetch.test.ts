import { describe, expect, it, vi } from "vitest";
import {
  SAFE_FETCH_ERROR_CODE,
  SafeFetchError,
  safeFetch,
  type DnsLookupAddress,
} from "@/server/net/safeFetch";

function publicDns(address = "203.0.113.7"): () => Promise<readonly DnsLookupAddress[]> {
  return async () => [{ address, family: 4 }];
}

function makeFetch(
  responseInit: ResponseInit & { readonly body?: string } = {}
): typeof fetch {
  return vi.fn(async () => {
    const { body, ...rest } = responseInit;
    return new Response(body ?? null, rest);
  }) as unknown as typeof fetch;
}

describe("safeFetch", () => {
  it("rejects URLs with disallowed protocols", async () => {
    await expectError(
      () =>
        safeFetch("ftp://example.com", {
          fetchImpl: makeFetch(),
          dnsLookup: publicDns(),
        }),
      SAFE_FETCH_ERROR_CODE.PROTOCOL_NOT_ALLOWED
    );
  });

  it("rejects URLs with disallowed ports", async () => {
    await expectError(
      () =>
        safeFetch("https://example.com:8443/", {
          fetchImpl: makeFetch(),
          dnsLookup: publicDns(),
        }),
      SAFE_FETCH_ERROR_CODE.PORT_NOT_ALLOWED
    );
  });

  it("rejects localhost destinations before DNS", async () => {
    const dnsLookup = vi.fn();
    await expectError(
      () =>
        safeFetch("https://localhost/", {
          fetchImpl: makeFetch(),
          dnsLookup: dnsLookup as never,
        }),
      SAFE_FETCH_ERROR_CODE.LOCALHOST_HOST
    );
    expect(dnsLookup).not.toHaveBeenCalled();
  });

  it("rejects IP-literal URLs", async () => {
    await expectError(
      () =>
        safeFetch("https://203.0.113.7/", {
          fetchImpl: makeFetch(),
          dnsLookup: publicDns(),
        }),
      SAFE_FETCH_ERROR_CODE.IP_LITERAL_BLOCKED
    );
  });

  it("rejects private IP literals as a private-network error", async () => {
    await expectError(
      () =>
        safeFetch("http://192.168.1.10/", {
          fetchImpl: makeFetch(),
          dnsLookup: publicDns(),
        }),
      SAFE_FETCH_ERROR_CODE.PRIVATE_NETWORK
    );
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    await expectError(
      () =>
        safeFetch("https://internal.example.com/", {
          fetchImpl: makeFetch(),
          dnsLookup: async () => [
            { address: "10.0.0.5", family: 4 },
          ],
        }),
      SAFE_FETCH_ERROR_CODE.PRIVATE_NETWORK
    );
  });

  it("returns a result when DNS and protocol checks pass", async () => {
    const fetchImpl = makeFetch({
      status: 200,
      headers: { "content-type": "text/html" },
    });

    const result = await safeFetch("https://example.com/", {
      fetchImpl,
      dnsLookup: publicDns(),
    });

    expect(result.status).toBe(200);
    expect(result.contentType).toBe("text/html");
    expect(result.resolvedAddresses).toEqual(["203.0.113.7"]);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("does not read a body for HEAD requests", async () => {
    const fetchImpl = makeFetch({
      status: 200,
      body: "should-be-ignored-for-HEAD",
    });

    const result = await safeFetch("https://example.com/", {
      method: "HEAD",
      fetchImpl,
      dnsLookup: publicDns(),
    });

    expect(result.body.byteLength).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("caps GET response bodies at maxResponseBytes and marks truncated", async () => {
    const oversized = "X".repeat(2048);
    const fetchImpl = makeFetch({ status: 200, body: oversized });

    const result = await safeFetch("https://example.com/", {
      method: "GET",
      fetchImpl,
      dnsLookup: publicDns(),
      maxResponseBytes: 64,
    });

    expect(result.truncated).toBe(true);
    expect(result.body.byteLength).toBeLessThanOrEqual(64);
  });

  it("translates AbortError into a SafeFetchError", async () => {
    const fetchImpl = vi.fn(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    }) as unknown as typeof fetch;

    await expectError(
      () =>
        safeFetch("https://example.com/", {
          fetchImpl,
          dnsLookup: publicDns(),
        }),
      [SAFE_FETCH_ERROR_CODE.ABORTED, SAFE_FETCH_ERROR_CODE.TIMEOUT]
    );
  });

  it("treats DNS-lookup failures as DNS_FAILED", async () => {
    await expectError(
      () =>
        safeFetch("https://example.com/", {
          fetchImpl: makeFetch(),
          dnsLookup: async () => {
            throw new Error("ENOTFOUND");
          },
        }),
      SAFE_FETCH_ERROR_CODE.DNS_FAILED
    );
  });

  it("rejects non-HEAD/GET methods", async () => {
    await expectError(
      () =>
        safeFetch("https://example.com/", {
          method: "POST" as never,
          fetchImpl: makeFetch(),
          dnsLookup: publicDns(),
        }),
      SAFE_FETCH_ERROR_CODE.METHOD_NOT_ALLOWED
    );
  });
});

async function expectError(
  run: () => Promise<unknown>,
  code: string | readonly string[]
): Promise<void> {
  const allowed = Array.isArray(code) ? code : [code];
  try {
    await run();
    throw new Error("safeFetch did not throw");
  } catch (error) {
    expect(error).toBeInstanceOf(SafeFetchError);
    if (error instanceof SafeFetchError) {
      expect(allowed).toContain(error.code);
    }
  }
}
