import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { ScanTelemetry } from "@/server/analytics/scan";
import type { ShortLinkStatus } from "@/server/short-links/constants";

const shortLinkResolveSelect = {
  id: true,
  slug: true,
  destinationUrl: true,
  normalizedUrl: true,
  status: true,
  expiresAt: true,
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkResolveRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkResolveSelect;
}>;

const shortLinkCreatedSelect = {
  id: true,
  slug: true,
  destinationUrl: true,
  normalizedUrl: true,
  status: true,
  verdictAtCreate: true,
  scanCount: true,
  expiresAt: true,
  createdAt: true,
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkCreatedRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkCreatedSelect;
}>;

export interface CreateShortLinkData {
  readonly slug: string;
  readonly destinationUrl: string;
  readonly normalizedUrl: string;
  readonly status: ShortLinkStatus;
  readonly verdictAtCreate: string;
  readonly lastVerdict: string;
  readonly lastVerifiedAt: Date;
  readonly ownerId?: string | null;
  readonly workspaceId?: string | null;
  readonly expiresAt?: Date | null;
}

export interface ShortLinkRepository {
  readonly isSlugAvailable: (slug: string) => Promise<boolean>;
  readonly create: (data: CreateShortLinkData) => Promise<ShortLinkCreatedRow>;
  readonly findResolvable: (
    slug: string
  ) => Promise<ShortLinkResolveRow | null>;
  readonly recordScan: (
    shortLinkId: string,
    telemetry: ScanTelemetry
  ) => Promise<void>;
}

export const prismaShortLinkRepository: ShortLinkRepository = {
  isSlugAvailable,
  create,
  findResolvable,
  recordScan,
};

async function isSlugAvailable(slug: string): Promise<boolean> {
  // The slug column is globally unique, so a soft-deleted row still reserves
  // its slug — availability means no row of any state holds it.
  const existing = await prisma.shortLink.count({ where: { slug } });

  return existing === 0;
}

function create(data: CreateShortLinkData): Promise<ShortLinkCreatedRow> {
  return prisma.shortLink.create({
    data: {
      slug: data.slug,
      destinationUrl: data.destinationUrl,
      normalizedUrl: data.normalizedUrl,
      status: data.status,
      verdictAtCreate: data.verdictAtCreate,
      lastVerdict: data.lastVerdict,
      lastVerifiedAt: data.lastVerifiedAt,
      ownerId: data.ownerId ?? null,
      workspaceId: data.workspaceId ?? null,
      expiresAt: data.expiresAt ?? null,
    },
    select: shortLinkCreatedSelect,
  });
}

function findResolvable(slug: string): Promise<ShortLinkResolveRow | null> {
  return prisma.shortLink.findFirst({
    where: { slug, deletedAt: null },
    select: shortLinkResolveSelect,
  });
}

async function recordScan(
  shortLinkId: string,
  telemetry: ScanTelemetry
): Promise<void> {
  await prisma.$transaction([
    prisma.shortLink.update({
      where: { id: shortLinkId },
      data: { scanCount: { increment: 1 } },
      select: { id: true },
    }),
    prisma.shortLinkScan.create({
      data: {
        shortLinkId,
        deviceClass: telemetry.deviceClass,
        browser: telemetry.browser,
        operatingSystem: telemetry.operatingSystem,
        referrer: telemetry.referrer,
        country: telemetry.country,
        region: telemetry.region,
        ipHash: telemetry.ipHash,
        userAgentHash: telemetry.userAgentHash,
      },
      select: { id: true },
    }),
  ]);
}
