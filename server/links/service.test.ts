import { beforeEach, describe, expect, it, vi } from "vitest";
import { LINK_VERDICT } from "@/server/links/constants";
import type { ProbeSummary } from "@/server/links/evidence";
import type { WebRiskResult } from "@/server/links/webRisk";
import {
  verifyLink,
  type ProbeRunner,
  type WebRiskRunner,
} from "@/server/links/service";
import type {
  LinkCheckRecord,
  LinkCheckRepository,
  LinkCheckTiming,
} from "@/server/links/repository";

// Keep Web Risk unconfigured by default so the probe-focused tests are
// deterministic and never touch the network. Web-Risk-specific tests inject
// their own runner.
beforeEach(() => {
  delete process.env.GOOGLE_WEB_RISK_API_KEY;
});

describe("verifyLink", () => {
  it("stores a probe-backed verdict and reports it cacheable", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const upsertVerdict = vi.fn(async () => getLinkCheckRecord(now));
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict,
    };
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe }
    );

    expect(result.verdict).toBe(LINK_VERDICT.SAFE);
    expect(result.probe).not.toBeNull();
    expect(result.ssrfProtected).toBe(true);
    expect(result.cache).toMatchObject({
      hit: false,
      cacheable: true,
      checkedAt: now.toISOString(),
    });
    expect(probe).toHaveBeenCalledOnce();
    expect(upsertVerdict).toHaveBeenCalledOnce();
  });

  it("returns cached verdicts without re-probing or re-writing", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const cachedRecord = getLinkCheckRecord(now);
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => cachedRecord),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe }
    );

    expect(result.cache.hit).toBe(true);
    expect(result.normalizedUrl).toBe(cachedRecord.normalizedUrl);
    expect(probe).not.toHaveBeenCalled();
    expect(repository.upsertVerdict).not.toHaveBeenCalled();
  });

  it("does not cache or probe malformed URLs", async () => {
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "http://[::1" },
      { repository, probe }
    );

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(result.cache).toMatchObject({ hit: false, cacheable: false });
    expect(repository.findFreshByNormalizedUrl).not.toHaveBeenCalled();
    expect(repository.upsertVerdict).not.toHaveBeenCalled();
    expect(probe).not.toHaveBeenCalled();
  });

  it("returns an uncached probe verdict when persistence is unavailable", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => {
        throw new Error("Database unavailable");
      }),
      upsertVerdict: vi.fn(async () => {
        throw new Error("Database unavailable");
      }),
    };
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe }
    );

    expect(result.verdict).toBe(LINK_VERDICT.SAFE);
    expect(result.probe).not.toBeNull();
    expect(result.cache).toMatchObject({
      hit: false,
      cacheable: false,
      checkedAt: now.toISOString(),
      expiresAt: null,
    });
  });

  it("skips the probe and stays uncacheable when skipProbe is set", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "https://example.com", now, skipProbe: true },
      { repository, probe }
    );

    expect(result.probe).toBeNull();
    expect(result.ssrfProtected).toBe(false);
    expect(result.cache.cacheable).toBe(false);
    expect(probe).not.toHaveBeenCalled();
    expect(repository.upsertVerdict).not.toHaveBeenCalled();
  });

  it("honours a cache hit even when skipProbe is set", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const cachedRecord = getLinkCheckRecord(now);
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => cachedRecord),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "https://example.com", now, skipProbe: true },
      { repository, probe }
    );

    expect(result.cache.hit).toBe(true);
    expect(probe).not.toHaveBeenCalled();
  });

  it("does not probe when heuristics already condemn the URL", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "http://192.168.1.10/admin", now },
      { repository, probe }
    );

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(probe).not.toHaveBeenCalled();
    expect(result.cache.cacheable).toBe(false);
  });

  it("merges probe evidence and raises confidence for a clean destination", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(async () => getLinkCheckRecord(now)),
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe }
    );

    const codes = result.evidence.map((entry) => entry.code);
    expect(codes).toContain("probe_clean_response");
    expect(codes).toContain("tls_valid");
    // Heuristic-only SAFE is 40; corroborating probe + TLS sources lift it.
    expect(result.confidence).toBeGreaterThan(40);
  });

  it("returns malicious when the probe is blocked by a private-network redirect", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => blockedProbe());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(async () => getLinkCheckRecord(now)),
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe }
    );

    expect(result.verdict).toBe("malicious");
  });

  it("escalates to malicious on a Web Risk match", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const webRisk = vi.fn<WebRiskRunner>(async () => webRiskMalware());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(async () => getLinkCheckRecord(now)),
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe, webRisk }
    );

    expect(result.verdict).toBe("malicious");
    expect(result.evidence.map((e) => e.code)).toContain(
      "web_risk_malware"
    );
  });

  it("includes a clean Web Risk signal and persists its TTL", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const webRisk = vi.fn<WebRiskRunner>(async () => webRiskClean());
    const persistedTiming: { current: LinkCheckTiming | null } = {
      current: null,
    };
    const upsertVerdict: LinkCheckRepository["upsertVerdict"] = vi.fn(
      async (_input, timing) => {
        persistedTiming.current = timing;

        return getLinkCheckRecord(now);
      }
    );
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict,
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      { repository, probe, webRisk }
    );

    expect(result.evidence.map((e) => e.code)).toContain("web_risk_clean");
    expect(persistedTiming.current?.threatIntelTtl).toBeInstanceOf(Date);
  });

  it("does not query Web Risk for private hosts", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const webRisk = vi.fn<WebRiskRunner>(async () => webRiskClean());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "http://192.168.1.10/admin", now },
      { repository, probe, webRisk }
    );

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(webRisk).not.toHaveBeenCalled();
    expect(probe).not.toHaveBeenCalled();
  });

  it("skips Web Risk when skipProbe is set", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const webRisk = vi.fn<WebRiskRunner>(async () => webRiskClean());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(),
    };

    await verifyLink(
      { url: "https://example.com", now, skipProbe: true },
      { repository, webRisk }
    );

    expect(webRisk).not.toHaveBeenCalled();
  });

  it("queries Web Risk on a suspicious public URL without probing it", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const probe = vi.fn<ProbeRunner>(async () => cleanProbe());
    const webRisk = vi.fn<WebRiskRunner>(async () => webRiskMalware());
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict: vi.fn(async () => getLinkCheckRecord(now)),
    };

    const result = await verifyLink(
      { url: "https://paypal-secure.example.com/login", now },
      { repository, probe, webRisk }
    );

    expect(probe).not.toHaveBeenCalled();
    expect(webRisk).toHaveBeenCalledOnce();
    expect(result.verdict).toBe("malicious");
  });
});

function cleanProbe(url = "https://example.com/"): ProbeSummary {
  return {
    initialUrl: url,
    finalUrl: url,
    redirectChain: [{ url, status: 200 }],
    httpStatus: 200,
    contentType: "text/html",
    tls: {
      issuer: "O=Let's Encrypt, CN=R3",
      subject: "CN=example.com",
      validFrom: "Jan  1 00:00:00 2026 GMT",
      validTo: "Dec 31 00:00:00 2026 GMT",
      daysToExpiry: 90,
      selfSigned: false,
      hostnameMatches: true,
    },
    durationMs: 120,
    truncated: false,
    error: null,
  };
}

function blockedProbe(url = "https://example.com/"): ProbeSummary {
  return {
    initialUrl: url,
    finalUrl: url,
    redirectChain: [{ url, status: 301 }],
    httpStatus: 301,
    contentType: null,
    tls: null,
    durationMs: 80,
    truncated: false,
    error: "redirect_to_private_network",
  };
}

function getLinkCheckRecord(now: Date): LinkCheckRecord {
  return {
    id: "link_check_123",
    normalizedUrl: "https://example.com/",
    verdict: LINK_VERDICT.SAFE,
    // The wire confidence is re-derived from evidence on read, so the
    // value persisted in this column is informational only.
    confidence: 40,
    reasons: [],
    evidence: [],
    probeSummary: cleanProbe() as unknown as LinkCheckRecord["probeSummary"],
    threatIntelTtl: null,
    checkedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  };
}

function webRiskClean(): WebRiskResult {
  return {
    configured: true,
    checked: true,
    evidence: [
      {
        code: "web_risk_clean",
        source: "web_risk",
        severity: "info",
        message: "No record in Web Risk.",
        observedAt: "2026-05-18T00:00:00.000Z",
      },
    ],
    cacheTtlMs: 6 * 60 * 60 * 1000,
    error: null,
  };
}

function webRiskMalware(): WebRiskResult {
  return {
    configured: true,
    checked: true,
    evidence: [
      {
        code: "web_risk_malware",
        source: "web_risk",
        severity: "critical",
        message: "Flagged for malware.",
        observedAt: "2026-05-18T00:00:00.000Z",
        data: { threat_type: "MALWARE" },
      },
    ],
    cacheTtlMs: 5 * 60 * 1000,
    error: null,
  };
}
