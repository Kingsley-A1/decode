import "server-only";

import { getPublicAppBaseUrl } from "@/server/config/public-url";
import { SCAN_BOT_DEVICE_CLASS } from "@/server/analytics/constants";
import type { ScanTelemetry } from "@/server/analytics/scan";
import type {
  Evidence,
  EvidenceSeverity,
} from "@/server/links/evidence";
import { verifyLink, type LinkVerificationResult } from "@/server/links/service";
import {
  SHORT_LINK_ERROR_CODE,
  SHORT_LINK_STATUS,
  type ShortLinkEvidenceSummary,
} from "@/server/short-links/constants";
import { ShortLinkError } from "@/server/short-links/errors";
import { AUDIT_ACTION } from "@/server/audit/constants";
import {
  prismaShortLinkRepository,
  type ShortLinkCreatedRow,
  type ShortLinkDetailRow,
  type ShortLinkListRow,
  type ShortLinkRepository,
  type UpdateShortLinkData,
} from "@/server/short-links/repository";
import { getDefaultWorkspaceForUser } from "@/server/workspaces/repository";
import { createDefaultWorkspaceForUser } from "@/server/workspaces/service";
import {
  SHORT_LINK_BASE_PREFIX,
  computeShortLinkLengthPolicy,
  getShortLinkUrl,
  mintShortLinkSlug,
  normalizeShortLinkSlug,
} from "@/server/short-links/slugs";

export type ShortLinkVerifier = (input: {
  readonly url: string;
}) => Promise<LinkVerificationResult>;

export interface ShortLinkServiceDeps {
  readonly repository?: ShortLinkRepository;
  readonly verify?: ShortLinkVerifier;
  /** Resolves the workspace that owns audit entries for this user's links. */
  readonly resolveAuditWorkspaceId?: (ownerId: string) => Promise<string>;
}

export interface CreateShortLinkInput {
  readonly url: string;
  readonly ownerId?: string | null;
  readonly workspaceId?: string | null;
  /** Authenticated callers may proceed past a `suspicious` verdict. */
  readonly acknowledgedSuspicious?: boolean;
  readonly expiresAt?: Date | null;
  readonly now?: Date;
}

export interface CreateShortLinkResult {
  readonly slug: string;
  readonly shortUrl: string;
  readonly verdict: string;
  readonly confidence: number;
  readonly evidenceSummary: ShortLinkEvidenceSummary;
  readonly row: ShortLinkCreatedRow;
}

export type ResolveShortLinkResult =
  | { readonly status: "ok"; readonly link: ResolvedShortLink }
  | { readonly status: "not_found" }
  | { readonly status: "expired" }
  | {
      readonly status: "blocked";
      readonly reason: "flagged" | "disabled";
      readonly linkId: string;
    };

export interface ResolvedShortLink {
  readonly id: string;
  readonly destinationUrl: string;
}

export async function createShortLink(
  input: CreateShortLinkInput,
  deps: ShortLinkServiceDeps = {}
): Promise<CreateShortLinkResult> {
  const repository = deps.repository ?? prismaShortLinkRepository;
  const verify = deps.verify ?? ((args) => verifyLink(args));
  const now = input.now ?? new Date();
  const url = input.url.trim();

  // 1. Run the same verification pipeline the verifier UI uses.
  const verification = await verify({ url });
  const summary = summarizeVerification(verification);

  // 2. Unparseable URLs cannot be stored or redirected to.
  if (!verification.normalizedUrl) {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.INVALID_URL,
      "This URL could not be parsed and cannot be shortened.",
      summary
    );
  }

  // 3. A confirmed-malicious destination is never shortened.
  if (verification.verdict === "malicious") {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.BLOCKED,
      "This destination was flagged as malicious and cannot be shortened.",
      summary
    );
  }

  // 4. A suspicious destination needs an authenticated, explicit override.
  if (verification.verdict === "suspicious") {
    const authorizedOverride =
      input.acknowledgedSuspicious === true && Boolean(input.ownerId);
    if (!authorizedOverride) {
      throw new ShortLinkError(
        SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE,
        "This destination looks suspicious. Sign in and confirm to shorten it anyway.",
        summary
      );
    }
  }

  // 5. Enforce the 3x-shorter promise against the URL the user supplied.
  const baseUrl = getPublicAppBaseUrl();
  const shortBaseLength = `${baseUrl}${SHORT_LINK_BASE_PREFIX}`.length;
  const policy = computeShortLinkLengthPolicy({
    longUrlLength: url.length,
    shortBaseLength,
  });
  if (!policy.ok) {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.URL_ALREADY_SHORT,
      "This URL is already short — Decode will not shorten it.",
      summary
    );
  }

  // 6. Mint a unique slug, never exceeding the length the promise allows.
  let slug: string;
  try {
    slug = await mintShortLinkSlug({
      length: policy.recommendedSlugLength,
      maxLength: policy.maxSlugLength,
      isAvailable: (candidate) => repository.isSlugAvailable(candidate),
    });
  } catch {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.MINT_FAILED,
      "Could not allocate a unique short link. Please try again.",
      summary
    );
  }

  // 7. Persist. The destination we redirect to is the verifier-normalized URL.
  const row = await repository.create({
    slug,
    destinationUrl: url,
    normalizedUrl: verification.normalizedUrl,
    status: SHORT_LINK_STATUS.ACTIVE,
    verdictAtCreate: verification.verdict,
    lastVerdict: verification.verdict,
    lastVerifiedAt: now,
    ownerId: input.ownerId ?? null,
    workspaceId: input.workspaceId ?? null,
    expiresAt: input.expiresAt ?? null,
  });

  return {
    slug,
    shortUrl: getShortLinkUrl(slug, baseUrl),
    verdict: verification.verdict,
    confidence: verification.confidence,
    evidenceSummary: summary,
    row,
  };
}

export async function resolveShortLink(
  slugInput: string,
  deps: ShortLinkServiceDeps = {},
  now: Date = new Date()
): Promise<ResolveShortLinkResult> {
  const repository = deps.repository ?? prismaShortLinkRepository;
  const slug = normalizeShortLinkSlug(slugInput);
  if (!slug) return { status: "not_found" };

  const row = await repository.findResolvable(slug);
  if (!row) return { status: "not_found" };

  if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) {
    return { status: "expired" };
  }

  if (row.status === SHORT_LINK_STATUS.FLAGGED) {
    return { status: "blocked", reason: "flagged", linkId: row.id };
  }
  if (row.status === SHORT_LINK_STATUS.DISABLED) {
    return { status: "blocked", reason: "disabled", linkId: row.id };
  }

  return {
    status: "ok",
    link: {
      id: row.id,
      // Redirect to the verifier-normalized URL — the canonical destination.
      destinationUrl: row.normalizedUrl || row.destinationUrl,
    },
  };
}

export async function recordShortLinkScan(
  input: { readonly shortLinkId: string; readonly telemetry: ScanTelemetry },
  deps: ShortLinkServiceDeps = {}
): Promise<void> {
  const repository = deps.repository ?? prismaShortLinkRepository;
  // Bots are recorded for transparency but excluded from the human-facing
  // scan count, matching the dynamic QR scan pipeline.
  const countsTowardScanCount =
    input.telemetry.deviceClass !== SCAN_BOT_DEVICE_CLASS;

  await repository.recordScan(
    input.shortLinkId,
    input.telemetry,
    countsTowardScanCount
  );
}

export interface UpdateShortLinkInput {
  readonly id: string;
  readonly ownerId: string;
  readonly destinationUrl?: string;
  /** Owners may pause or resume a link; `flagged` is verifier-owned. */
  readonly status?: "active" | "disabled";
  /** `undefined` leaves the expiry unchanged; `null` clears it. */
  readonly expiresAt?: Date | null;
  readonly acknowledgedSuspicious?: boolean;
  readonly now?: Date;
}

export async function updateShortLink(
  input: UpdateShortLinkInput,
  deps: ShortLinkServiceDeps = {}
): Promise<ShortLinkCreatedRow> {
  const repository = deps.repository ?? prismaShortLinkRepository;
  const verify = deps.verify ?? ((args) => verifyLink(args));
  const resolveWorkspace =
    deps.resolveAuditWorkspaceId ?? resolveAuditWorkspaceIdForOwner;
  const now = input.now ?? new Date();

  const row = await repository.findForOwner({
    id: input.id,
    ownerId: input.ownerId,
  });
  if (!row) {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.NOT_FOUND,
      "Short link not found."
    );
  }

  const data: Mutable<UpdateShortLinkData> = {};
  const changes: Record<string, unknown> = {};
  let action: (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION] =
    AUDIT_ACTION.UPDATE;
  let summary: ShortLinkEvidenceSummary | undefined;

  if (input.destinationUrl !== undefined) {
    const url = input.destinationUrl.trim();
    // A destination change goes through the same verification gates as
    // creation. The 3x-shorter policy is deliberately not re-applied: the
    // slug is already minted and distributed.
    const verification = await verify({ url });
    summary = summarizeVerification(verification);

    if (!verification.normalizedUrl) {
      throw new ShortLinkError(
        SHORT_LINK_ERROR_CODE.INVALID_URL,
        "This URL could not be parsed and cannot be used as a destination.",
        summary
      );
    }
    if (verification.verdict === "malicious") {
      throw new ShortLinkError(
        SHORT_LINK_ERROR_CODE.BLOCKED,
        "This destination was flagged as malicious and cannot be used.",
        summary
      );
    }
    if (
      verification.verdict === "suspicious" &&
      input.acknowledgedSuspicious !== true
    ) {
      throw new ShortLinkError(
        SHORT_LINK_ERROR_CODE.REQUIRES_OVERRIDE,
        "This destination looks suspicious. Confirm to use it anyway.",
        summary
      );
    }

    data.destinationUrl = url;
    data.normalizedUrl = verification.normalizedUrl;
    data.lastVerdict = verification.verdict;
    data.lastVerifiedAt = now;
    // A clean destination change reactivates a verifier-flagged link.
    if (row.status === SHORT_LINK_STATUS.FLAGGED) {
      data.status = SHORT_LINK_STATUS.ACTIVE;
    }
    action = AUDIT_ACTION.DESTINATION_CHANGE;
    changes.previousUrl = row.destinationUrl;
    changes.nextUrl = url;
  }

  if (input.status !== undefined && input.status !== row.status) {
    // A flagged link cannot be manually re-enabled: only a destination
    // change (which re-verifies) clears the flag.
    if (
      row.status === SHORT_LINK_STATUS.FLAGGED &&
      data.destinationUrl === undefined
    ) {
      throw new ShortLinkError(
        SHORT_LINK_ERROR_CODE.BLOCKED,
        "This link was flagged by verification. Change its destination to reactivate it."
      );
    }

    data.status = input.status;
    changes.status = { previous: row.status, next: input.status };
  }

  if (input.expiresAt !== undefined) {
    data.expiresAt = input.expiresAt;
    changes.expiresAt = {
      previous: row.expiresAt?.toISOString() ?? null,
      next: input.expiresAt?.toISOString() ?? null,
    };
  }

  if (Object.keys(data).length === 0) {
    return row;
  }

  const workspaceId = row.workspaceId ?? (await resolveWorkspace(input.ownerId));
  if (!row.workspaceId) {
    data.workspaceId = workspaceId;
  }

  const updated = await repository.updateForOwner({
    id: input.id,
    ownerId: input.ownerId,
    data,
    audit: {
      workspaceId,
      actorUserId: input.ownerId,
      action,
      metadata: { slug: row.slug, ...changes },
    },
  });
  if (!updated) {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.NOT_FOUND,
      "Short link not found."
    );
  }

  return updated;
}

export async function deleteShortLink(
  input: { readonly id: string; readonly ownerId: string },
  deps: ShortLinkServiceDeps = {}
): Promise<void> {
  const repository = deps.repository ?? prismaShortLinkRepository;
  const resolveWorkspace =
    deps.resolveAuditWorkspaceId ?? resolveAuditWorkspaceIdForOwner;

  const row = await repository.findForOwner({
    id: input.id,
    ownerId: input.ownerId,
  });
  if (!row) {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.NOT_FOUND,
      "Short link not found."
    );
  }

  const workspaceId = row.workspaceId ?? (await resolveWorkspace(input.ownerId));
  const deleted = await repository.softDeleteForOwner({
    id: input.id,
    ownerId: input.ownerId,
    audit: {
      workspaceId,
      actorUserId: input.ownerId,
      action: AUDIT_ACTION.DELETE,
      metadata: { slug: row.slug, destinationUrl: row.destinationUrl },
    },
  });
  if (!deleted) {
    throw new ShortLinkError(
      SHORT_LINK_ERROR_CODE.NOT_FOUND,
      "Short link not found."
    );
  }
}

async function resolveAuditWorkspaceIdForOwner(
  ownerId: string
): Promise<string> {
  const workspace =
    (await getDefaultWorkspaceForUser({ userId: ownerId })) ??
    (await createDefaultWorkspaceForUser({ userId: ownerId }));

  return workspace.id;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const SHORT_LINK_LIST_DEFAULT_TAKE = 25;
export const SHORT_LINK_LIST_MAX_TAKE = 100;

export interface ListShortLinksInput {
  readonly ownerId: string;
  readonly workspaceId?: string;
  readonly take?: number;
  readonly cursorId?: string;
}

export interface ListShortLinksResult {
  readonly shortLinks: readonly ShortLinkListRow[];
  readonly nextCursor: string | null;
}

export async function listShortLinks(
  input: ListShortLinksInput,
  deps: ShortLinkServiceDeps = {}
): Promise<ListShortLinksResult> {
  const repository = deps.repository ?? prismaShortLinkRepository;
  const take = clampTake(input.take ?? SHORT_LINK_LIST_DEFAULT_TAKE);

  const rows = await repository.listForOwner({
    ownerId: input.ownerId,
    workspaceId: input.workspaceId,
    take,
    cursorId: input.cursorId,
  });

  return {
    shortLinks: rows,
    nextCursor:
      rows.length < take ? null : (rows[rows.length - 1]?.id ?? null),
  };
}

export async function getShortLinkDetail(
  input: { readonly id: string; readonly ownerId: string },
  deps: ShortLinkServiceDeps = {}
): Promise<ShortLinkDetailRow | null> {
  const repository = deps.repository ?? prismaShortLinkRepository;

  return repository.findDetailForOwner({
    id: input.id,
    ownerId: input.ownerId,
  });
}

function clampTake(value: number): number {
  if (!Number.isFinite(value) || value < 1) return SHORT_LINK_LIST_DEFAULT_TAKE;

  return Math.min(Math.floor(value), SHORT_LINK_LIST_MAX_TAKE);
}

function summarizeVerification(
  verification: LinkVerificationResult
): ShortLinkEvidenceSummary {
  return {
    verdict: verification.verdict,
    confidence: verification.confidence,
    signalCount: verification.evidence.length,
    sourceCount: new Set(verification.evidence.map((e) => e.source)).size,
    topConcerns: getTopConcerns(verification.evidence),
  };
}

function getTopConcerns(evidence: readonly Evidence[]): readonly string[] {
  const rank: Record<EvidenceSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  return [...evidence]
    .filter((entry) => entry.severity !== "info")
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .slice(0, 3)
    .map((entry) => entry.message);
}
