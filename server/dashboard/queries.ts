import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { QR_CODE_MODE } from "@/server/qr/constants";
import { qrCodeDashboardSelect } from "@/server/qr/selectors";

export interface WorkspaceDashboardInput {
  readonly workspaceId: string;
}

export interface WorkspaceDashboardAnalyticsInput extends WorkspaceDashboardInput {
  readonly take?: number;
  readonly cursorId?: string;
}

export async function getWorkspaceDashboardSummary({
  workspaceId,
}: WorkspaceDashboardInput) {
  const [
    totalQRCodes,
    dynamicQRCodes,
    totalScans,
    recentQRCodes,
    recentScans,
    topQRCodes,
    scansByDeviceClass,
    scansByReferrer,
  ] =
    await Promise.all([
      countWorkspaceQRCodes(workspaceId),
      countWorkspaceDynamicQRCodes(workspaceId),
      countWorkspaceScans(workspaceId),
      listRecentWorkspaceQRCodes(workspaceId),
      listRecentWorkspaceScans({ workspaceId, take: 10 }),
      listTopWorkspaceQRCodes({ workspaceId, take: 10 }),
      listWorkspaceScansByDeviceClass({ workspaceId }),
      listWorkspaceScansByReferrer({ workspaceId }),
    ]);

  return {
    totalQRCodes,
    dynamicQRCodes,
    totalScans,
    recentQRCodes,
    recentScans,
    topQRCodes,
    scansByDeviceClass,
    scansByReferrer,
  };
}

function countWorkspaceQRCodes(workspaceId: string): Promise<number> {
  return prisma.qRCode.count({ where: { workspaceId, deletedAt: null } });
}

function countWorkspaceDynamicQRCodes(workspaceId: string): Promise<number> {
  return prisma.qRCode.count({
    where: { workspaceId, mode: QR_CODE_MODE.DYNAMIC, deletedAt: null },
  });
}

function countWorkspaceScans(workspaceId: string): Promise<number> {
  return prisma.scanEvent.count({ where: getWorkspaceScanWhere(workspaceId) });
}

function listRecentWorkspaceQRCodes(workspaceId: string) {
  return prisma.qRCode.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: qrCodeDashboardSelect,
  });
}

export function listRecentWorkspaceScans({
  workspaceId,
  take,
  cursorId,
}: WorkspaceDashboardAnalyticsInput) {
  return prisma.scanEvent.findMany({
    where: getWorkspaceScanWhere(workspaceId),
    orderBy: { scannedAt: "desc" },
    take: getBoundedTake(take, 25, 100),
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      qrCodeId: true,
      scannedAt: true,
      deviceClass: true,
      browser: true,
      operatingSystem: true,
      referrer: true,
      country: true,
      region: true,
      qrCode: {
        select: {
          id: true,
          title: true,
          type: true,
          mode: true,
          status: true,
          slug: true,
        },
      },
    },
  });
}

export function listTopWorkspaceQRCodes({
  workspaceId,
  take,
}: WorkspaceDashboardAnalyticsInput) {
  return prisma.qRCode.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: [{ scanCount: "desc" }, { updatedAt: "desc" }],
    take: getBoundedTake(take, 10, 50),
    select: qrCodeDashboardSelect,
  });
}

export async function listWorkspaceScansByDeviceClass({
  workspaceId,
  take,
}: WorkspaceDashboardAnalyticsInput) {
  const rows = await prisma.scanEvent.groupBy({
    by: ["deviceClass"],
    where: getWorkspaceScanWhere(workspaceId),
    _count: { _all: true },
  });

  return rows
    .map((row) => ({
      deviceClass: row.deviceClass ?? "unknown",
      count: row._count._all,
    }))
    .sort(sortByCountDesc)
    .slice(0, getBoundedTake(take, 10, 50));
}

export async function listWorkspaceScansByReferrer({
  workspaceId,
  take,
}: WorkspaceDashboardAnalyticsInput) {
  const rows = await prisma.scanEvent.groupBy({
    by: ["referrer"],
    where: {
      ...getWorkspaceScanWhere(workspaceId),
      referrer: { not: null },
    },
    _count: { _all: true },
  });

  return rows
    .map((row) => ({
      referrer: row.referrer ?? "direct",
      count: row._count._all,
    }))
    .sort(sortByCountDesc)
    .slice(0, getBoundedTake(take, 10, 50));
}

function sortByCountDesc(
  left: { readonly count: number },
  right: { readonly count: number }
): number {
  return right.count - left.count;
}

function getBoundedTake(
  take: number | undefined,
  fallback: number,
  max: number
): number {
  if (!take) return fallback;

  return Math.min(Math.max(take, 1), max);
}

function getWorkspaceScanWhere(workspaceId: string): Prisma.ScanEventWhereInput {
  return {
    workspaceId,
    workspace: { deletedAt: null },
    qrCode: { deletedAt: null },
  };
}
