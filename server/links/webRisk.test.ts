import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkWebRisk } from "@/server/links/webRisk";

const ORIGINAL_KEY = process.env.GOOGLE_WEB_RISK_API_KEY;

beforeEach(() => {
  delete process.env.GOOGLE_WEB_RISK_API_KEY;
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.GOOGLE_WEB_RISK_API_KEY;
  } else {
    process.env.GOOGLE_WEB_RISK_API_KEY = ORIGINAL_KEY;
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

describe("checkWebRisk", () => {
  it("is a no-op when no API key is configured", async () => {
    const fetchImpl = vi.fn();
    const result = await checkWebRisk("https://example.com", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.configured).toBe(false);
    expect(result.checked).toBe(false);
    expect(result.evidence).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls the Web Risk endpoint via GET with the threat-type allowlist", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("{}", { status: 200 })
    ) as unknown as typeof fetch;

    await checkWebRisk("https://example.com/path?q=1", {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [calledUrl, init] = (
      fetchImpl as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("https://webrisk.googleapis.com/v1/uris:search");
    expect(calledUrl).toContain("key=test-key");
    expect(calledUrl).toContain(
      `uri=${encodeURIComponent("https://example.com/path?q=1")}`
    );
    expect(calledUrl).toContain("threatTypes=MALWARE");
    expect(calledUrl).toContain("threatTypes=SOCIAL_ENGINEERING");
    expect(calledUrl).toContain("threatTypes=UNWANTED_SOFTWARE");
    expect(calledUrl).toContain(
      "threatTypes=SOCIAL_ENGINEERING_EXTENDED_COVERAGE"
    );
    expect(init.method).toBe("GET");
  });

  it("returns a positive clean signal when the response is empty", async () => {
    const result = await checkWebRisk("https://example.com", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({}),
    });

    expect(result.checked).toBe(true);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.code).toBe("web_risk_clean");
    expect(result.evidence[0]?.source).toBe("web_risk");
    expect(result.cacheTtlMs).toBeGreaterThan(0);
  });

  it("maps a malware threat to critical evidence and a clamped TTL", async () => {
    const now = Date.UTC(2026, 4, 25, 12, 0, 0);
    const expireIso = new Date(now + 7 * 60 * 1000).toISOString();
    const result = await checkWebRisk("https://bad.example", {
      apiKey: "test-key",
      now: () => now,
      fetchImpl: jsonFetch({
        threat: { threatTypes: ["MALWARE"], expireTime: expireIso },
      }),
    });

    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.code).toBe("web_risk_malware");
    expect(result.evidence[0]?.severity).toBe("critical");
    expect(result.cacheTtlMs).toBe(7 * 60 * 1000);
  });

  it("clamps a sub-floor expireTime up to the 5-minute minimum", async () => {
    const now = Date.UTC(2026, 4, 25, 12, 0, 0);
    const expireIso = new Date(now + 30 * 1000).toISOString();
    const result = await checkWebRisk("https://bad.example", {
      apiKey: "test-key",
      now: () => now,
      fetchImpl: jsonFetch({
        threat: { threatTypes: ["MALWARE"], expireTime: expireIso },
      }),
    });

    expect(result.cacheTtlMs).toBe(5 * 60 * 1000);
  });

  it("maps multiple threat types and dedupes social-engineering coverage variants", async () => {
    const result = await checkWebRisk("https://bad.example", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({
        threat: {
          threatTypes: [
            "SOCIAL_ENGINEERING",
            "SOCIAL_ENGINEERING_EXTENDED_COVERAGE",
            "UNWANTED_SOFTWARE",
          ],
          expireTime: "2099-01-01T00:00:00Z",
        },
      }),
    });

    const codes = result.evidence.map((e) => e.code);
    expect(codes).toEqual([
      "web_risk_social_engineering",
      "web_risk_unwanted_software",
    ]);
  });

  it("ignores unrecognised threat types", async () => {
    const result = await checkWebRisk("https://bad.example", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({
        threat: { threatTypes: ["SOMETHING_NEW"] },
      }),
    });

    expect(result.evidence).toHaveLength(0);
  });

  it("treats a non-2xx response as a non-fatal error", async () => {
    const result = await checkWebRisk("https://example.com", {
      apiKey: "test-key",
      fetchImpl: jsonFetch({ error: "quota" }, 429),
    });

    expect(result.checked).toBe(false);
    expect(result.evidence).toHaveLength(0);
    expect(result.error).toBe("web_risk_http_429");
  });

  it("reports a timeout as a non-fatal error", async () => {
    const fetchImpl = vi.fn(async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    }) as unknown as typeof fetch;

    const result = await checkWebRisk("https://example.com", {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.error).toBe("web_risk_timeout");
    expect(result.evidence).toHaveLength(0);
  });

  it("reports a network failure as a non-fatal error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const result = await checkWebRisk("https://example.com", {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result.error).toBe("web_risk_unreachable");
  });

  it("reads the API key from the environment when not passed", async () => {
    process.env.GOOGLE_WEB_RISK_API_KEY = "env-key";
    const fetchImpl = jsonFetch({});

    const result = await checkWebRisk("https://example.com", {
      fetchImpl,
    });

    expect(result.configured).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
