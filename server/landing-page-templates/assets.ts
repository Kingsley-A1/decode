import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { ASSET_PURPOSE } from "@/server/assets/constants";
import { getAssetUploadPolicy } from "@/server/assets/policy";
import {
  getR2Object,
  putR2Object,
} from "@/server/assets/r2";
import {
  PLATFORM_AUDIT_ACTION,
  PLATFORM_ENTITY_TYPE,
} from "@/server/admin/constants";
import { writePlatformAuditLog } from "@/server/admin/audit";
import type { AdminSessionUser } from "@/server/admin/auth";
import type { AdminRequestTelemetry } from "@/server/admin/telemetry";
import { prisma } from "@/server/db/prisma";

export interface AdminTemplateAssetUploadInput {
  readonly admin: AdminSessionUser;
  readonly fileName: string;
  readonly contentType: string;
  readonly body: Buffer;
  readonly checksum?: string;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}

export async function uploadAdminLandingPageTemplateAsset({
  admin,
  fileName,
  contentType,
  body,
  checksum,
  requestId,
  telemetry,
}: AdminTemplateAssetUploadInput) {
  const policy = getAssetUploadPolicy({
    purpose: ASSET_PURPOSE.LANDING_PAGE_MEDIA,
    contentType,
    fileSizeBytes: body.byteLength,
  });
  const assetId = randomUUID();
  const key = `landing-page-templates/admin/${assetId}.${policy.extension}`;
  const uploaded = await putR2Object({
    key,
    body,
    contentType: policy.contentType,
  });

  return prisma.$transaction(async (transaction) => {
    const asset = await transaction.landingPageTemplateUploadedAsset.create({
      data: {
        id: assetId,
        uploaderAdminUserId: admin.id,
        bucket: uploaded.bucket,
        key: uploaded.key,
        publicUrl: uploaded.publicUrl,
        contentType: policy.contentType,
        fileSizeBytes: body.byteLength,
        checksum,
      },
      select: landingPageTemplateUploadedAssetSelect,
    });

    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action: PLATFORM_AUDIT_ACTION.TEMPLATE_ASSET_UPLOAD,
        entityType: PLATFORM_ENTITY_TYPE.LANDING_PAGE_TEMPLATE_ASSET,
        entityId: asset.id,
        requestId,
        metadata: {
          fileName,
          contentType: asset.contentType,
          fileSizeBytes: asset.fileSizeBytes,
        },
        telemetry,
      },
      transaction
    );

    return toClientTemplateUploadedAsset(asset);
  });
}

export async function getPublicLandingPageTemplateUploadedAsset(assetId: string) {
  const asset = await prisma.landingPageTemplateUploadedAsset.findFirst({
    where: { id: assetId, deletedAt: null },
    select: landingPageTemplateUploadedAssetSelect,
  });

  if (!asset) return null;

  return {
    asset,
    object: await getR2Object(asset.key),
  };
}

const landingPageTemplateUploadedAssetSelect = {
  id: true,
  bucket: true,
  key: true,
  publicUrl: true,
  contentType: true,
  fileSizeBytes: true,
  checksum: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LandingPageTemplateUploadedAssetSelect;

type LandingPageTemplateUploadedAssetRecord =
  Prisma.LandingPageTemplateUploadedAssetGetPayload<{
    select: typeof landingPageTemplateUploadedAssetSelect;
  }>;

function toClientTemplateUploadedAsset(
  asset: LandingPageTemplateUploadedAssetRecord
) {
  return {
    id: asset.id,
    publicUrl: asset.publicUrl,
    assetPath:
      asset.publicUrl ?? `/api/landing-page-template-assets/${asset.id}`,
    contentType: asset.contentType,
    fileSizeBytes: asset.fileSizeBytes,
    checksum: asset.checksum,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}
