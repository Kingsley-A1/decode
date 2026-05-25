import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ASSET_PURPOSE, ASSET_STATUS } from "@/server/assets/constants";
import {
  createQRCodeAsset,
  findReadyQRCodeExportByKey,
} from "@/server/assets/repository";
import { getR2SignedDownloadUrl, putR2Object } from "@/server/assets/r2";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@/server/audit/constants";
import { createAuditLog } from "@/server/audit/repository";
import { verifyLink } from "@/server/links/service";
import { QR_CODE_MODE, QR_CODE_STATUS, QR_CODE_TYPE } from "@/server/qr/constants";
import { getQRDesignWarnings } from "@/server/qr/design";
import {
  QRCodeConflictError,
  QRCodeNotFoundError,
  QRCodeStateError,
} from "@/server/qr/errors";
import {
  buildQRPayload,
  normalizeHttpUrl,
  type BuiltQRPayload,
} from "@/server/qr/payload";
import { renderQRCode } from "@/server/qr/render";
import {
  createQRCodeRequestSchema,
  qrDesignSchema,
  type ArchiveQRCodeRequest,
  type CreateQRCodeRequest,
  type RenderQRCodeRequest,
  type UpdateQRCodeDestinationRequest,
  type UpdateQRCodeRequest,
} from "@/server/qr/schemas";
import {
  qrCodeDashboardSelect,
  type QRCodeDashboardRecord,
} from "@/server/qr/selectors";
import {
  getDynamicQRCodeRedirectUrl,
  isReservedDynamicSlug,
  normalizeDynamicSlug,
} from "@/server/qr/slugs";
import { getRenderableWorkspaceQRCode } from "@/server/qr/repository";
import {
  getDefaultWorkspaceForUser,
  getWorkspaceAccess,
} from "@/server/workspaces/repository";
import { createDefaultWorkspaceForUser } from "@/server/workspaces/service";

export interface PreparedQRCode {
  readonly payload: BuiltQRPayload;
  readonly design: CreateQRCodeRequest["design"];
  readonly warnings: ReturnType<typeof getQRDesignWarnings>;
}

interface PrepareQRCodeOptions {
  readonly dynamicSlug?: string | null;
}

export interface CreateQRCodeInput {
  readonly request: CreateQRCodeRequest;
  readonly userId?: string;
}

export interface RenderSavedQRCodeInput {
  readonly qrCodeId: string;
  readonly request: RenderQRCodeRequest;
  readonly userId: string;
}

export interface UpdateDynamicQRCodeDestinationInput {
  readonly qrCodeId: string;
  readonly request: UpdateQRCodeDestinationRequest;
  readonly userId: string;
}

export interface ArchiveQRCodeInput {
  readonly qrCodeId: string;
  readonly request: ArchiveQRCodeRequest;
  readonly userId: string;
}

export interface UpdateQRCodeInput {
  readonly qrCodeId: string;
  readonly request: UpdateQRCodeRequest;
  readonly userId: string;
}

export interface UpdateQRCodeInWorkspaceInput {
  readonly qrCodeId: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly title?: string;
  readonly destinationUrl?: string;
}

export interface DuplicateQRCodeInput {
  readonly qrCodeId: string;
  readonly workspaceId?: string;
  readonly userId: string;
}

export interface UpdateDynamicQRCodeDestinationInWorkspaceInput {
  readonly qrCodeId: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly destinationUrl: string;
}

export interface ArchiveQRCodeInWorkspaceInput {
  readonly qrCodeId: string;
  readonly workspaceId: string;
  readonly userId: string;
}

const dynamicQRCodeDestinationSelect = {
  ...qrCodeDashboardSelect,
  payload: true,
} satisfies Prisma.QRCodeSelect;

type DynamicQRCodeDestinationRecord = Prisma.QRCodeGetPayload<{
  select: typeof dynamicQRCodeDestinationSelect;
}>;

export interface DynamicDestinationTransactionClient {
  readonly qRCode: {
    findFirst(
      args: Prisma.QRCodeFindFirstArgs
    ): Promise<DynamicQRCodeDestinationRecord | null>;
    update(
      args: Prisma.QRCodeUpdateArgs
    ): Promise<DynamicQRCodeDestinationRecord>;
  };
  readonly auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>;
  };
}

export interface DynamicDestinationClient {
  $transaction<TResult>(
    callback: (
      transaction: DynamicDestinationTransactionClient
    ) => Promise<TResult>
  ): Promise<TResult>;
}

export interface ArchiveQRCodeTransactionClient {
  readonly qRCode: {
    findFirst(
      args: Prisma.QRCodeFindFirstArgs
    ): Promise<QRCodeDashboardRecord | null>;
    update(args: Prisma.QRCodeUpdateArgs): Promise<QRCodeDashboardRecord>;
  };
  readonly auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>;
  };
}

export interface ArchiveQRCodeClient {
  $transaction<TResult>(
    callback: (
      transaction: ArchiveQRCodeTransactionClient
    ) => Promise<TResult>
  ): Promise<TResult>;
}


const GENERATED_DYNAMIC_SLUG_ATTEMPTS = 5;

interface DynamicSlugLookupClient {
  readonly qRCode: {
    findUnique(
      args: Prisma.QRCodeFindUniqueArgs
    ): Promise<{ readonly id: string } | null>;
  };
}

export function prepareQRCode(
  request: CreateQRCodeRequest,
  options: PrepareQRCodeOptions = {}
): PreparedQRCode {
  const payload = getPreparedPayload(request, options.dynamicSlug);
  const warnings = getQRDesignWarnings(request.design);

  return { payload, design: request.design, warnings };
}

export async function createQRCode({
  request,
  userId,
}: CreateQRCodeInput) {
  if (!request.save) {
    const preparedQRCode = prepareQRCode(request);

    return { qrCode: null, ...preparedQRCode };
  }

  if (!userId) {
    throw new Error("Sign in before saving QR codes.");
  }

  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const isDynamic = request.mode === QR_CODE_MODE.DYNAMIC;

  // Dynamic QR codes redirect through Decode, so we own the safety of the
  // destination. Verify it before minting a public slug.
  if (isDynamic && request.type === QR_CODE_TYPE.URL) {
    await assertDynamicDestinationAllowed(request.content.url);
  }

  const requestedSlug = getRequestedDynamicQRCodeSlug(request);
  const attempts =
    isDynamic && !requestedSlug ? GENERATED_DYNAMIC_SLUG_ATTEMPTS : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const slug = isDynamic
      ? requestedSlug ?? createGeneratedDynamicSlug()
      : null;
    const preparedQRCode = prepareQRCode(request, { dynamicSlug: slug });
    const title = request.title ?? getDefaultQRCodeTitle(preparedQRCode.payload);

    try {
      const qrCode = await createQRCodeRecord({
        request,
        userId,
        workspaceId,
        title,
        slug,
        payload: preparedQRCode.payload,
        design: preparedQRCode.design,
        isDynamic,
      });

      return { qrCode, ...preparedQRCode };
    } catch (error) {
      if (
        !requestedSlug &&
        error instanceof QRCodeConflictError &&
        attempt < attempts - 1
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new QRCodeConflictError("Could not assign a unique dynamic QR slug.");
}

export const createStaticQRCode = createQRCode;

export async function updateDynamicQRCodeDestination({
  qrCodeId,
  request,
  userId,
}: UpdateDynamicQRCodeDestinationInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const destinationUrl = normalizeHttpUrl(request.destinationUrl);

  return updateDynamicQRCodeDestinationInWorkspace({
    qrCodeId,
    workspaceId,
    userId,
    destinationUrl,
  });
}

export async function updateQRCode({
  qrCodeId,
  request,
  userId,
}: UpdateQRCodeInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const destinationUrl =
    request.destinationUrl !== undefined
      ? normalizeHttpUrl(request.destinationUrl)
      : undefined;

  if (destinationUrl !== undefined) {
    await assertDynamicDestinationAllowed(destinationUrl);
  }

  return updateQRCodeInWorkspace({
    qrCodeId,
    workspaceId,
    userId,
    title: request.title,
    destinationUrl,
  });
}

/**
 * Blocks confirmed-malicious destinations from being encoded behind a Decode
 * dynamic redirect. Fails open: a verification outage must never block a
 * legitimate edit to a live customer link.
 */
async function assertDynamicDestinationAllowed(url: string): Promise<void> {
  let verdict: string | undefined;

  try {
    verdict = (await verifyLink({ url })).verdict;
  } catch {
    return;
  }

  if (verdict === "malicious") {
    throw new QRCodeStateError(
      "This destination was flagged as malicious and cannot be used."
    );
  }
}

export async function duplicateQRCode({
  qrCodeId,
  workspaceId: requestedWorkspaceId,
  userId,
}: DuplicateQRCodeInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: requestedWorkspaceId,
  });
  const source = await getRenderableWorkspaceQRCode({ workspaceId, qrCodeId });

  if (!source) {
    throw new QRCodeNotFoundError("QR code was not found in this workspace.");
  }

  // Rebuild a create request from the stored content + design so the clone
  // goes through the same validation, slug minting (for dynamic), and audit
  // path as a brand-new code. The clone always starts in the same workspace.
  const design = qrDesignSchema.parse(source.designConfig);
  const storedContent = getStoredPayloadContent(
    getStoredPayloadObject(source.payload).content
  );
  const request = createQRCodeRequestSchema.parse({
    workspaceId,
    mode: source.mode,
    type: source.type,
    save: true,
    title: `Copy of ${source.title}`.slice(0, 120),
    content: storedContent,
    design,
  });

  return createQRCode({ request, userId });
}

export async function archiveQRCode({
  qrCodeId,
  request,
  userId,
}: ArchiveQRCodeInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });

  return archiveQRCodeInWorkspace({
    qrCodeId,
    workspaceId,
    userId,
  });
}

export async function updateDynamicQRCodeDestinationInWorkspace(
  input: UpdateDynamicQRCodeDestinationInWorkspaceInput,
  client: DynamicDestinationClient = getDynamicDestinationClient()
) {
  return client.$transaction(async (transaction) => {
    const qrCode = await transaction.qRCode.findFirst({
      where: {
        id: input.qrCodeId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      select: dynamicQRCodeDestinationSelect,
    });

    if (!qrCode) {
      throw new QRCodeNotFoundError("QR code was not found in this workspace.");
    }

    if (qrCode.mode !== QR_CODE_MODE.DYNAMIC) {
      throw new QRCodeStateError("Only dynamic QR codes can change destination.");
    }

    if (qrCode.status === QR_CODE_STATUS.ARCHIVED) {
      throw new QRCodeStateError("Archived dynamic QR codes cannot be changed.");
    }

    const updatedPayload = updateStoredDynamicPayloadDestination({
      payload: qrCode.payload,
      destinationUrl: input.destinationUrl,
    });
    const previousDestinationUrl = qrCode.destinationUrl;
    const updatedQRCode = await transaction.qRCode.update({
      where: { id: qrCode.id },
      data: {
        destinationUrl: input.destinationUrl,
        payload: updatedPayload,
      },
      select: dynamicQRCodeDestinationSelect,
    });

    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.userId,
        action: AUDIT_ACTION.DESTINATION_CHANGE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: qrCode.id,
        metadata: {
          previousUrl: previousDestinationUrl,
          nextUrl: input.destinationUrl,
          slug: qrCode.slug,
        },
      },
    });

    return {
      qrCode: getQRCodeSummary(updatedQRCode),
      previousDestinationUrl,
      destinationUrl: input.destinationUrl,
    };
  });
}

export async function updateQRCodeInWorkspace(
  input: UpdateQRCodeInWorkspaceInput,
  client: DynamicDestinationClient = getDynamicDestinationClient()
) {
  return client.$transaction(async (transaction) => {
    const qrCode = await transaction.qRCode.findFirst({
      where: {
        id: input.qrCodeId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      select: dynamicQRCodeDestinationSelect,
    });

    if (!qrCode) {
      throw new QRCodeNotFoundError("QR code was not found in this workspace.");
    }

    const data: Prisma.QRCodeUpdateInput = {};
    const renameTitle =
      input.title !== undefined && input.title !== qrCode.title
        ? input.title
        : undefined;
    if (renameTitle !== undefined) {
      data.title = renameTitle;
    }

    const previousDestinationUrl = qrCode.destinationUrl;
    if (input.destinationUrl !== undefined) {
      if (qrCode.mode !== QR_CODE_MODE.DYNAMIC) {
        throw new QRCodeStateError(
          "Only dynamic QR codes can change destination."
        );
      }
      if (qrCode.status === QR_CODE_STATUS.ARCHIVED) {
        throw new QRCodeStateError(
          "Archived dynamic QR codes cannot be changed."
        );
      }

      data.destinationUrl = input.destinationUrl;
      data.payload = updateStoredDynamicPayloadDestination({
        payload: qrCode.payload,
        destinationUrl: input.destinationUrl,
      });
    }

    const updatedQRCode = await transaction.qRCode.update({
      where: { id: qrCode.id },
      data,
      select: dynamicQRCodeDestinationSelect,
    });

    if (data.destinationUrl !== undefined) {
      await transaction.auditLog.create({
        data: {
          workspaceId: input.workspaceId,
          actorUserId: input.userId,
          action: AUDIT_ACTION.DESTINATION_CHANGE,
          entityType: AUDIT_ENTITY_TYPE.QR_CODE,
          entityId: qrCode.id,
          metadata: {
            previousUrl: previousDestinationUrl,
            nextUrl: input.destinationUrl,
            slug: qrCode.slug,
          },
        },
      });
    }

    if (renameTitle !== undefined) {
      await transaction.auditLog.create({
        data: {
          workspaceId: input.workspaceId,
          actorUserId: input.userId,
          action: AUDIT_ACTION.UPDATE,
          entityType: AUDIT_ENTITY_TYPE.QR_CODE,
          entityId: qrCode.id,
          metadata: {
            previousTitle: qrCode.title,
            nextTitle: renameTitle,
          },
        },
      });
    }

    return {
      qrCode: getQRCodeSummary(updatedQRCode),
      previousDestinationUrl,
      destinationUrl: input.destinationUrl ?? updatedQRCode.destinationUrl,
    };
  });
}

export async function archiveQRCodeInWorkspace(
  input: ArchiveQRCodeInWorkspaceInput,
  client: ArchiveQRCodeClient = getArchiveQRCodeClient()
) {
  return client.$transaction(async (transaction) => {
    const qrCode = await transaction.qRCode.findFirst({
      where: {
        id: input.qrCodeId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        workspace: { deletedAt: null },
      },
      select: qrCodeDashboardSelect,
    });

    if (!qrCode) {
      throw new QRCodeNotFoundError("QR code was not found in this workspace.");
    }

    if (qrCode.status === QR_CODE_STATUS.ARCHIVED) {
      return getQRCodeSummary(qrCode);
    }

    const archivedAt = new Date();
    const updatedQRCode = await transaction.qRCode.update({
      where: { id: qrCode.id },
      data: {
        status: QR_CODE_STATUS.ARCHIVED,
        archivedAt,
      },
      select: qrCodeDashboardSelect,
    });

    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.userId,
        action: AUDIT_ACTION.ARCHIVE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: qrCode.id,
        metadata: {
          previousStatus: qrCode.status,
          slug: qrCode.slug,
        },
      },
    });

    return getQRCodeSummary(updatedQRCode);
  });
}

function getDynamicDestinationClient(): DynamicDestinationClient {
  return {
    $transaction: (callback) =>
      prisma.$transaction((transaction) =>
        callback(
          transaction as unknown as DynamicDestinationTransactionClient
        )
      ),
  };
}

function getArchiveQRCodeClient(): ArchiveQRCodeClient {
  return {
    $transaction: (callback) =>
      prisma.$transaction((transaction) =>
        callback(transaction as unknown as ArchiveQRCodeTransactionClient)
      ),
  };
}

async function createQRCodeRecord({
  request,
  userId,
  workspaceId,
  title,
  slug,
  payload,
  design,
  isDynamic,
}: {
  readonly request: CreateQRCodeRequest;
  readonly userId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly slug: string | null;
  readonly payload: BuiltQRPayload;
  readonly design: CreateQRCodeRequest["design"];
  readonly isDynamic: boolean;
}) {
  try {
    return await prisma.$transaction(async (transaction) => {
      if (slug) {
        await assertDynamicSlugAvailable(slug, transaction);
      }

      const createdQRCode = await transaction.qRCode.create({
        data: {
          workspaceId,
          ownerId: userId,
          title,
          type: request.type,
          mode: request.mode,
          status: isDynamic ? QR_CODE_STATUS.PUBLISHED : QR_CODE_STATUS.DRAFT,
          slug,
          payload: getStoredPayload(payload),
          destinationUrl: payload.destinationUrl,
          designConfig: design as Prisma.InputJsonValue,
          ...(isDynamic ? { publishedAt: new Date() } : {}),
        },
        select: qrCodeDashboardSelect,
      });

      await transaction.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: AUDIT_ACTION.CREATE,
          entityType: AUDIT_ENTITY_TYPE.QR_CODE,
          entityId: createdQRCode.id,
          metadata: {
            type: request.type,
            mode: request.mode,
            ...(slug ? { slug } : {}),
          },
        },
      });

      return createdQRCode;
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new QRCodeConflictError("This dynamic QR slug is already in use.");
    }

    throw error;
  }
}

function getQRCodeSummary(
  record: QRCodeDashboardRecord | DynamicQRCodeDestinationRecord
) {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    ownerId: record.ownerId,
    title: record.title,
    type: record.type,
    mode: record.mode,
    status: record.status,
    slug: record.slug,
    destinationUrl: record.destinationUrl,
    scanCount: record.scanCount,
    publishedAt: record.publishedAt,
    archivedAt: record.archivedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    landingPage: record.landingPage,
  };
}

export async function renderSavedQRCode({
  qrCodeId,
  request,
  userId,
}: RenderSavedQRCodeInput) {
  const workspaceId = await resolveWritableWorkspaceId({
    userId,
    workspaceId: request.workspaceId,
  });
  const qrCode = await getRenderableWorkspaceQRCode({ workspaceId, qrCodeId });

  if (!qrCode) {
    throw new Error("QR code was not found in this workspace.");
  }

  const payloadValue = getStoredPayloadValue(qrCode.payload);
  const design = qrDesignSchema.parse(qrCode.designConfig);
  const warnings = getQRDesignWarnings(design);

  // Cache renders by a deterministic design hash so re-downloading the same
  // design reuses the existing R2 object instead of re-rendering and storing
  // a duplicate. The key changes only when the design or content changes.
  const designHash = getRenderDesignHash({
    payloadValue,
    design,
    format: request.format,
    title: qrCode.title,
  });
  const key = getExportObjectKey({
    workspaceId,
    qrCodeId,
    format: request.format,
    designHash,
  });

  const cachedAsset = await findReadyQRCodeExportByKey(key);
  if (cachedAsset) {
    const downloadUrl = await getR2SignedDownloadUrl(cachedAsset.key);

    return { asset: cachedAsset, downloadUrl, warnings };
  }

  const renderedQRCode = await renderQRCode({
    value: payloadValue,
    design,
    format: request.format,
    title: qrCode.title,
  });
  const bodyBuffer = getRenderedBodyBuffer(renderedQRCode.body);
  const uploadedObject = await putR2Object({
    key,
    body: bodyBuffer,
    contentType: renderedQRCode.contentType,
  });
  const asset = await createQRCodeAsset({
    workspaceId,
    qrCodeId,
    uploaderId: userId,
    purpose: ASSET_PURPOSE.QR_EXPORT,
    status: ASSET_STATUS.READY,
    bucket: uploadedObject.bucket,
    key: uploadedObject.key,
    publicUrl: uploadedObject.publicUrl,
    contentType: renderedQRCode.contentType,
    fileSizeBytes: bodyBuffer.byteLength,
    checksum: getSha256(bodyBuffer),
  });
  const downloadUrl = await getR2SignedDownloadUrl(uploadedObject.key);

  await createAuditLog({
    workspaceId,
    actorUserId: userId,
    action: AUDIT_ACTION.ASSET_UPLOAD,
    entityType: AUDIT_ENTITY_TYPE.QR_CODE_ASSET,
    entityId: asset.id,
    metadata: { qrCodeId, format: request.format },
  });

  return { asset, downloadUrl, warnings };
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

function getPreparedPayload(
  request: CreateQRCodeRequest,
  dynamicSlug?: string | null
): BuiltQRPayload {
  const payload = buildQRPayload(request);

  if (request.mode !== QR_CODE_MODE.DYNAMIC) {
    return payload;
  }

  const slug = getAssignedDynamicQRCodeSlug(request, dynamicSlug);
  if (!slug) {
    throw new QRCodeStateError("Dynamic QR codes require an assigned redirect slug.");
  }

  if (!payload.destinationUrl) {
    throw new QRCodeStateError("Dynamic QR codes require a destination URL.");
  }

  return {
    ...payload,
    value: getDynamicQRCodeRedirectUrl(slug),
    destinationUrl: payload.destinationUrl,
    normalizedContent: {
      ...payload.normalizedContent,
      url: payload.destinationUrl,
    },
  };
}

function getRequestedDynamicQRCodeSlug(
  request: CreateQRCodeRequest
): string | null {
  if (request.mode !== QR_CODE_MODE.DYNAMIC) return null;

  if (!request.slug) return null;

  const slug = normalizeDynamicSlug(request.slug);
  if (isReservedDynamicSlug(slug)) {
    throw new QRCodeStateError("This dynamic QR slug is reserved by Decode.");
  }

  return slug;
}

function getAssignedDynamicQRCodeSlug(
  request: CreateQRCodeRequest,
  dynamicSlug?: string | null
): string | null {
  return getRequestedDynamicQRCodeSlug(request) ?? dynamicSlug ?? null;
}

function createGeneratedDynamicSlug(): string {
  return `qr-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function assertDynamicSlugAvailable(
  slug: string,
  client: DynamicSlugLookupClient
): Promise<void> {
  const existingQRCode = await client.qRCode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingQRCode) {
    throw new QRCodeConflictError("This dynamic QR slug is already in use.");
  }
}

function getDefaultQRCodeTitle(payload: BuiltQRPayload): string {
  if (payload.destinationUrl) return payload.destinationUrl;

  return `${payload.type.toUpperCase()} QR Code`;
}

function getStoredPayload(payload: BuiltQRPayload): Prisma.InputJsonValue {
  return {
    type: payload.type,
    value: payload.value,
    content: removeUndefinedValues(payload.normalizedContent),
  };
}

function getStoredPayloadValue(payload: Prisma.JsonValue): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Saved QR code payload is invalid.");
  }

  const record = payload as Record<string, Prisma.JsonValue>;
  const value = record.value;
  if (typeof value !== "string") {
    throw new Error("Saved QR code payload value is invalid.");
  }

  return value;
}

function updateStoredDynamicPayloadDestination({
  payload,
  destinationUrl,
}: {
  readonly payload: Prisma.JsonValue;
  readonly destinationUrl: string;
}): Prisma.InputJsonValue {
  const record = getStoredPayloadObject(payload);
  const value = record.value;
  const type = record.type;

  if (typeof value !== "string" || typeof type !== "string") {
    throw new QRCodeStateError("Saved dynamic QR payload is invalid.");
  }

  return {
    type,
    value,
    content: {
      ...getStoredPayloadContent(record.content),
      url: destinationUrl,
    },
  };
}

function getStoredPayloadObject(
  payload: Prisma.JsonValue
): Record<string, Prisma.JsonValue> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new QRCodeStateError("Saved QR code payload is invalid.");
  }

  return payload as Record<string, Prisma.JsonValue>;
}

function getStoredPayloadContent(
  content: Prisma.JsonValue | undefined
): Record<string, Prisma.JsonValue> {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }

  return content as Record<string, Prisma.JsonValue>;
}

function getRenderedBodyBuffer(body: Buffer | string): Buffer {
  return Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
}

function getExportObjectKey({
  workspaceId,
  qrCodeId,
  format,
  designHash,
}: {
  readonly workspaceId: string;
  readonly qrCodeId: string;
  readonly format: string;
  readonly designHash: string;
}): string {
  return `workspaces/${workspaceId}/qr/${qrCodeId}/exports/${format}-${designHash}.${format}`;
}

function getRenderDesignHash({
  payloadValue,
  design,
  format,
  title,
}: {
  readonly payloadValue: string;
  readonly design: CreateQRCodeRequest["design"];
  readonly format: string;
  readonly title: string;
}): string {
  // Canonical, order-stable representation of everything that affects output.
  const canonical = JSON.stringify({
    v: 1,
    payloadValue,
    format,
    title,
    design: Object.fromEntries(
      Object.entries(design).sort(([a], [b]) => a.localeCompare(b))
    ),
  });

  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

function getSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function removeUndefinedValues(
  value: Record<string, string | boolean | undefined>
): Record<string, string | boolean> {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string | boolean] =>
      entry[1] !== undefined
    )
  );
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
