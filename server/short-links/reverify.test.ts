import { describe, expect, it, vi } from "vitest";
import type { LinkVerificationResult } from "@/server/links/service";
import { reverifyStaleShortLinks } from "@/server/short-links/reverify";
import type {
  ShortLinkReverifyRepository,
  ShortLinkReverifyRow,
} from "@/server/short-links/repository";
import type { ShortLinkVerifier } from "@/server/short-links/service";

const NOW = new Date("2026-07-05T03:00:00.000Z");

function verification(
  overrides: Partial<LinkVerificationResult> = {}
): LinkVerificationResult {
  return {
    verdict: "safe",
    confidence: 90,
    normalizedUrl: "https://example.com/page",
    host: "example.com",
    reasons: [],
    evidence: [],
    probe: null,
    ssrfProtected: false,
    cache: { hit: false, cacheable: false, checkedAt: null, expiresAt: null },
    ...overrides,
  };
}

function row(overrides: Partial<ShortLinkReverifyRow> = {}): ShortLinkReverifyRow {
  return {
    id: "sl_1",
    slug: "aB3xK",
    destinationUrl: "https://example.com/page",
    normalizedUrl: "https://example.com/page",
    status: "active",
    lastVerdict: "safe",
    ownerId: "user_1",
    workspaceId: "ws_1",
    ...overrides,
  };
}

function repo(
  rows: readonly ShortLinkReverifyRow[],
  overrides: Partial<ShortLinkReverifyRepository> = {}
): ShortLinkReverifyRepository {
  return {
    findStaleActive: vi.fn(async () => rows),
    applyReverifyResult: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("reverifyStaleShortLinks", () => {
  it("selects links using the staleness window and batch size", async () => {
    const repository = repo([]);

    const summary = await reverifyStaleShortLinks(
      { batchSize: 5, staleAfterDays: 7, now: NOW },
      { repository }
    );

    expect(repository.findStaleActive).toHaveBeenCalledWith({
      staleBefore: new Date("2026-06-28T03:00:00.000Z"),
      take: 5,
    });
    expect(summary).toEqual({ checked: 0, flagged: 0, failed: 0 });
  });

  it("refreshes the verdict for a still-safe link without flagging", async () => {
    const repository = repo([row()]);
    const verify = vi.fn<ShortLinkVerifier>(async () => verification());

    const summary = await reverifyStaleShortLinks(
      { now: NOW },
      { repository, verify }
    );

    expect(repository.applyReverifyResult).toHaveBeenCalledWith({
      id: "sl_1",
      lastVerdict: "safe",
      lastVerifiedAt: NOW,
      status: undefined,
      audit: null,
    });
    expect(summary).toEqual({ checked: 1, flagged: 0, failed: 0 });
  });

  it("flags a destination that turned malicious and audits it", async () => {
    const repository = repo([row()]);
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "malicious" })
    );

    const summary = await reverifyStaleShortLinks(
      { now: NOW },
      { repository, verify }
    );

    expect(repository.applyReverifyResult).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sl_1",
        lastVerdict: "malicious",
        status: "flagged",
        audit: expect.objectContaining({
          workspaceId: "ws_1",
          actorUserId: null,
          action: "update",
          metadata: expect.objectContaining({
            reason: "reverify",
            previousVerdict: "safe",
            nextVerdict: "malicious",
          }),
        }),
      })
    );
    expect(summary.flagged).toBe(1);
  });

  it("still flags a workspace-less link but skips the audit entry", async () => {
    const repository = repo([row({ workspaceId: null, ownerId: null })]);
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "malicious" })
    );

    await reverifyStaleShortLinks({ now: NOW }, { repository, verify });

    expect(repository.applyReverifyResult).toHaveBeenCalledWith(
      expect.objectContaining({ status: "flagged", audit: null })
    );
  });

  it("fails open per link when verification throws", async () => {
    const repository = repo([
      row({ id: "sl_1", slug: "one11" }),
      row({ id: "sl_2", slug: "two22" }),
    ]);
    const verify = vi
      .fn<ShortLinkVerifier>()
      .mockRejectedValueOnce(new Error("intel outage"))
      .mockResolvedValueOnce(verification());

    const summary = await reverifyStaleShortLinks(
      { now: NOW },
      { repository, verify }
    );

    expect(summary).toEqual({ checked: 2, flagged: 0, failed: 1 });
    // The second link is still processed after the first one failed.
    expect(repository.applyReverifyResult).toHaveBeenCalledTimes(1);
    expect(repository.applyReverifyResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sl_2" })
    );
  });
});
