import "server-only";

import type { Prisma } from "@prisma/client";
import type {
  AdminAuditQuery,
  AdminListQuery,
} from "@/server/admin/schemas";
import { prisma } from "@/server/db/prisma";

export interface AdminPageResult<TRecord> {
  readonly records: readonly TRecord[];
  readonly nextCursor: string | null;
  readonly total: number;
}

export interface AdminAuditTimelineEvent {
  readonly id: string;
  readonly source: "platform" | "workspace" | "auth";
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly actorLabel: string;
  readonly workspaceLabel: string | null;
  readonly requestId: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: Date;
}

export async function getAdminOverview() {
  const [
    users,
    workspaces,
    qrCodes,
    dynamicQRCodes,
    landingPages,
    assets,
    scans,
    reviews,
    linkChecks,
    adminUsers,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.workspace.count({ where: { deletedAt: null } }),
    prisma.qRCode.count({ where: { deletedAt: null } }),
    prisma.qRCode.count({ where: { deletedAt: null, mode: "dynamic" } }),
    prisma.landingPage.count({ where: { deletedAt: null } }),
    prisma.qRCodeAsset.count({ where: { deletedAt: null } }),
    prisma.scanEvent.count(),
    prisma.review.count({ where: { deletedAt: null } }),
    prisma.linkCheck.count(),
    prisma.adminUser.count(),
    listAdminAuditEvents({ source: "all", take: 8 }),
  ]);

  return {
    totals: {
      users,
      workspaces,
      qrCodes,
      dynamicQRCodes,
      landingPages,
      assets,
      scans,
      reviews,
      linkChecks,
      adminUsers,
    },
    recentAuditEvents,
  };
}

export async function listAdminAuditEvents(
  query: AdminAuditQuery
): Promise<readonly AdminAuditTimelineEvent[]> {
  const [platformEvents, workspaceEvents, authEvents] = await Promise.all([
    query.source === "all" || query.source === "platform"
      ? listPlatformAuditEvents(query)
      : [],
    query.source === "all" || query.source === "workspace"
      ? listWorkspaceAuditEvents(query)
      : [],
    query.source === "all" || query.source === "auth"
      ? listAdminAuthEvents(query)
      : [],
  ]);

  return [...platformEvents, ...workspaceEvents, ...authEvents]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, query.take);
}

export async function listAdminUsers(
  query: AdminListQuery
): Promise<AdminPageResult<AdminUserRow>> {
  const where: Prisma.AdminUserWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { email: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: adminUserRowSelect,
    }),
    prisma.adminUser.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listPlatformUsers(
  query: AdminListQuery
): Promise<AdminPageResult<PlatformUserRow>> {
  const where: Prisma.UserWhereInput = {
    ...(query.status === "deleted" ? { deletedAt: { not: null } } : {}),
    ...(query.status && query.status !== "deleted" ? { deletedAt: null } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { email: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: platformUserRowSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminWorkspaces(
  query: AdminListQuery
): Promise<AdminPageResult<WorkspaceRow>> {
  const where: Prisma.WorkspaceWhereInput = {
    ...(query.status === "deleted" ? { deletedAt: { not: null } } : {}),
    ...(query.status && query.status !== "deleted" ? { deletedAt: null } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { slug: { contains: query.q } },
            { owner: { email: { contains: query.q } } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: workspaceRowSelect,
    }),
    prisma.workspace.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminQRCodes(
  query: AdminListQuery
): Promise<AdminPageResult<QRCodeRow>> {
  const where: Prisma.QRCodeWhereInput = {
    ...(query.status ? { status: query.status } : { deletedAt: null }),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { slug: { contains: query.q } },
            { destinationUrl: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.qRCode.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: qrCodeRowSelect,
    }),
    prisma.qRCode.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminLandingPages(
  query: AdminListQuery
): Promise<AdminPageResult<LandingPageRow>> {
  const where: Prisma.LandingPageWhereInput = {
    ...(query.status ? { status: query.status } : { deletedAt: null }),
    ...(query.q
      ? { title: { contains: query.q } }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.landingPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: landingPageRowSelect,
    }),
    prisma.landingPage.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminAssets(
  query: AdminListQuery
): Promise<AdminPageResult<AssetRow>> {
  const where: Prisma.QRCodeAssetWhereInput = {
    ...(query.status ? { status: query.status } : { deletedAt: null }),
    ...(query.q
      ? {
          OR: [
            { purpose: { contains: query.q } },
            { contentType: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.qRCodeAsset.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: assetRowSelect,
    }),
    prisma.qRCodeAsset.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminScans(
  query: AdminListQuery
): Promise<AdminPageResult<ScanRow>> {
  const where: Prisma.ScanEventWhereInput = {
    ...(query.q
      ? {
          OR: [
            { qrCode: { title: { contains: query.q } } },
            { workspace: { name: { contains: query.q } } },
            { referrer: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.scanEvent.findMany({
      where,
      orderBy: { scannedAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: scanRowSelect,
    }),
    prisma.scanEvent.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminReviews(
  query: AdminListQuery
): Promise<AdminPageResult<ReviewRow>> {
  const where: Prisma.ReviewWhereInput = {
    ...(query.status ? { status: query.status } : { deletedAt: null }),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { email: { contains: query.q } },
            { title: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: reviewRowSelect,
    }),
    prisma.review.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

export async function listAdminLinkChecks(
  query: AdminListQuery
): Promise<AdminPageResult<LinkCheckRow>> {
  const where: Prisma.LinkCheckWhereInput = {
    ...(query.status ? { verdict: query.status } : {}),
    ...(query.q
      ? { normalizedUrl: { contains: query.q } }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.linkCheck.findMany({
      where,
      orderBy: { checkedAt: "desc" },
      take: query.take,
      ...getCursor(query.cursor),
      select: linkCheckRowSelect,
    }),
    prisma.linkCheck.count({ where }),
  ]);

  return getPageResult(records, total, query.take);
}

const adminUserRowSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  disabledAt: true,
  _count: { select: { sessions: true, authEvents: true } },
} satisfies Prisma.AdminUserSelect;

const platformUserRowSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  defaultWorkspaceId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  _count: {
    select: {
      memberships: true,
      ownedQRCodes: true,
      uploadedAssets: true,
      reviews: true,
    },
  },
} satisfies Prisma.UserSelect;

const workspaceRowSelect = {
  id: true,
  name: true,
  slug: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  owner: { select: { id: true, name: true, email: true } },
  _count: {
    select: {
      members: true,
      qrCodes: true,
      assets: true,
      landingPages: true,
      scanEvents: true,
      auditLogs: true,
    },
  },
} satisfies Prisma.WorkspaceSelect;

const qrCodeRowSelect = {
  id: true,
  workspaceId: true,
  ownerId: true,
  title: true,
  type: true,
  mode: true,
  status: true,
  slug: true,
  destinationUrl: true,
  scanCount: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  workspace: { select: { id: true, name: true, slug: true } },
  owner: { select: { id: true, name: true, email: true } },
} satisfies Prisma.QRCodeSelect;

const landingPageRowSelect = {
  id: true,
  workspaceId: true,
  qrCodeId: true,
  type: true,
  title: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  workspace: { select: { id: true, name: true, slug: true } },
  qrCode: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.LandingPageSelect;

const assetRowSelect = {
  id: true,
  workspaceId: true,
  qrCodeId: true,
  landingPageId: true,
  uploaderId: true,
  purpose: true,
  status: true,
  contentType: true,
  fileSizeBytes: true,
  checksum: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  workspace: { select: { id: true, name: true, slug: true } },
  qrCode: { select: { id: true, title: true } },
  landingPage: { select: { id: true, title: true } },
  uploader: { select: { id: true, name: true, email: true } },
} satisfies Prisma.QRCodeAssetSelect;

const scanRowSelect = {
  id: true,
  workspaceId: true,
  qrCodeId: true,
  scannedAt: true,
  deviceClass: true,
  browser: true,
  operatingSystem: true,
  referrer: true,
  country: true,
  region: true,
  ipHash: true,
  userAgentHash: true,
  workspace: { select: { id: true, name: true, slug: true } },
  qrCode: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.ScanEventSelect;

const reviewRowSelect = {
  id: true,
  userId: true,
  name: true,
  email: true,
  rating: true,
  title: true,
  body: true,
  status: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  author: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ReviewSelect;

const linkCheckRowSelect = {
  id: true,
  normalizedUrl: true,
  verdict: true,
  confidence: true,
  reasons: true,
  checkedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LinkCheckSelect;

export type AdminUserRow = Prisma.AdminUserGetPayload<{
  select: typeof adminUserRowSelect;
}>;
export type PlatformUserRow = Prisma.UserGetPayload<{
  select: typeof platformUserRowSelect;
}>;
export type WorkspaceRow = Prisma.WorkspaceGetPayload<{
  select: typeof workspaceRowSelect;
}>;
export type QRCodeRow = Prisma.QRCodeGetPayload<{
  select: typeof qrCodeRowSelect;
}>;
export type LandingPageRow = Prisma.LandingPageGetPayload<{
  select: typeof landingPageRowSelect;
}>;
export type AssetRow = Prisma.QRCodeAssetGetPayload<{
  select: typeof assetRowSelect;
}>;
export type ScanRow = Prisma.ScanEventGetPayload<{
  select: typeof scanRowSelect;
}>;
export type ReviewRow = Prisma.ReviewGetPayload<{
  select: typeof reviewRowSelect;
}>;
export type LinkCheckRow = Prisma.LinkCheckGetPayload<{
  select: typeof linkCheckRowSelect;
}>;

async function listPlatformAuditEvents(
  query: AdminAuditQuery
): Promise<readonly AdminAuditTimelineEvent[]> {
  const records = await prisma.platformAuditLog.findMany({
    where: {
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.requestId ? { requestId: query.requestId } : {}),
      ...(query.cursorCreatedAt
        ? { createdAt: { lt: new Date(query.cursorCreatedAt) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query.take,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      requestId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  });

  return records.map((record) => ({
    id: record.id,
    source: "platform",
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    actorLabel: getActorLabel(record.actor),
    workspaceLabel: null,
    requestId: record.requestId,
    metadata: record.metadata,
    createdAt: record.createdAt,
  }));
}

async function listWorkspaceAuditEvents(
  query: AdminAuditQuery
): Promise<readonly AdminAuditTimelineEvent[]> {
  const records = await prisma.auditLog.findMany({
    where: {
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.cursorCreatedAt
        ? { createdAt: { lt: new Date(query.cursorCreatedAt) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query.take,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      workspace: { select: { name: true, slug: true } },
      actor: { select: { name: true, email: true } },
    },
  });

  return records.map((record) => ({
    id: record.id,
    source: "workspace",
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    actorLabel: getActorLabel(record.actor),
    workspaceLabel: `${record.workspace.name} (${record.workspace.slug})`,
    requestId: null,
    metadata: record.metadata,
    createdAt: record.createdAt,
  }));
}

async function listAdminAuthEvents(
  query: AdminAuditQuery
): Promise<readonly AdminAuditTimelineEvent[]> {
  const records = await prisma.adminAuthEvent.findMany({
    where: {
      ...(query.action ? { event: query.action } : {}),
      ...(query.requestId ? { requestId: query.requestId } : {}),
      ...(query.cursorCreatedAt
        ? { createdAt: { lt: new Date(query.cursorCreatedAt) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query.take,
    select: {
      id: true,
      email: true,
      event: true,
      outcome: true,
      reason: true,
      requestId: true,
      createdAt: true,
      adminUser: { select: { name: true, email: true } },
    },
  });

  return records.map((record) => ({
    id: record.id,
    source: "auth",
    action: `${record.event}.${record.outcome}`,
    entityType: "admin_auth_event",
    entityId: record.id,
    actorLabel: getActorLabel(record.adminUser) || record.email,
    workspaceLabel: null,
    requestId: record.requestId,
    metadata: { email: record.email, reason: record.reason },
    createdAt: record.createdAt,
  }));
}

function getPageResult<TRecord extends { readonly id: string }>(
  records: readonly TRecord[],
  total: number,
  take: number
): AdminPageResult<TRecord> {
  return {
    records,
    total,
    nextCursor:
      records.length < take ? null : records[records.length - 1]?.id ?? null,
  };
}

function getCursor(
  cursor?: string
): { readonly cursor?: { readonly id: string }; readonly skip?: 1 } {
  return cursor ? { cursor: { id: cursor }, skip: 1 } : {};
}

function getActorLabel(
  actor: { readonly name: string | null; readonly email: string | null } | null
): string {
  return actor?.name || actor?.email || "System";
}
