import "server-only";

import type { Prisma } from "@prisma/client";
import {
  analyzeLink,
  type LinkAnalysisResult,
  type LinkReason,
} from "@/server/links/analysis";
import {
  LINK_VERDICT,
  type LinkReasonCode,
  type LinkVerdict,
} from "@/server/links/constants";
import {
  prismaLinkCheckRepository,
  type LinkCheckRecord,
  type LinkCheckRepository,
} from "@/server/links/repository";

export interface VerifyLinkInput {
  readonly url: string;
  readonly now?: Date;
}

export interface LinkVerificationCacheMetadata {
  readonly hit: boolean;
  readonly cacheable: boolean;
  readonly checkedAt: string | null;
  readonly expiresAt: string | null;
}

export interface LinkVerificationResult extends LinkAnalysisResult {
  readonly cache: LinkVerificationCacheMetadata;
}

const LINK_CHECK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function verifyLink(
  input: VerifyLinkInput,
  repository: LinkCheckRepository = prismaLinkCheckRepository
): Promise<LinkVerificationResult> {
  const now = input.now ?? new Date();
  const analysis = analyzeLink(input.url);

  if (!analysis.normalizedUrl) {
    return {
      ...analysis,
      cache: {
        hit: false,
        cacheable: false,
        checkedAt: null,
        expiresAt: null,
      },
    };
  }

  try {
    const cachedVerdict = await repository.findFreshByNormalizedUrl(
      analysis.normalizedUrl,
      now
    );

    if (cachedVerdict) {
      return getCachedVerificationResult(cachedVerdict);
    }

    const expiresAt = new Date(now.getTime() + LINK_CHECK_CACHE_TTL_MS);
    const storedVerdict = await repository.upsertVerdict(
      analysis,
      now,
      expiresAt
    );

    return {
      ...analysis,
      cache: {
        hit: false,
        cacheable: true,
        checkedAt: storedVerdict.checkedAt.toISOString(),
        expiresAt: storedVerdict.expiresAt.toISOString(),
      },
    };
  } catch {
    return {
      ...analysis,
      cache: {
        hit: false,
        cacheable: false,
        checkedAt: now.toISOString(),
        expiresAt: null,
      },
    };
  }
}

function getCachedVerificationResult(
  record: LinkCheckRecord
): LinkVerificationResult {
  return {
    verdict: getStoredVerdict(record.verdict),
    confidence: record.confidence,
    normalizedUrl: record.normalizedUrl,
    host: new URL(record.normalizedUrl).hostname,
    reasons: getStoredReasons(record.reasons),
    ssrfProtected: true,
    cache: {
      hit: true,
      cacheable: true,
      checkedAt: record.checkedAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
    },
  };
}

function getStoredVerdict(value: string): LinkVerdict {
  if (
    value === LINK_VERDICT.SAFE ||
    value === LINK_VERDICT.CAUTION ||
    value === LINK_VERDICT.SUSPICIOUS
  ) {
    return value;
  }

  return LINK_VERDICT.SUSPICIOUS;
}

function getStoredReasons(reasons: Prisma.JsonValue): readonly LinkReason[] {
  if (!Array.isArray(reasons)) return [];

  return reasons
    .map((reason) => getStoredReason(reason))
    .filter((reason): reason is LinkReason => Boolean(reason));
}

function getStoredReason(reason: Prisma.JsonValue): LinkReason | null {
  if (!reason || typeof reason !== "object" || Array.isArray(reason)) {
    return null;
  }

  const record = reason as Record<string, Prisma.JsonValue>;
  if (
    typeof record.code !== "string" ||
    typeof record.message !== "string" ||
    !isReasonSeverity(record.severity)
  ) {
    return null;
  }

  return {
    code: record.code as LinkReasonCode,
    message: record.message,
    severity: record.severity,
  };
}

function isReasonSeverity(
  value: Prisma.JsonValue
): value is LinkReason["severity"] {
  return value === "low" || value === "medium" || value === "high";
}
