import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { AssetPurpose, AssetStatus } from "@/server/assets/constants";
import { ASSET_STATUS } from "@/server/assets/constants";

export const qrCodeAssetSelect = {
  id: true,
  workspaceId: true,
  qrCodeId: true,
  landingPageId: true,
  uploaderId: true,
  purpose: true,
  status: true,
  bucket: true,
  key: true,
  publicUrl: true,
  contentType: true,
  fileSizeBytes: true,
  checksum: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.QRCodeAssetSelect;

export interface CreateQRCodeAssetInput {
  readonly id?: string;
  readonly workspaceId: string;
  readonly qrCodeId?: string;
  readonly landingPageId?: string;
  readonly uploaderId?: string;
  readonly purpose: AssetPurpose;
  readonly status: AssetStatus;
  readonly bucket: string;
  readonly key: string;
  readonly publicUrl?: string;
  readonly contentType: string;
  readonly fileSizeBytes: number;
  readonly checksum?: string;
}

export interface WorkspaceAssetInput {
  readonly workspaceId: string;
  readonly assetId: string;
}

export interface ConfirmQRCodeAssetInput extends WorkspaceAssetInput {
  readonly checksum?: string;
  readonly fileSizeBytes: number;
  readonly contentType: string;
}

export function createQRCodeAsset(input: CreateQRCodeAssetInput) {
  return prisma.qRCodeAsset.create({
    data: getQRCodeAssetCreateData(input),
    select: qrCodeAssetSelect,
  });
}

export function getWorkspaceAsset({ workspaceId, assetId }: WorkspaceAssetInput) {
  return prisma.qRCodeAsset.findFirst({
    where: {
      id: assetId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: qrCodeAssetSelect,
  });
}

export function getPublicLandingPageAsset(assetId: string) {
  return prisma.qRCodeAsset.findFirst({
    where: {
      id: assetId,
      status: ASSET_STATUS.READY,
      deletedAt: null,
      landingPage: {
        deletedAt: null,
        status: "published",
        qrCode: {
          deletedAt: null,
          status: "published",
          workspace: { deletedAt: null },
        },
      },
    },
    select: qrCodeAssetSelect,
  });
}

export function confirmQRCodeAssetUpload({
  workspaceId,
  assetId,
  checksum,
  fileSizeBytes,
  contentType,
}: ConfirmQRCodeAssetInput) {
  return prisma.qRCodeAsset.update({
    where: { id: assetId, workspaceId },
    data: {
      status: ASSET_STATUS.READY,
      checksum,
      fileSizeBytes,
      contentType,
    },
    select: qrCodeAssetSelect,
  });
}

export function softDeleteQRCodeAsset({ workspaceId, assetId }: WorkspaceAssetInput) {
  return prisma.qRCodeAsset.update({
    where: { id: assetId, workspaceId },
    data: {
      status: ASSET_STATUS.DELETED,
      deletedAt: new Date(),
    },
    select: qrCodeAssetSelect,
  });
}

function getQRCodeAssetCreateData(
  input: CreateQRCodeAssetInput
): Prisma.QRCodeAssetUncheckedCreateInput {
  return {
    ...(input.id ? { id: input.id } : {}),
    workspaceId: input.workspaceId,
    ...(input.qrCodeId ? { qrCodeId: input.qrCodeId } : {}),
    ...(input.landingPageId ? { landingPageId: input.landingPageId } : {}),
    ...(input.uploaderId ? { uploaderId: input.uploaderId } : {}),
    purpose: input.purpose,
    status: input.status,
    bucket: input.bucket,
    key: input.key,
    publicUrl: input.publicUrl,
    contentType: input.contentType,
    fileSizeBytes: input.fileSizeBytes,
    checksum: input.checksum,
  };
}
