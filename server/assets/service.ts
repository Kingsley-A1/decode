import "server-only";

import { randomUUID } from "node:crypto";
import {
  ASSET_PURPOSE,
  ASSET_STATUS,
  type AssetPurpose,
} from "@/server/assets/constants";
import {
  AssetNotFoundError,
  AssetStateError,
  AssetValidationError,
} from "@/server/assets/errors";
import {
  buildWorkspaceAssetKey,
  getAssetUploadPolicy,
} from "@/server/assets/policy";
import {
  confirmQRCodeAssetUpload,
  createQRCodeAsset,
  getWorkspaceAsset,
  softDeleteQRCodeAsset,
} from "@/server/assets/repository";
import {
  deleteR2Object,
  getR2BucketName,
  getR2SignedUploadUrl,
  headR2Object,
} from "@/server/assets/r2";
import type {
  ConfirmAssetUploadRequest,
  CreatePresignedUploadRequest,
} from "@/server/assets/schemas";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@/server/audit/constants";
import { createAuditLog } from "@/server/audit/repository";
import { prisma } from "@/server/db/prisma";
import {
  getDefaultWorkspaceForUser,
  getWorkspaceAccess,
} from "@/server/workspaces/repository";
import { createDefaultWorkspaceForUser } from "@/server/workspaces/service";

export interface CreatePresignedAssetUploadInput {
  readonly request: CreatePresignedUploadRequest;
  readonly userId: string;
}

export interface ConfirmAssetUploadInput {
  readonly assetId: string;
  readonly request: ConfirmAssetUploadRequest;
  readonly userId: string;
}

export interface DeleteAssetInput {
  readonly assetId: string;
  readonly workspaceId?: string;
  readonly userId: string;
}

export async function createPresignedAssetUpload({
  request,
  userId,
}: CreatePresignedAssetUploadInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const policy = getAssetUploadPolicy(request);

  await assertAssetAttachmentAccess({
    workspaceId,
    purpose: request.purpose,
    qrCodeId: request.qrCodeId,
    landingPageId: request.landingPageId,
  });

  const assetId = randomUUID();
  const key = buildWorkspaceAssetKey({
    workspaceId,
    assetId,
    purpose: request.purpose,
    contentType: policy.contentType,
    qrCodeId: request.qrCodeId,
    landingPageId: request.landingPageId,
  });
  const uploadUrl = await getR2SignedUploadUrl({
    key,
    contentType: policy.contentType,
  });
  const asset = await createQRCodeAsset({
    id: assetId,
    workspaceId,
    qrCodeId: request.qrCodeId,
    landingPageId: request.landingPageId,
    uploaderId: userId,
    purpose: request.purpose,
    status: ASSET_STATUS.PENDING,
    bucket: getR2BucketName(),
    key,
    contentType: policy.contentType,
    fileSizeBytes: request.fileSizeBytes,
    checksum: request.checksum,
  });

  await createAuditLog({
    workspaceId,
    actorUserId: userId,
    action: AUDIT_ACTION.ASSET_UPLOAD,
    entityType: AUDIT_ENTITY_TYPE.QR_CODE_ASSET,
    entityId: asset.id,
    metadata: {
      status: ASSET_STATUS.PENDING,
      purpose: request.purpose,
      qrCodeId: request.qrCodeId,
      landingPageId: request.landingPageId,
    },
  });

  return {
    asset: getClientSafeAsset(asset),
    upload: {
      url: uploadUrl,
      method: "PUT",
      headers: { "Content-Type": policy.contentType },
      expiresInSeconds: 900,
      maxSizeBytes: policy.maxSizeBytes,
    },
  };
}

export async function confirmAssetUpload({
  assetId,
  request,
  userId,
}: ConfirmAssetUploadInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const asset = await getRequiredWorkspaceAsset({ workspaceId, assetId });

  if (asset.status !== ASSET_STATUS.PENDING) {
    throw new AssetStateError("Only pending uploads can be confirmed.");
  }

  const objectHead = await headR2Object(asset.key);
  const contentType = objectHead.contentType ?? asset.contentType;
  const fileSizeBytes = objectHead.contentLength ?? asset.fileSizeBytes;

  getAssetUploadPolicy({
    purpose: getUploadableAssetPurpose(asset.purpose),
    contentType,
    fileSizeBytes,
  });

  const confirmedAsset = await confirmQRCodeAssetUpload({
    workspaceId,
    assetId,
    checksum: request.checksum ?? asset.checksum ?? undefined,
    fileSizeBytes,
    contentType,
  });

  await createAuditLog({
    workspaceId,
    actorUserId: userId,
    action: AUDIT_ACTION.UPDATE,
    entityType: AUDIT_ENTITY_TYPE.QR_CODE_ASSET,
    entityId: asset.id,
    metadata: {
      status: ASSET_STATUS.READY,
      purpose: asset.purpose,
    },
  });

  return getClientSafeAsset(confirmedAsset);
}

export async function deleteAsset({
  assetId,
  workspaceId: requestedWorkspaceId,
  userId,
}: DeleteAssetInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: requestedWorkspaceId,
  });
  const asset = await getRequiredWorkspaceAsset({ workspaceId, assetId });

  if (asset.status === ASSET_STATUS.DELETED) {
    throw new AssetStateError("This asset has already been deleted.");
  }

  await deleteR2Object(asset.key);
  const deletedAsset = await softDeleteQRCodeAsset({ workspaceId, assetId });

  await createAuditLog({
    workspaceId,
    actorUserId: userId,
    action: AUDIT_ACTION.DELETE,
    entityType: AUDIT_ENTITY_TYPE.QR_CODE_ASSET,
    entityId: asset.id,
    metadata: {
      purpose: asset.purpose,
      qrCodeId: asset.qrCodeId,
      landingPageId: asset.landingPageId,
    },
  });

  return getClientSafeAsset(deletedAsset);
}

async function assertAssetAttachmentAccess({
  workspaceId,
  purpose,
  qrCodeId,
  landingPageId,
}: {
  readonly workspaceId: string;
  readonly purpose: string;
  readonly qrCodeId?: string;
  readonly landingPageId?: string;
}): Promise<void> {
  if (purpose === ASSET_PURPOSE.QR_LOGO) {
    if (!qrCodeId || landingPageId) {
      throw new AssetValidationError("QR logo uploads require one QR code.");
    }

    const qrCode = await prisma.qRCode.findFirst({
      where: { id: qrCodeId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!qrCode) throw new AssetNotFoundError("QR code was not found.");

    return;
  }

  if (purpose === ASSET_PURPOSE.LANDING_PAGE_MEDIA) {
    if (qrCodeId) {
      throw new AssetValidationError(
        "Landing page media uploads cannot be attached to a QR code."
      );
    }

    if (!landingPageId) return;

    const landingPage = await prisma.landingPage.findFirst({
      where: { id: landingPageId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!landingPage) {
      throw new AssetNotFoundError("Landing page was not found.");
    }

    return;
  }

  if (purpose === ASSET_PURPOSE.QR_FILE) {
    if (landingPageId) {
      throw new AssetValidationError(
        "QR file uploads cannot be attached to a landing page."
      );
    }

    // Like landing-page media, the file is usually uploaded before the QR
    // code exists; when a QR id is provided, it must belong to the workspace.
    if (!qrCodeId) return;

    const qrCode = await prisma.qRCode.findFirst({
      where: { id: qrCodeId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!qrCode) throw new AssetNotFoundError("QR code was not found.");

    return;
  }

  throw new AssetValidationError("This upload purpose is not supported.");
}

async function getRequiredWorkspaceAsset({
  workspaceId,
  assetId,
}: {
  readonly workspaceId: string;
  readonly assetId: string;
}) {
  const asset = await getWorkspaceAsset({ workspaceId, assetId });
  if (!asset) throw new AssetNotFoundError("Asset was not found.");

  return asset;
}

async function resolveWritableWorkspaceId({
  userId,
  workspaceId,
}: {
  readonly userId: string;
  readonly workspaceId?: string;
}): Promise<string> {
  if (workspaceId) {
    const access = await getWorkspaceAccess({ userId, workspaceId });
    if (!access) throw new Error("You do not have access to this workspace.");

    return workspaceId;
  }

  const defaultWorkspace =
    (await getDefaultWorkspaceForUser({ userId })) ??
    (await createDefaultWorkspaceForUser({ userId }));

  return defaultWorkspace.id;
}

function getUploadableAssetPurpose(value: string): AssetPurpose {
  if (value === ASSET_PURPOSE.QR_LOGO) return ASSET_PURPOSE.QR_LOGO;
  if (value === ASSET_PURPOSE.QR_FILE) return ASSET_PURPOSE.QR_FILE;
  if (value === ASSET_PURPOSE.LANDING_PAGE_MEDIA) {
    return ASSET_PURPOSE.LANDING_PAGE_MEDIA;
  }

  throw new AssetValidationError("This upload purpose is not supported.");
}

function getClientSafeAsset<TAsset extends { readonly key: string }>(
  asset: TAsset
): Omit<TAsset, "key"> {
  return Object.fromEntries(
    Object.entries(asset).filter(([key]) => key !== "key")
  ) as Omit<TAsset, "key">;
}
