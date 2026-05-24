import "server-only";

import { prisma } from "@/server/db/prisma";
import {
  qrCodeDashboardSelect,
  qrCodeDetailSelect,
  qrCodeOwnershipSelect,
  qrCodeRenderSelect,
} from "@/server/qr/selectors";

export interface WorkspaceQRCodeInput {
  readonly workspaceId: string;
  readonly qrCodeId: string;
}

export interface ListWorkspaceQRCodesInput {
  readonly workspaceId: string;
  readonly take?: number;
  readonly cursorId?: string;
}

export function getWorkspaceQRCode({
  workspaceId,
  qrCodeId,
}: WorkspaceQRCodeInput) {
  return prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: qrCodeDashboardSelect,
  });
}

export function getWorkspaceQRCodeDetail({
  workspaceId,
  qrCodeId,
}: WorkspaceQRCodeInput) {
  return prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: qrCodeDetailSelect,
  });
}

export function getQRCodeOwnership({
  workspaceId,
  qrCodeId,
}: WorkspaceQRCodeInput) {
  return prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: qrCodeOwnershipSelect,
  });
}

export function listWorkspaceQRCodes({
  workspaceId,
  take = 25,
  cursorId,
}: ListWorkspaceQRCodesInput) {
  return prisma.qRCode.findMany({
    where: { workspaceId, deletedAt: null, workspace: { deletedAt: null } },
    orderBy: { updatedAt: "desc" },
    take,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: qrCodeDashboardSelect,
  });
}

export function getRenderableWorkspaceQRCode({
  workspaceId,
  qrCodeId,
}: WorkspaceQRCodeInput) {
  return prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: qrCodeRenderSelect,
  });
}
