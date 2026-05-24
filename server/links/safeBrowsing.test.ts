import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSafeBrowsing } from "@/server/links/safeBrowsing";

const ORIGINAL_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

beforeEach(() => {
  delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  } else {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = ORIGINAL_KEY;
  }
});

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      })
  ) as unknown as typeof fetch;
}

describe("checkSafeBrowsing", () => {
  it("is a no-op when no API key is configured", async () => {
    const fetchImpl = vi.fn();
    const result = await checkSafeBrowsing("https://example.com", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.configured).toBe(false);
    expect(result.checked).toBe(false);
    expect(result.evidence).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a positive clean signal when there are no matches", async () => {
    const result = await checkSafeBrowsing("https://example.com", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({}),
    });

    expect(result.checked).toBe(true);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.code).toBe("safe_browsing_clean");
    expect(result.evidence[0]?.source).toBe("safe_browsing");
    expect(result.cacheTtlMs).toBeGreaterThan(0);
  });

  it("maps a malware match to critical evidence and a clamped TTL", async () => {
    const result = await checkSafeBrowsing("https://bad.example", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({
        matches: [{ threatType: "MALWARE", cacheDuration: "300s" }],
      }),
    });

    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.code).toBe("safe_browsing_malware");
    expect(result.evidence[0]?.severity).toBe("critical");
    // 300s clamps up to the 5-minute floor.
    expect(result.cacheTtlMs).toBe(5 * 60 * 1000);
  });

  it("maps each known threat type and dedupes repeats", async () => {
    const result = await checkSafeBrowsing("https://bad.example", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({
        matches: [
          { threatType: "SOCIAL_ENGINEERING", cacheDuration: "600s" },
          { threatType: "SOCIAL_ENGINEERING", cacheDuration: "300s" },
          { threatType: "UNWANTED_SOFTWARE" },
        ],
      }),
    });

    const codes = result.evidence.map((e) => e.code);
    expect(codes).toEqual([
      "safe_browsing_social_engineering",
      "safe_browsing_unwanted_software",
    ]);
    // Max observed cacheDuration wins (600s).
    expect(result.cacheTtlMs).toBe(10 * 60 * 1000);
  });

  it("ignores unrecognised threat types", async () => {
    const result = await checkSafeBrowsing("https://bad.example", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({ matches: [{ threatType: "SOMETHING_NEW" }] }),
    });

    expect(result.evidence).toHaveLength(0);
  });

  it("treats a non-2xx response as a non-fatal error", async () => {
    const result = await checkSafeBrowsing("https://example.com", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({ error: "quota" }, 429),
    });

    expect(result.checked).toBe(false);
    expect(result.evidence).toHaveLength(0);
    expect(result.error).toBe("safe_browsing_http_429");
  });

  it("reports a timeout as a non-fatal error", async () => {
    const fetchImpl = vi.fn(async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    }) as unknown as typeof fetch;

    const result = await checkSafeBrowsing("https://example.com", {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.error).toBe("safe_browsing_timeout");
    expect(result.evidence).toHaveLength(0);
  });

  it("reports a network failure as a non-fatal error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const result = await checkSafeBrowsing("https://example.com", {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.error).toBe("safe_browsing_unreachable");
  });

  it("reads the API key from the environment when not passed", async () => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "env-key";
    const fetchImpl = jsonFetch({});

    const result = await checkSafeBrowsing("https://example.com", {
      fetchImpl,
    });

    expect(result.configured).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
