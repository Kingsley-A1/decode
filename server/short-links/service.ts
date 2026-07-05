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
import {
  prismaShortLinkRepository,
  type ShortLinkCreatedRow,
  type ShortLinkDetailRow,
  type ShortLinkListRow,
  type ShortLinkRepository,
} from "@/server/short-links/repository";
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
