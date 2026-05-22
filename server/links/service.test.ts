import { describe, expect, it, vi } from "vitest";
import { LINK_VERDICT } from "@/server/links/constants";
import { verifyLink } from "@/server/links/service";
import type {
  LinkCheckRecord,
  LinkCheckRepository,
} from "@/server/links/repository";

describe("verifyLink", () => {
  it("returns fresh cache metadata and stores cacheable verdicts", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const upsertVerdict = vi.fn(async () => getLinkCheckRecord(now));
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => null),
      upsertVerdict,
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      repository
    );

    expect(result.verdict).toBe(LINK_VERDICT.SAFE);
    expect(result.cache).toMatchObject({
      hit: false,
      cacheable: true,
      checkedAt: now.toISOString(),
    });
    expect(upsertVerdict).toHaveBeenCalledOnce();
  });

  it("returns cached verdicts when a fresh cache entry exists", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const cachedRecord = getLinkCheckRecord(now);
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => cachedRecord),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      repository
    );

    expect(result.cache.hit).toBe(true);
    expect(result.normalizedUrl).toBe(cachedRecord.normalizedUrl);
    expect(repository.upsertVerdict).not.toHaveBeenCalled();
  });

  it("does not cache malformed URLs", async () => {
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink({ url: "http://[::1" }, repository);

    expect(result.verdict).toBe(LINK_VERDICT.SUSPICIOUS);
    expect(result.cache).toMatchObject({ hit: false, cacheable: false });
    expect(repository.findFreshByNormalizedUrl).not.toHaveBeenCalled();
    expect(repository.upsertVerdict).not.toHaveBeenCalled();
  });

  it("returns an uncached server verdict when persistence is unavailable", async () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const repository: LinkCheckRepository = {
      findFreshByNormalizedUrl: vi.fn(async () => {
        throw new Error("Database unavailable");
      }),
      upsertVerdict: vi.fn(),
    };

    const result = await verifyLink(
      { url: "https://example.com", now },
      repository
    );

    expect(result.verdict).toBe(LINK_VERDICT.SAFE);
    expect(result.cache).toMatchObject({
      hit: false,
      cacheable: false,
      checkedAt: now.toISOString(),
      expiresAt: null,
    });
    expect(repository.upsertVerdict).not.toHaveBeenCalled();
  });
});

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
    probeSummary: null,
    checkedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  };
}
