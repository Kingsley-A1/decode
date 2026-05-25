import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { SCAN_BOT_DEVICE_CLASS } from "@/server/analytics/constants";
import { QR_CODE_MODE } from "@/server/qr/constants";
import { qrCodeDashboardSelect } from "@/server/qr/selectors";

export interface WorkspaceDashboardInput {
  readonly workspaceId: string;
}

export interface WorkspaceDashboardAnalyticsInput extends WorkspaceDashboardInput {
  readonly take?: number;
  readonly cursorId?: string;
  readonly qrCodeId?: string;
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

export async function getWorkspaceQRCodeAnalytics({
  workspaceId,
  qrCodeId,
}: WorkspaceDashboardInput & { readonly qrCodeId: string }) {
  const qrCode = await prisma.qRCode.findFirst({
    where: { id: qrCodeId, workspaceId, deletedAt: null },
    select: qrCodeDashboardSelect,
  });

  if (!qrCode) return null;

  const [
    totalScans,
    recentScans,
    scanTrend,
    scansByDeviceClass,
    scansByReferrer,
  ] = await Promise.all([
    countWorkspaceScans(workspaceId, qrCodeId),
    listRecentWorkspaceScans({ workspaceId, qrCodeId, take: 25 }),
    listWorkspaceScanTrend({ workspaceId, qrCodeId }),
    listWorkspaceScansByDeviceClass({ workspaceId, qrCodeId }),
    listWorkspaceScansByReferrer({ workspaceId, qrCodeId }),
  ]);

  return {
    totalQRCodes: 1,
    dynamicQRCodes: qrCode.mode === QR_CODE_MODE.DYNAMIC ? 1 : 0,
    totalScans,
    recentActivityLabel:
      totalScans > 0 ? `${totalScans} total scans` : "None",
    recentQRCodes: [qrCode],
    recentScans,
    topQRCodes: [qrCode],
    scanTrend,
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

function countWorkspaceScans(
  workspaceId: string,
  qrCodeId?: string
): Promise<number> {
  return prisma.scanEvent.count({
    where: getWorkspaceScanWhere({ workspaceId, qrCodeId }),
  });
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
  qrCodeId,
}: WorkspaceDashboardAnalyticsInput) {
  return prisma.scanEvent.findMany({
    where: getWorkspaceScanWhere({
      workspaceId,
      qrCodeId,
    }),
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
  qrCodeId,
}: WorkspaceDashboardAnalyticsInput) {
  const rows = await prisma.scanEvent.groupBy({
    by: ["deviceClass"],
    where: getWorkspaceScanWhere({ workspaceId, qrCodeId }),
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
  qrCodeId,
}: WorkspaceDashboardAnalyticsInput) {
  const rows = await prisma.scanEvent.groupBy({
    by: ["referrer"],
    where: {
      ...getWorkspaceScanWhere({ workspaceId, qrCodeId }),
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

export async function listWorkspaceScanTrend({
  workspaceId,
  qrCodeId,
}: WorkspaceDashboardAnalyticsInput) {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.scanEvent.findMany({
    where: {
      ...getWorkspaceScanWhere({ workspaceId, qrCodeId }),
      scannedAt: { gte: since },
    },
    orderBy: { scannedAt: "asc" },
    select: { scannedAt: true },
  });

  return buildScanTrend(rows.map((row) => row.scannedAt), since, 14);
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

export function getWorkspaceScanWhere({
  workspaceId,
  qrCodeId,
}: {
  readonly workspaceId: string;
  readonly qrCodeId?: string;
}): Prisma.ScanEventWhereInput {
  return {
    workspaceId,
    ...(qrCodeId ? { qrCodeId } : {}),
    // Bots are recorded but excluded from human-facing metrics so analytics
    // counts agree with the denormalized QRCode.scanCount.
    deviceClass: { not: SCAN_BOT_DEVICE_CLASS },
    workspace: { deletedAt: null },
    qrCode: { deletedAt: null },
  };
}

function buildScanTrend(
  scannedAtValues: readonly Date[],
  since: Date,
  days: number
) {
  const counts = new Map<string, number>();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    counts.set(getDateKey(date), 0);
  }

  for (const scannedAt of scannedAtValues) {
    const key = getDateKey(scannedAt);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, scans]) => ({
    label: formatTrendLabel(date),
    date,
    scans,
  }));
}

function getDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatTrendLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}
