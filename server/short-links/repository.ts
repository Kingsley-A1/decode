import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { ScanTelemetry } from "@/server/analytics/scan";
import {
  AUDIT_ENTITY_TYPE,
  type AuditAction,
} from "@/server/audit/constants";
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

const shortLinkOwnerSelect = {
  ...shortLinkListSelect,
  ownerId: true,
  workspaceId: true,
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkOwnerRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkOwnerSelect;
}>;

export interface UpdateShortLinkData {
  readonly destinationUrl?: string;
  readonly normalizedUrl?: string;
  readonly lastVerdict?: string;
  readonly lastVerifiedAt?: Date;
  readonly status?: ShortLinkStatus;
  readonly expiresAt?: Date | null;
  /** Backfilled on the first audited mutation of a workspace-less link. */
  readonly workspaceId?: string;
}

export interface ShortLinkAuditInput {
  readonly workspaceId: string;
  readonly actorUserId: string | null;
  readonly action: AuditAction;
  readonly metadata: Prisma.InputJsonValue;
}

export interface ShortLinkRepository {
  readonly isSlugAvailable: (slug: string) => Promise<boolean>;
  readonly create: (data: CreateShortLinkData) => Promise<ShortLinkCreatedRow>;
  readonly findResolvable: (
    slug: string
  ) => Promise<ShortLinkResolveRow | null>;
  readonly recordScan: (
    shortLinkId: string,
    telemetry: ScanTelemetry,
    countsTowardScanCount: boolean
  ) => Promise<void>;
  readonly listForOwner: (
    input: ListShortLinksForOwnerInput
  ) => Promise<readonly ShortLinkListRow[]>;
  readonly findDetailForOwner: (
    input: FindShortLinkForOwnerInput
  ) => Promise<ShortLinkDetailRow | null>;
  readonly findForOwner: (
    input: FindShortLinkForOwnerInput
  ) => Promise<ShortLinkOwnerRow | null>;
  readonly updateForOwner: (input: {
    readonly id: string;
    readonly ownerId: string;
    readonly data: UpdateShortLinkData;
    readonly audit: ShortLinkAuditInput;
  }) => Promise<ShortLinkCreatedRow | null>;
  readonly softDeleteForOwner: (input: {
    readonly id: string;
    readonly ownerId: string;
    readonly audit: ShortLinkAuditInput;
  }) => Promise<boolean>;
}

export const prismaShortLinkRepository: ShortLinkRepository = {
  isSlugAvailable,
  create,
  findResolvable,
  recordScan,
  listForOwner,
  findDetailForOwner,
  findForOwner,
  updateForOwner,
  softDeleteForOwner,
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
  telemetry: ScanTelemetry,
  countsTowardScanCount: boolean
): Promise<void> {
  // The event row is always written (deviceClass preserves "bot" for
  // transparency), but crawlers and link-preview fetchers must never inflate
  // the human-facing scan count — mirrors the dynamic QR scan pipeline.
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  if (countsTowardScanCount) {
    operations.push(
      prisma.shortLink.update({
        where: { id: shortLinkId },
        data: { scanCount: { increment: 1 } },
        select: { id: true },
      })
    );
  }

  operations.push(
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
    })
  );

  await prisma.$transaction(operations);
}

function findForOwner(
  input: FindShortLinkForOwnerInput
): Promise<ShortLinkOwnerRow | null> {
  return prisma.shortLink.findFirst({
    where: {
      id: input.id,
      ownerId: input.ownerId,
      deletedAt: null,
    },
    select: shortLinkOwnerSelect,
  });
}

// Mutations are transactional with their audit entry, mirroring the QR
// service: either the change and its audit record both land, or neither.
async function updateForOwner(input: {
  readonly id: string;
  readonly ownerId: string;
  readonly data: UpdateShortLinkData;
  readonly audit: ShortLinkAuditInput;
}): Promise<ShortLinkCreatedRow | null> {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.shortLink.findFirst({
      where: { id: input.id, ownerId: input.ownerId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await transaction.shortLink.update({
      where: { id: input.id },
      data: input.data,
      select: shortLinkCreatedSelect,
    });

    await createAuditEntry(transaction, input.id, input.audit);

    return row;
  });
}

async function softDeleteForOwner(input: {
  readonly id: string;
  readonly ownerId: string;
  readonly audit: ShortLinkAuditInput;
}): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.shortLink.findFirst({
      where: { id: input.id, ownerId: input.ownerId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;

    await transaction.shortLink.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    await createAuditEntry(transaction, input.id, input.audit);

    return true;
  });
}

function createAuditEntry(
  transaction: Prisma.TransactionClient,
  shortLinkId: string,
  audit: ShortLinkAuditInput
) {
  return transaction.auditLog.create({
    data: {
      workspaceId: audit.workspaceId,
      actorUserId: audit.actorUserId,
      action: audit.action,
      entityType: AUDIT_ENTITY_TYPE.SHORT_LINK,
      entityId: shortLinkId,
      metadata: audit.metadata,
    },
    select: { id: true },
  });
}

// --- Re-verification (cron) ---------------------------------------------

const shortLinkReverifySelect = {
  id: true,
  slug: true,
  destinationUrl: true,
  normalizedUrl: true,
  status: true,
  lastVerdict: true,
  ownerId: true,
  workspaceId: true,
} satisfies Prisma.ShortLinkSelect;

export type ShortLinkReverifyRow = Prisma.ShortLinkGetPayload<{
  select: typeof shortLinkReverifySelect;
}>;

export interface ShortLinkReverifyRepository {
  readonly findStaleActive: (input: {
    readonly staleBefore: Date;
    readonly take: number;
  }) => Promise<readonly ShortLinkReverifyRow[]>;
  readonly applyReverifyResult: (input: {
    readonly id: string;
    readonly lastVerdict: string;
    readonly lastVerifiedAt: Date;
    readonly status?: ShortLinkStatus;
    readonly audit?: ShortLinkAuditInput | null;
  }) => Promise<void>;
}

export const prismaShortLinkReverifyRepository: ShortLinkReverifyRepository = {
  findStaleActive({ staleBefore, take }) {
    return prisma.shortLink.findMany({
      where: {
        status: "active",
        deletedAt: null,
        OR: [
          { lastVerifiedAt: null },
          { lastVerifiedAt: { lt: staleBefore } },
        ],
      },
      // Never-verified rows sort first under ascending order.
      orderBy: { lastVerifiedAt: "asc" },
      take,
      select: shortLinkReverifySelect,
    });
  },
  async applyReverifyResult({ id, lastVerdict, lastVerifiedAt, status, audit }) {
    await prisma.$transaction(async (transaction) => {
      await transaction.shortLink.update({
        where: { id },
        data: {
          lastVerdict,
          lastVerifiedAt,
          ...(status ? { status } : {}),
        },
        select: { id: true },
      });

      if (audit) {
        await createAuditEntry(transaction, id, audit);
      }
    });
  },
};
