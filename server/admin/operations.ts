import "server-only";

import { ADMIN_ROLE, ADMIN_STATUS, PLATFORM_AUDIT_ACTION, PLATFORM_ENTITY_TYPE } from "@/server/admin/constants";
import { writePlatformAuditLog } from "@/server/admin/audit";
import { assertAdminOwner, type AdminSessionUser } from "@/server/admin/auth";
import { AdminAccessError } from "@/server/admin/errors";
import type {
  AdminQRCodeVisibilityRequest,
  AdminReviewModerationRequest,
  AdminUserStatusRequest,
  WorkspaceReviewRequest,
} from "@/server/admin/schemas";
import type { AdminRequestTelemetry } from "@/server/admin/telemetry";
import { QR_CODE_STATUS } from "@/server/qr/constants";
import { prisma } from "@/server/db/prisma";

export async function moderateReview({
  admin,
  reviewId,
  input,
  requestId,
  telemetry,
}: {
  readonly admin: AdminSessionUser;
  readonly reviewId: string;
  readonly input: AdminReviewModerationRequest;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}) {
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, status: true },
  });
  if (!existingReview) throw notFound("Review was not found.");

  return prisma.$transaction(async (transaction) => {
    const review = await transaction.review.update({
      where: { id: reviewId },
      data: { status: input.status },
      select: {
        id: true,
        status: true,
        title: true,
        updatedAt: true,
      },
    });

    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action: PLATFORM_AUDIT_ACTION.REVIEW_MODERATE,
        entityType: PLATFORM_ENTITY_TYPE.REVIEW,
        entityId: review.id,
        requestId,
        metadata: {
          previousStatus: existingReview.status,
          nextStatus: input.status,
          reason: input.reason,
        },
        telemetry,
      },
      transaction
    );

    return review;
  });
}

export async function updateQRCodeVisibility({
  admin,
  qrCodeId,
  input,
  requestId,
  telemetry,
}: {
  readonly admin: AdminSessionUser;
  readonly qrCodeId: string;
  readonly input: AdminQRCodeVisibilityRequest;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}) {
  const existingQRCode = await prisma.qRCode.findUnique({
    where: { id: qrCodeId },
    select: { id: true, status: true, archivedAt: true },
  });
  if (!existingQRCode) throw notFound("QR code was not found.");

  const isArchiving = input.status === QR_CODE_STATUS.ARCHIVED;
  const action = isArchiving
    ? PLATFORM_AUDIT_ACTION.QR_ARCHIVE
    : PLATFORM_AUDIT_ACTION.QR_RESTORE;

  return prisma.$transaction(async (transaction) => {
    const qrCode = await transaction.qRCode.update({
      where: { id: qrCodeId },
      data: {
        status: input.status,
        archivedAt: isArchiving ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        archivedAt: true,
        updatedAt: true,
      },
    });

    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action,
        entityType: PLATFORM_ENTITY_TYPE.QR_CODE,
        entityId: qrCode.id,
        requestId,
        metadata: {
          previousStatus: existingQRCode.status,
          nextStatus: input.status,
          reason: input.reason,
        },
        telemetry,
      },
      transaction
    );

    return qrCode;
  });
}

export async function updateAdminUserStatus({
  admin,
  adminUserId,
  input,
  requestId,
  telemetry,
}: {
  readonly admin: AdminSessionUser;
  readonly adminUserId: string;
  readonly input: AdminUserStatusRequest;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}) {
  assertAdminOwner(admin);

  if (admin.id === adminUserId && input.status === ADMIN_STATUS.DISABLED) {
    throw new AdminAccessError(
      "ADMIN_SELF_DISABLE_DENIED",
      "Owner admins cannot disable their own account.",
      400
    );
  }

  const targetAdmin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { id: true, status: true, role: true },
  });
  if (!targetAdmin) throw notFound("Admin user was not found.");

  if (targetAdmin.role === ADMIN_ROLE.OWNER && admin.id !== adminUserId) {
    throw new AdminAccessError(
      "ADMIN_OWNER_DISABLE_DENIED",
      "Owner admin accounts cannot be modified by another owner in v1.",
      403
    );
  }

  const action =
    input.status === ADMIN_STATUS.DISABLED
      ? PLATFORM_AUDIT_ACTION.ADMIN_DISABLE
      : PLATFORM_AUDIT_ACTION.ADMIN_ENABLE;

  return prisma.$transaction(async (transaction) => {
    const updatedAdmin = await transaction.adminUser.update({
      where: { id: adminUserId },
      data: {
        status: input.status,
        disabledAt: input.status === ADMIN_STATUS.DISABLED ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        disabledAt: true,
        updatedAt: true,
      },
    });

    if (input.status === ADMIN_STATUS.DISABLED) {
      await transaction.adminSession.updateMany({
        where: { adminUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action,
        entityType: PLATFORM_ENTITY_TYPE.ADMIN_USER,
        entityId: updatedAdmin.id,
        requestId,
        metadata: {
          previousStatus: targetAdmin.status,
          nextStatus: input.status,
          reason: input.reason,
        },
        telemetry,
      },
      transaction
    );

    return updatedAdmin;
  });
}

export async function reviewWorkspaceStatus({
  admin,
  workspaceId,
  input,
  requestId,
  telemetry,
}: {
  readonly admin: AdminSessionUser;
  readonly workspaceId: string;
  readonly input: WorkspaceReviewRequest;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, slug: true },
  });
  if (!workspace) throw notFound("Workspace was not found.");

  await writePlatformAuditLog({
    actorAdminUserId: admin.id,
    action: PLATFORM_AUDIT_ACTION.WORKSPACE_REVIEW,
    entityType: PLATFORM_ENTITY_TYPE.WORKSPACE,
    entityId: workspace.id,
    requestId,
    metadata: {
      status: input.status,
      note: input.note,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
    },
    telemetry,
  });

  return workspace;
}

function notFound(message: string): AdminAccessError {
  return new AdminAccessError("ADMIN_TARGET_NOT_FOUND", message, 404);
}
