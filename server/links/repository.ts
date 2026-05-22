import "server-only";

import type { Prisma } from "@prisma/client";
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
  checkedAt: true,
  expiresAt: true,
} satisfies Prisma.LinkCheckSelect;

export type LinkCheckRecord = Prisma.LinkCheckGetPayload<{
  select: typeof linkCheckSelect;
}>;

/** Shape the repository needs in order to persist a verification: the
 *  analyzer output the wire response is built from, minus the cache block. */
export type LinkCheckPersistInput = Omit<LinkVerificationResult, "cache">;

export interface LinkCheckRepository {
  readonly findFreshByNormalizedUrl: (
    normalizedUrl: string,
    now: Date
  ) => Promise<LinkCheckRecord | null>;
  readonly upsertVerdict: (
    input: LinkCheckPersistInput,
    checkedAt: Date,
    expiresAt: Date
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
    },
    select: linkCheckSelect,
  });
}

function upsertVerdict(
  input: LinkCheckPersistInput,
  checkedAt: Date,
  expiresAt: Date
): Promise<LinkCheckRecord> {
  if (!input.normalizedUrl) {
    throw new Error("Only normalized links can be cached.");
  }

  // Persist both columns: `evidence` is canonical; `reasons` is the legacy
  // projection so older readers (and the existing admin console) keep
  // working. Phase B never writes `probeSummary`.
  const reasons = toLegacyReasons(input.evidence);

  const data = {
    verdict: input.verdict,
    confidence: input.confidence,
    reasons: reasons as unknown as Prisma.InputJsonValue,
    evidence: input.evidence as unknown as Prisma.InputJsonValue,
    checkedAt,
    expiresAt,
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
