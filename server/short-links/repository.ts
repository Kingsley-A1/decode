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
  lastVerdict: true,
  scanCount: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkCreatedRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkCreatedSelect;
}>;

const shortLinkListSelect = {
  id: true,
  slug: true,
  destinationUrl: true,
  normalizedUrl: true,
  status: true,
  verdictAtCreate: true,
  lastVerdict: true,
  scanCount: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkListRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkListSelect;
}>;

const shortLinkScanSelect = {
  id: true,
  scannedAt: true,
  deviceClass: true,
  browser: true,
  operatingSystem: true,
  country: true,
  region: true,
} satisfies Prisma.ShortLinkScanSelect;

const shortLinkDetailSelect = {
  ...shortLinkListSelect,
  scans: {
    select: shortLinkScanSelect,
    orderBy: { scannedAt: "desc" as const },
    take: 50,
  },
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkDetailRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkDetailSelect;
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

export interface ListShortLinksForOwnerInput {
  readonly ownerId: string;
  readonly workspaceId?: string;
  readonly take: number;
  readonly cursorId?: string;
}

export interface FindShortLinkForOwnerInput {
  readonly id: string;
  readonly ownerId: string;
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
  readonly listForOwner: (
    input: ListShortLinksForOwnerInput
  ) => Promise<readonly ShortLinkListRow[]>;
  readonly findDetailForOwner: (
    input: FindShortLinkForOwnerInput
  ) => Promise<ShortLinkDetailRow | null>;
}

export const prismaShortLinkRepository: ShortLinkRepository = {
  isSlugAvailable,
  create,
  findResolvable,
  recordScan,
  listForOwner,
  findDetailForOwner,
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

function listForOwner(
  input: ListShortLinksForOwnerInput
): Promise<readonly ShortLinkListRow[]> {
  return prisma.shortLink.findMany({
    where: {
      ownerId: input.ownerId,
      deletedAt: null,
      ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: input.take,
    ...(input.cursorId ? { cursor: { id: input.cursorId }, skip: 1 } : {}),
    select: shortLinkListSelect,
  });
}

function findDetailForOwner(
  input: FindShortLinkForOwnerInput
): Promise<ShortLinkDetailRow | null> {
  return prisma.shortLink.findFirst({
    where: {
      id: input.id,
      ownerId: input.ownerId,
      deletedAt: null,
    },
    select: shortLinkDetailSelect,
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
