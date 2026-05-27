import "server-only";

import { getShortLinkUrl } from "@/server/short-links/slugs";
import type {
  ShortLinkCreatedRow,
  ShortLinkDetailRow,
  ShortLinkListRow,
} from "@/server/short-links/repository";

export interface ShortLinkSummary {
  readonly id: string;
  readonly slug: string;
  readonly shortUrl: string;
  readonly destinationUrl: string;
  readonly normalizedUrl: string;
  readonly status: string;
  readonly verdictAtCreate: string;
  readonly lastVerdict: string | null;
  readonly scanCount: number;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ShortLinkScanItem {
  readonly id: string;
  readonly scannedAt: string;
  readonly deviceClass: string | null;
  readonly browser: string | null;
  readonly operatingSystem: string | null;
  readonly country: string | null;
  readonly region: string | null;
}

export interface ShortLinkDetail extends ShortLinkSummary {
  readonly recentScans: readonly ShortLinkScanItem[];
}

export function toShortLinkSummary(
  row: ShortLinkListRow | ShortLinkDetailRow | CreatedRowWithUpdatedAt
): ShortLinkSummary {
  return {
    id: row.id,
    slug: row.slug,
    shortUrl: getShortLinkUrl(row.slug),
    destinationUrl: row.destinationUrl,
    normalizedUrl: row.normalizedUrl,
    status: row.status,
    verdictAtCreate: row.verdictAtCreate,
    lastVerdict: row.lastVerdict ?? null,
    scanCount: row.scanCount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toShortLinkDetail(row: ShortLinkDetailRow): ShortLinkDetail {
  return {
    ...toShortLinkSummary(row),
    recentScans: row.scans.map((scan) => ({
      id: scan.id,
      scannedAt: scan.scannedAt.toISOString(),
      deviceClass: scan.deviceClass,
      browser: scan.browser,
      operatingSystem: scan.operatingSystem,
      country: scan.country,
      region: scan.region,
    })),
  };
}

/** The `created` row from `repository.create` lacks `updatedAt` and
 *  `lastVerdict` in its select; the create flow surfaces those from the
 *  service-side input. This helper widens the type so the summary mapper
 *  can be reused for the create response. */
export type CreatedRowWithUpdatedAt = ShortLinkCreatedRow & {
  readonly updatedAt: Date;
  readonly lastVerdict: string | null;
};
