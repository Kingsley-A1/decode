import "server-only";

import type { Prisma } from "@prisma/client";
import { ASSET_PURPOSE } from "@/server/assets/constants";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@/server/audit/constants";
import { prisma } from "@/server/db/prisma";
import {
  LANDING_PAGE_STATUS,
  type LandingPageStatus,
  type LandingPageType,
} from "@/server/landing-pages/constants";
import {
  LandingPageConflictError,
  LandingPageNotFoundError,
  LandingPageStateError,
} from "@/server/landing-pages/errors";
import {
  findUsableTemplateByKey,
  recordLandingPageTemplateUsage,
} from "@/server/landing-page-templates/service";
import { landingPageSummarySelect } from "@/server/landing-pages/selectors";
import {
  getLandingPageContentAssetIds,
  parseLandingPageContent,
  type CreateLandingPageRequest,
  type UpdateLandingPageRequest,
} from "@/server/landing-pages/schemas";
import { QR_CODE_MODE, QR_CODE_STATUS } from "@/server/qr/constants";
import {
  getDefaultWorkspaceForUser,
  getWorkspaceAccess,
} from "@/server/workspaces/repository";
import { createDefaultWorkspaceForUser } from "@/server/workspaces/service";

export interface CreateLandingPageInput {
  readonly request: CreateLandingPageRequest;
  readonly userId: string;
}

export interface UpdateLandingPageInput {
  readonly landingPageId: string;
  readonly request: UpdateLandingPageRequest;
  readonly userId: string;
}

export async function createLandingPage({
  request,
  userId,
}: CreateLandingPageInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const content = parseLandingPageContent(request.type, request.content);

  try {
    return await prisma.$transaction(async (transaction) => {
      const qrCode = await transaction.qRCode.findFirst({
        where: {
          id: request.qrCodeId,
          workspaceId,
          deletedAt: null,
          workspace: { deletedAt: null },
        },
        select: {
          id: true,
          mode: true,
          status: true,
          slug: true,
          publishedAt: true,
        },
      });

      if (!qrCode) {
        throw new LandingPageNotFoundError(
          "QR code was not found in this workspace."
        );
      }

      assertDynamicQRCodeCanUseLandingPage(qrCode);

      const template = await findUsableTemplateByKey({
        templateKey: request.templateKey,
        transaction,
      });

      const landingPage = await transaction.landingPage.create({
        data: {
          workspaceId,
          qrCodeId: qrCode.id,
          ...(template ? { templateId: template.id } : {}),
          type: request.type,
          title: request.title,
          status: request.status,
          content,
          publishedAt: getPublishedAt(request.status),
        },
        select: landingPageSummarySelect,
      });

      await attachReferencedLandingPageAssets({
        transaction,
        workspaceId,
        landingPageId: landingPage.id,
        type: request.type,
        content: content as Prisma.JsonValue,
      });

      if (request.status === LANDING_PAGE_STATUS.PUBLISHED) {
        await transaction.qRCode.update({
          where: { id: qrCode.id },
          data: {
            status: QR_CODE_STATUS.PUBLISHED,
            publishedAt: qrCode.publishedAt ?? new Date(),
          },
          select: { id: true },
        });
      }

      if (template) {
        await recordLandingPageTemplateUsage({
          transaction,
          templateId: template.id,
          workspaceId,
          landingPageId: landingPage.id,
          actorUserId: userId,
        });
      }

      await transaction.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: AUDIT_ACTION.CREATE,
          entityType: AUDIT_ENTITY_TYPE.LANDING_PAGE,
          entityId: landingPage.id,
          metadata: {
            qrCodeId: qrCode.id,
            templateKey: template?.key ?? request.templateKey,
            type: request.type,
            status: request.status,
          },
        },
      });

      return landingPage;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new LandingPageConflictError(
        "This QR code already has a landing page."
      );
    }

    throw error;
  }
}

export async function updateLandingPage({
  landingPageId,
  request,
  userId,
}: UpdateLandingPageInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });

  return prisma.$transaction(async (transaction) => {
    const landingPage = await transaction.landingPage.findFirst({
      where: {
        id: landingPageId,
        workspaceId,
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      select: landingPageSummarySelect,
    });

    if (!landingPage) {
      throw new LandingPageNotFoundError(
        "Landing page was not found in this workspace."
      );
    }

    if (landingPage.status === LANDING_PAGE_STATUS.ARCHIVED) {
      throw new LandingPageStateError("Archived landing pages cannot be edited.");
    }

    if (request.type && request.content === undefined) {
      throw new LandingPageStateError(
        "Changing a landing page type requires replacement content."
      );
    }

    const nextType = getNextLandingPageType({
      currentType: landingPage.type,
      requestedType: request.type,
      hasContent: request.content !== undefined,
    });
    const nextStatus = request.status ?? landingPage.status;
    const content =
      request.content === undefined
        ? undefined
        : parseLandingPageContent(nextType, request.content);
    const updatedLandingPage = await transaction.landingPage.update({
      where: { id: landingPage.id },
      data: {
        ...(request.title ? { title: request.title } : {}),
        ...(request.type ? { type: request.type } : {}),
        ...(content ? { content } : {}),
        ...(request.status ? { status: request.status } : {}),
        ...getPublishedAtUpdate({
          previousStatus: landingPage.status as LandingPageStatus,
          nextStatus: nextStatus as LandingPageStatus,
          previousPublishedAt: landingPage.publishedAt,
        }),
      },
      select: landingPageSummarySelect,
    });

    await attachReferencedLandingPageAssets({
      transaction,
      workspaceId,
      landingPageId: updatedLandingPage.id,
      type: updatedLandingPage.type as LandingPageType,
      content: updatedLandingPage.content,
    });

    await transaction.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: getLandingPageAuditAction({
          previousStatus: landingPage.status as LandingPageStatus,
          nextStatus: nextStatus as LandingPageStatus,
        }),
        entityType: AUDIT_ENTITY_TYPE.LANDING_PAGE,
        entityId: landingPage.id,
        metadata: {
          qrCodeId: landingPage.qrCodeId,
          previousStatus: landingPage.status,
          nextStatus,
          type: updatedLandingPage.type,
        },
      },
    });

    return updatedLandingPage;
  });
}

async function attachReferencedLandingPageAssets({
  transaction,
  workspaceId,
  landingPageId,
  type,
  content,
}: {
  readonly transaction: Prisma.TransactionClient;
  readonly workspaceId: string;
  readonly landingPageId: string;
  readonly type: LandingPageType;
  readonly content: Prisma.JsonValue;
}): Promise<void> {
  const assetIds = getLandingPageContentAssetIds(type, content);
  const uniqueAssetIds = [...new Set(assetIds)];
  if (uniqueAssetIds.length === 0) return;

  const result = await transaction.qRCodeAsset.updateMany({
    where: {
      id: { in: uniqueAssetIds },
      workspaceId,
      purpose: ASSET_PURPOSE.LANDING_PAGE_MEDIA,
      deletedAt: null,
      OR: [{ landingPageId: null }, { landingPageId }],
    },
    data: { landingPageId },
  });

  if (result.count !== uniqueAssetIds.length) {
    throw new LandingPageStateError(
      "One or more referenced landing page assets were not found in this workspace."
    );
  }
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

function assertDynamicQRCodeCanUseLandingPage(qrCode: {
  readonly mode: string;
  readonly status: string;
}): void {
  if (qrCode.mode !== QR_CODE_MODE.DYNAMIC) {
    throw new LandingPageStateError(
      "Landing pages can only be attached to dynamic QR codes."
    );
  }

  if (qrCode.status === QR_CODE_STATUS.ARCHIVED) {
    throw new LandingPageStateError(
      "Archived dynamic QR codes cannot receive landing pages."
    );
  }
}

function getPublishedAt(status: LandingPageStatus): Date | null {
  return status === LANDING_PAGE_STATUS.PUBLISHED ? new Date() : null;
}

function getPublishedAtUpdate({
  previousStatus,
  nextStatus,
  previousPublishedAt,
}: {
  readonly previousStatus: LandingPageStatus;
  readonly nextStatus: LandingPageStatus;
  readonly previousPublishedAt: Date | null;
}): Pick<Prisma.LandingPageUncheckedUpdateInput, "publishedAt"> {
  if (nextStatus === LANDING_PAGE_STATUS.PUBLISHED && !previousPublishedAt) {
    return { publishedAt: new Date() };
  }

  if (
    previousStatus === LANDING_PAGE_STATUS.PUBLISHED &&
    nextStatus === LANDING_PAGE_STATUS.DRAFT
  ) {
    return { publishedAt: null };
  }

  return {};
}

function getNextLandingPageType({
  currentType,
  requestedType,
  hasContent,
}: {
  readonly currentType: string;
  readonly requestedType?: LandingPageType;
  readonly hasContent: boolean;
}): LandingPageType {
  if (requestedType) return requestedType;

  if (hasContent) return currentType as LandingPageType;

  return currentType as LandingPageType;
}

function getLandingPageAuditAction({
  previousStatus,
  nextStatus,
}: {
  readonly previousStatus: LandingPageStatus;
  readonly nextStatus: LandingPageStatus;
}) {
  if (
    previousStatus !== LANDING_PAGE_STATUS.PUBLISHED &&
    nextStatus === LANDING_PAGE_STATUS.PUBLISHED
  ) {
    return AUDIT_ACTION.PUBLISH;
  }

  if (
    previousStatus === LANDING_PAGE_STATUS.PUBLISHED &&
    nextStatus === LANDING_PAGE_STATUS.DRAFT
  ) {
    return AUDIT_ACTION.UNPUBLISH;
  }

  return AUDIT_ACTION.UPDATE;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
