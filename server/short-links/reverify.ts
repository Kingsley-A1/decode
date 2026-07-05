import "server-only";

import { AUDIT_ACTION } from "@/server/audit/constants";
import { verifyLink } from "@/server/links/service";
import { logStructured } from "@/server/observability/logging";
import { SHORT_LINK_STATUS } from "@/server/short-links/constants";
import {
  prismaShortLinkReverifyRepository,
  type ShortLinkReverifyRepository,
} from "@/server/short-links/repository";
import type { ShortLinkVerifier } from "@/server/short-links/service";

export interface ReverifyStaleShortLinksInput {
  /** Links per run; kept small so a cron invocation stays within budget. */
  readonly batchSize?: number;
  /** A link is re-checked once its last verification is older than this. */
  readonly staleAfterDays?: number;
  readonly now?: Date;
}

export interface ReverifyDeps {
  readonly repository?: ShortLinkReverifyRepository;
  readonly verify?: ShortLinkVerifier;
}

export interface ReverifySummary {
  readonly checked: number;
  readonly flagged: number;
  readonly failed: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Re-verifies the stalest active short links so a destination that turns
 * malicious after creation stops redirecting (the /s route already serves a
 * blocking interstitial for flagged links). Each link fails open: a verifier
 * outage must never mass-disable customer links.
 */
export async function reverifyStaleShortLinks(
  input: ReverifyStaleShortLinksInput = {},
  deps: ReverifyDeps = {}
): Promise<ReverifySummary> {
  const repository = deps.repository ?? prismaShortLinkReverifyRepository;
  const verify = deps.verify ?? ((args) => verifyLink(args));
  const batchSize = input.batchSize ?? 10;
  const staleAfterDays = input.staleAfterDays ?? 7;
  const now = input.now ?? new Date();
  const staleBefore = new Date(now.getTime() - staleAfterDays * DAY_MS);

  const rows = await repository.findStaleActive({
    staleBefore,
    take: batchSize,
  });

  let flagged = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const verification = await verify({
        url: row.normalizedUrl || row.destinationUrl,
      });
      const isMalicious = verification.verdict === "malicious";

      await repository.applyReverifyResult({
        id: row.id,
        lastVerdict: verification.verdict,
        lastVerifiedAt: now,
        status: isMalicious ? SHORT_LINK_STATUS.FLAGGED : undefined,
        // Audit entries need a workspace; workspace-less anonymous links are
        // still flagged, just recorded via structured logs instead.
        audit:
          isMalicious && row.workspaceId
            ? {
                workspaceId: row.workspaceId,
                actorUserId: null,
                action: AUDIT_ACTION.UPDATE,
                metadata: {
                  reason: "reverify",
                  slug: row.slug,
                  previousVerdict: row.lastVerdict,
                  nextVerdict: verification.verdict,
                },
              }
            : null,
      });

      if (isMalicious) {
        flagged += 1;
        logStructured({
          level: "warn",
          event: "short_link.reverify_flagged",
          code: row.slug,
        });
      }
    } catch (error) {
      // Fail open per link: record the failure and move on.
      failed += 1;
      logStructured({
        level: "warn",
        event: "short_link.reverify_failed",
        code: row.slug,
        error,
      });
    }
  }

  return { checked: rows.length, flagged, failed };
}
