import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { LinkAnalysisResult } from "@/server/links/analysis";

const linkCheckSelect = {
  id: true,
  normalizedUrl: true,
  verdict: true,
  confidence: true,
  reasons: true,
  checkedAt: true,
  expiresAt: true,
} satisfies Prisma.LinkCheckSelect;

export type LinkCheckRecord = Prisma.LinkCheckGetPayload<{
  select: typeof linkCheckSelect;
}>;

export interface LinkCheckRepository {
  readonly findFreshByNormalizedUrl: (
    normalizedUrl: string,
    now: Date
  ) => Promise<LinkCheckRecord | null>;
  readonly upsertVerdict: (
    analysis: LinkAnalysisResult,
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
  analysis: LinkAnalysisResult,
  checkedAt: Date,
  expiresAt: Date
): Promise<LinkCheckRecord> {
  if (!analysis.normalizedUrl) {
    throw new Error("Only normalized links can be cached.");
  }

  const data = {
    verdict: analysis.verdict,
    confidence: analysis.confidence,
    reasons: analysis.reasons as unknown as Prisma.InputJsonValue,
    checkedAt,
    expiresAt,
  };

  return prisma.linkCheck.upsert({
    where: { normalizedUrl: analysis.normalizedUrl },
    create: {
      normalizedUrl: analysis.normalizedUrl,
      ...data,
    },
    update: data,
    select: linkCheckSelect,
  });
}
