import { describe, expect, it, vi } from "vitest";
import type { LinkVerificationResult } from "@/server/links/service";
import { SHORT_LINK_ERROR_CODE } from "@/server/short-links/constants";
import { ShortLinkError } from "@/server/short-links/errors";
import type {
  ShortLinkRepository,
  ShortLinkResolveRow,
} from "@/server/short-links/repository";
import {
  createShortLink,
  recordShortLinkScan,
  resolveShortLink,
  type ShortLinkVerifier,
} from "@/server/short-links/service";
import { isValidShortLinkSlug } from "@/server/short-links/slugs";

const LONG_URL = `https://example.com/${"a".repeat(100)}`; // 120 chars

function verification(
  overrides: Partial<LinkVerificationResult> = {}
): LinkVerificationResult {
  return {
    verdict: "safe",
    confidence: 90,
    normalizedUrl: LONG_URL,
    host: "example.com",
    reasons: [],
    evidence: [],
    probe: null,
    ssrfProtected: false,
    cache: { hit: false, cacheable: false, checkedAt: null, expiresAt: null },
    ...overrides,
  };
}

function repo(overrides: Partial<ShortLinkRepository> = {}): ShortLinkRepository {
  return {
    isSlugAvailable: vi.fn(async () => true),
    create: vi.fn(async (data) => ({
      id: "sl_1",
      slug: data.slug,
      destinationUrl: data.destinationUrl,
      normalizedUrl: data.normalizedUrl,
      status: data.status,
      verdictAtCreate: data.verdictAtCreate,
      scanCount: 0,
      expiresAt: data.expiresAt ?? null,
      createdAt: new Date("2026-05-25T00:00:00.000Z"),
    })),
    findResolvable: vi.fn(async () => null),
    recordScan: vi.fn(async () => undefined),
    ...overrides,
  };
}

function resolveRow(
  overrides: Partial<ShortLinkResolveRow> = {}
): ShortLinkResolveRow {
  return {
    id: "sl_1",
    slug: "aB3xK",
    destinationUrl: LONG_URL,
    normalizedUrl: LONG_URL,
    status: "active",
    expiresAt: null,
    ...overrides,
  };
}

describe("createShortLink", () => {
  it("mints a slug that is at least 3x shorter for a clean long URL", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () => verification());

    const result = await createShortLink(
      { url: LONG_URL },
      { repository, verify }
    );

    expect(isValidShortLinkSlug(result.slug)).toBe(true);
    expect(result.shortUrl.length).toBeLessThanOrEqual(
      Math.floor(LONG_URL.length / 3)
    );
    expect(result.verdict).toBe("safe");
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it("blocks a malicious destination and writes no row", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "malicious" })
    );

    await expectError(
      () => createShortLink({ url: LONG_URL }, { repository, verify }),
      SHORT_LINK_ERROR_CODE.BLOCKED
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("requires an override for a suspicious destination", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "suspicious" })
    );

    await expectError(
      () => createShortLink({ url: LONG_URL }, { repository, verify }),
      SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("allows a suspicious destination with an authenticated override", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "suspicious" })
    );

    const result = await createShortLink(
      { url: LONG_URL, ownerId: "user_1", acknowledgedSuspicious: true },
      { repository, verify }
    );

    expect(result.verdict).toBe("suspicious");
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it("does not allow an anonymous override of a suspicious destination", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "suspicious" })
    );

    await expectError(
      () =>
        createShortLink(
          { url: LONG_URL, acknowledgedSuspicious: true },
          { repository, verify }
        ),
      SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE
    );
  });

  it("refuses a URL that is already short", async () => {
    const repository = repo();
    const shortUrl = "https://a.co";
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ normalizedUrl: shortUrl })
    );

    await expectError(
      () => createShortLink({ url: shortUrl }, { repository, verify }),
      SHORT_LINK_ERROR_CODE.URL_ALREADY_SHORT
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects an unparseable URL", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "suspicious", normalizedUrl: null })
    );

    await expectError(
      () => createShortLink({ url: "http://[::1" }, { repository, verify }),
      SHORT_LINK_ERROR_CODE.INVALID_URL
    );
  });

  it("includes an evidence summary on a block", async () => {
    const repository = repo();
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({
        verdict: "malicious",
        confidence: 95,
        evidence: [
          {
            code: "safe_browsing_malware",
            source: "safe_browsing",
            severity: "critical",
            message: "Flagged for malware.",
            observedAt: "2026-05-25T00:00:00.000Z",
          },
        ],
      })
    );

    try {
      await createShortLink({ url: LONG_URL }, { repository, verify });
      throw new Error("expected createShortLink to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ShortLinkError);
      if (error instanceof ShortLinkError) {
        expect(error.summary?.topConcerns).toContain("Flagged for malware.");
        expect(error.summary?.signalCount).toBe(1);
      }
    }
  });
});

describe("resolveShortLink", () => {
  it("redirects an active link to its normalized destination", async () => {
    const repository = repo({
      findResolvable: vi.fn(async () => resolveRow()),
    });

    const result = await resolveShortLink("aB3xK", { repository });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.link.destinationUrl).toBe(LONG_URL);
    }
  });

  it("returns not_found for a missing slug", async () => {
    const repository = repo({ findResolvable: vi.fn(async () => null) });

    const result = await resolveShortLink("missing", { repository });

    expect(result.status).toBe("not_found");
  });

  it("returns expired for a past expiry", async () => {
    const repository = repo({
      findResolvable: vi.fn(async () =>
        resolveRow({ expiresAt: new Date("2020-01-01T00:00:00.000Z") })
      ),
    });

    const result = await resolveShortLink(
      "aB3xK",
      { repository },
      new Date("2026-05-25T00:00:00.000Z")
    );

    expect(result.status).toBe("expired");
  });

  it("blocks a flagged link", async () => {
    const repository = repo({
      findResolvable: vi.fn(async () => resolveRow({ status: "flagged" })),
    });

    const result = await resolveShortLink("aB3xK", { repository });

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") expect(result.reason).toBe("flagged");
  });

  it("blocks a disabled link", async () => {
    const repository = repo({
      findResolvable: vi.fn(async () => resolveRow({ status: "disabled" })),
    });

    const result = await resolveShortLink("aB3xK", { repository });

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") expect(result.reason).toBe("disabled");
  });
});

describe("recordShortLinkScan", () => {
  it("delegates to the repository", async () => {
    const repository = repo();
    const telemetry = {
      deviceClass: "desktop",
      browser: "chrome",
      operatingSystem: "macos",
      referrer: null,
      country: null,
      region: null,
      ipHash: "hash",
      userAgentHash: "ua",
    };

    await recordShortLinkScan(
      { shortLinkId: "sl_1", telemetry },
      { repository }
    );

    expect(repository.recordScan).toHaveBeenCalledWith("sl_1", telemetry);
  });
});

async function expectError(
  run: () => Promise<unknown>,
  code: string
): Promise<void> {
  try {
    await run();
    throw new Error("expected the call to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(ShortLinkError);
    if (error instanceof ShortLinkError) {
      expect(error.code).toBe(code);
    }
  }
}
