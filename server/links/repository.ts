import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { toLegacyReasons } from "@/server/links/analysis";
import type { LinkVerificationResult } from "@/server/links/service";

const linkCheckSelect = {
  id: true,
  normalizedUrl: true,
  verdict: true,
  confidence: true,
  reasons: true,
  evidence: true,
  probeSummary: true,
  safeBrowsingTtl: true,
  checkedAt: true,
  expiresAt: true,
} satisfies Prisma.LinkCheckSelect;

export type LinkCheckRecord = Prisma.LinkCheckGetPayload<{
  select: typeof linkCheckSelect;
}>;

/** Shape the repository needs in order to persist a verification: the
 *  analyzer output the wire response is built from, minus the cache block. */
export type LinkCheckPersistInput = Omit<LinkVerificationResult, "cache">;

/** Timing metadata for a persisted verdict. `safeBrowsingTtl` bounds the
 *  freshness of the Safe Browsing portion specifically; it is null when no
 *  Safe Browsing lookup contributed to the verdict. */
export interface LinkCheckTiming {
  readonly checkedAt: Date;
  readonly expiresAt: Date;
  readonly safeBrowsingTtl: Date | null;
}

export interface LinkCheckRepository {
  readonly findFreshByNormalizedUrl: (
    normalizedUrl: string,
    now: Date
  ) => Promise<LinkCheckRecord | null>;
  readonly upsertVerdict: (
    input: LinkCheckPersistInput,
    timing: LinkCheckTiming
  ) => Promise<LinkCheckRecord>;
}

export const prismaLinkCheckRepository: LinkCheckRepository = {
  findFreshByNormalizedUrl,
  upsertVerdict,
};

function findFreshByNormalizedUrl(
  normalizedUrl: string,
  now: Date
): Promise<LinkCheckRecord | null> {
  return prisma.linkCheck.findFirst({
    where: {
      normalizedUrl,
      expiresAt: { gt: now },
      // A row whose Safe Browsing data has gone stale is treated as a miss
      // so it gets re-verified — rows without an SB lookup (null) rely on
      // the row-level `expiresAt` instead.
      OR: [{ safeBrowsingTtl: null }, { safeBrowsingTtl: { gt: now } }],
    },
    select: linkCheckSelect,
  });
}

function upsertVerdict(
  input: LinkCheckPersistInput,
  timing: LinkCheckTiming
): Promise<LinkCheckRecord> {
  if (!input.normalizedUrl) {
    throw new Error("Only normalized links can be cached.");
  }

  // Persist four columns: `evidence` is canonical; `reasons` is the legacy
  // projection so older readers (and the existing admin console) keep
  // working; `probeSummary` carries the Phase C network probe; and
  // `safeBrowsingTtl` bounds the freshness of the Phase D threat-intel
  // portion. Any of the last three may be SQL NULL.
  const reasons = toLegacyReasons(input.evidence);

  const data = {
    verdict: input.verdict,
    confidence: input.confidence,
    reasons: reasons as unknown as Prisma.InputJsonValue,
    evidence: input.evidence as unknown as Prisma.InputJsonValue,
    probeSummary: input.probe
      ? (input.probe as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull,
    safeBrowsingTtl: timing.safeBrowsingTtl,
    checkedAt: timing.checkedAt,
    expiresAt: timing.expiresAt,
  };

  return prisma.linkCheck.upsert({
    where: { normalizedUrl: input.normalizedUrl },
    create: {
      normalizedUrl: input.normalizedUrl,
      ...data,
    },
    update: data,
    select: linkCheckSelect,
  });
}
