import { describe, expect, it, vi } from "vitest";
import type { LinkVerificationResult } from "@/server/links/service";
import { SHORT_LINK_ERROR_CODE } from "@/server/short-links/constants";
import { ShortLinkError } from "@/server/short-links/errors";
import type {
  ShortLinkCreatedRow,
  ShortLinkDetailRow,
  ShortLinkListRow,
  ShortLinkOwnerRow,
  ShortLinkRepository,
  ShortLinkResolveRow,
} from "@/server/short-links/repository";
import {
  SHORT_LINK_LIST_MAX_TAKE,
  createShortLink,
  deleteShortLink,
  getShortLinkDetail,
  listShortLinks,
  recordShortLinkScan,
  resolveShortLink,
  updateShortLink,
  type ShortLinkVerifier,
} from "@/server/short-links/service";
import { isValidShortLinkSlug } from "@/server/short-links/slugs";
import { getShortLinkErrorStatus } from "@/server/short-links/errors";

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

function createdRow(overrides: Partial<ShortLinkCreatedRow> = {}): ShortLinkCreatedRow {
  return {
    id: "sl_1",
    slug: "aB3xK",
    destinationUrl: LONG_URL,
    normalizedUrl: LONG_URL,
    status: "active",
    verdictAtCreate: "safe",
    lastVerdict: "safe",
    scanCount: 0,
    expiresAt: null,
    createdAt: new Date("2026-05-25T00:00:00.000Z"),
    updatedAt: new Date("2026-05-25T00:00:00.000Z"),
    ...overrides,
  };
}

function ownerRow(overrides: Partial<ShortLinkOwnerRow> = {}): ShortLinkOwnerRow {
  return {
    ...createdRow(),
    ownerId: "user_1",
    workspaceId: "ws_1",
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
      lastVerdict: data.lastVerdict,
      scanCount: 0,
      expiresAt: data.expiresAt ?? null,
      createdAt: new Date("2026-05-25T00:00:00.000Z"),
      updatedAt: new Date("2026-05-25T00:00:00.000Z"),
    })),
    findResolvable: vi.fn(async () => null),
    recordScan: vi.fn(async () => undefined),
    listForOwner: vi.fn(async () => []),
    findDetailForOwner: vi.fn(async () => null),
    findForOwner: vi.fn(async () => null),
    updateForOwner: vi.fn(async () => createdRow()),
    softDeleteForOwner: vi.fn(async () => true),
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
            code: "web_risk_malware",
            source: "web_risk",
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

function listRow(
  overrides: Partial<ShortLinkListRow> = {}
): ShortLinkListRow {
  return {
    id: "sl_1",
    slug: "aB3xK",
    destinationUrl: LONG_URL,
    normalizedUrl: LONG_URL,
    status: "active",
    verdictAtCreate: "safe",
    lastVerdict: "safe",
    scanCount: 0,
    expiresAt: null,
    createdAt: new Date("2026-05-25T00:00:00.000Z"),
    updatedAt: new Date("2026-05-25T00:00:00.000Z"),
    ...overrides,
  };
}

function detailRow(
  overrides: Partial<ShortLinkDetailRow> = {}
): ShortLinkDetailRow {
  return {
    ...listRow(),
    scans: [],
    ...overrides,
  };
}

describe("listShortLinks", () => {
  it("filters to the caller's owner id and orders by the repository", async () => {
    const rows = [listRow({ id: "sl_1" }), listRow({ id: "sl_2" })];
    const listForOwner = vi.fn(async () => rows);
    const repository = repo({ listForOwner });

    const result = await listShortLinks(
      { ownerId: "user_42" },
      { repository }
    );

    expect(listForOwner).toHaveBeenCalledWith({
      ownerId: "user_42",
      workspaceId: undefined,
      take: 25,
      cursorId: undefined,
    });
    expect(result.shortLinks).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it("returns a nextCursor when the page is full", async () => {
    const rows = Array.from({ length: 25 }, (_, i) =>
      listRow({ id: `sl_${i}` })
    );
    const repository = repo({ listForOwner: vi.fn(async () => rows) });

    const result = await listShortLinks(
      { ownerId: "user_42", take: 25 },
      { repository }
    );

    expect(result.nextCursor).toBe("sl_24");
  });

  it("clamps an over-large take to the max", async () => {
    const listForOwner = vi.fn(async () => []);
    const repository = repo({ listForOwner });

    await listShortLinks(
      { ownerId: "user_42", take: 9999 },
      { repository }
    );

    expect(listForOwner).toHaveBeenCalledWith(
      expect.objectContaining({ take: SHORT_LINK_LIST_MAX_TAKE })
    );
  });
});

describe("getShortLinkDetail", () => {
  it("returns the detail row when the caller owns it", async () => {
    const repository = repo({
      findDetailForOwner: vi.fn(async () => detailRow({ id: "sl_x" })),
    });

    const result = await getShortLinkDetail(
      { id: "sl_x", ownerId: "user_42" },
      { repository }
    );

    expect(result?.id).toBe("sl_x");
  });

  it("returns null when the caller does not own the row", async () => {
    const repository = repo({
      findDetailForOwner: vi.fn(async () => null),
    });

    const result = await getShortLinkDetail(
      { id: "sl_x", ownerId: "user_42" },
      { repository }
    );

    expect(result).toBeNull();
  });
});

describe("getShortLinkErrorStatus", () => {
  it("maps each error code to a stable HTTP status", () => {
    expect(getShortLinkErrorStatus(SHORT_LINK_ERROR_CODE.INVALID_URL)).toBe(400);
    expect(getShortLinkErrorStatus(SHORT_LINK_ERROR_CODE.URL_ALREADY_SHORT)).toBe(
      422
    );
    expect(getShortLinkErrorStatus(SHORT_LINK_ERROR_CODE.BLOCKED)).toBe(409);
    expect(
      getShortLinkErrorStatus(SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE)
    ).toBe(409);
    expect(getShortLinkErrorStatus(SHORT_LINK_ERROR_CODE.MINT_FAILED)).toBe(503);
  });
});

describe("recordShortLinkScan", () => {
  it("counts human scans toward the scan count", async () => {
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

    expect(repository.recordScan).toHaveBeenCalledWith("sl_1", telemetry, true);
  });

  it("records bot scans without inflating the scan count", async () => {
    const repository = repo();
    const telemetry = {
      deviceClass: "bot",
      browser: "unknown",
      operatingSystem: "unknown",
      referrer: null,
      country: null,
      region: null,
      ipHash: null,
      userAgentHash: null,
    };

    await recordShortLinkScan(
      { shortLinkId: "sl_1", telemetry },
      { repository }
    );

    expect(repository.recordScan).toHaveBeenCalledWith(
      "sl_1",
      telemetry,
      false
    );
  });
});

describe("updateShortLink", () => {
  it("re-verifies a destination change and writes a destination audit", async () => {
    const repository = repo({
      findForOwner: vi.fn(async () => ownerRow()),
    });
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ normalizedUrl: "https://next.example/promo" })
    );

    await updateShortLink(
      {
        id: "sl_1",
        ownerId: "user_1",
        destinationUrl: "https://next.example/promo",
      },
      { repository, verify }
    );

    expect(verify).toHaveBeenCalledWith({
      url: "https://next.example/promo",
    });
    expect(repository.updateForOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sl_1",
        ownerId: "user_1",
        data: expect.objectContaining({
          destinationUrl: "https://next.example/promo",
          normalizedUrl: "https://next.example/promo",
          lastVerdict: "safe",
        }),
        audit: expect.objectContaining({
          workspaceId: "ws_1",
          actorUserId: "user_1",
          action: "destination.change",
          metadata: expect.objectContaining({
            previousUrl: LONG_URL,
            nextUrl: "https://next.example/promo",
            slug: "aB3xK",
          }),
        }),
      })
    );
  });

  it("blocks a malicious new destination", async () => {
    const repository = repo({
      findForOwner: vi.fn(async () => ownerRow()),
    });
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "malicious" })
    );

    await expectError(
      () =>
        updateShortLink(
          {
            id: "sl_1",
            ownerId: "user_1",
            destinationUrl: "https://evil.example/",
          },
          { repository, verify }
        ),
      SHORT_LINK_ERROR_CODE.BLOCKED
    );
    expect(repository.updateForOwner).not.toHaveBeenCalled();
  });

  it("requires an acknowledgement for a suspicious new destination", async () => {
    const repository = repo({
      findForOwner: vi.fn(async () => ownerRow()),
    });
    const verify = vi.fn<ShortLinkVerifier>(async () =>
      verification({ verdict: "suspicious" })
    );

    await expectError(
      () =>
        updateShortLink(
          {
            id: "sl_1",
            ownerId: "user_1",
            destinationUrl: "https://sketchy.example/",
          },
          { repository, verify }
        ),
      SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE
    );

    await updateShortLink(
      {
        id: "sl_1",
        ownerId: "user_1",
        destinationUrl: "https://sketchy.example/",
        acknowledgedSuspicious: true,
      },
      { repository, verify }
    );
    expect(repository.updateForOwner).toHaveBeenCalledOnce();
  });

  it("refuses to manually re-enable a flagged link", async () => {
    const repository = repo({
      findForOwner: vi.fn(async () => ownerRow({ status: "flagged" })),
    });

    await expectError(
      () =>
        updateShortLink(
          { id: "sl_1", ownerId: "user_1", status: "active" },
          { repository }
        ),
      SHORT_LINK_ERROR_CODE.BLOCKED
    );
  });

  it("backfills the workspace for a workspace-less link before auditing", async () => {
    const repository = repo({
      findForOwner: vi.fn(async () => ownerRow({ workspaceId: null })),
    });
    const resolveAuditWorkspaceId = vi.fn(async () => "ws_default");

    await updateShortLink(
      { id: "sl_1", ownerId: "user_1", status: "disabled" },
      { repository, resolveAuditWorkspaceId }
    );

    expect(resolveAuditWorkspaceId).toHaveBeenCalledWith("user_1");
    expect(repository.updateForOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "disabled",
          workspaceId: "ws_default",
        }),
        audit: expect.objectContaining({ workspaceId: "ws_default" }),
      })
    );
  });

  it("throws NOT_FOUND for another owner's link", async () => {
    const repository = repo();

    await expectError(
      () =>
        updateShortLink(
          { id: "sl_x", ownerId: "user_1", status: "disabled" },
          { repository }
        ),
      SHORT_LINK_ERROR_CODE.NOT_FOUND
    );
    expect(getShortLinkErrorStatus(SHORT_LINK_ERROR_CODE.NOT_FOUND)).toBe(404);
  });
});

describe("deleteShortLink", () => {
  it("soft-deletes with a delete audit entry", async () => {
    const repository = repo({
      findForOwner: vi.fn(async () => ownerRow()),
    });

    await deleteShortLink({ id: "sl_1", ownerId: "user_1" }, { repository });

    expect(repository.softDeleteForOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sl_1",
        ownerId: "user_1",
        audit: expect.objectContaining({
          action: "delete",
          workspaceId: "ws_1",
          metadata: expect.objectContaining({ slug: "aB3xK" }),
        }),
      })
    );
  });

  it("throws NOT_FOUND when the link does not exist for this owner", async () => {
    const repository = repo();

    await expectError(
      () => deleteShortLink({ id: "sl_x", ownerId: "user_1" }, { repository }),
      SHORT_LINK_ERROR_CODE.NOT_FOUND
    );
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
