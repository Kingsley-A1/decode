import "server-only";

import type { Prisma } from "@prisma/client";
import {
  PLATFORM_AUDIT_ACTION,
  PLATFORM_ENTITY_TYPE,
} from "@/server/admin/constants";
import { writePlatformAuditLog } from "@/server/admin/audit";
import type { AdminSessionUser } from "@/server/admin/auth";
import { AdminAccessError } from "@/server/admin/errors";
import type { AdminRequestTelemetry } from "@/server/admin/telemetry";
import { prisma } from "@/server/db/prisma";
import {
  LANDING_PAGE_TEMPLATE_STATUS,
  type LandingPageTemplateStatus,
} from "@/server/landing-page-templates/constants";
import {
  assertTemplateCanPublish,
  toTemplateJson,
  type AdminCreateLandingPageTemplateRequest,
  type AdminUpdateLandingPageTemplateRequest,
  type LandingPageTemplateDefinition,
} from "@/server/landing-page-templates/schemas";

export interface TemplateMutationInput<TRequest> {
  readonly admin: AdminSessionUser;
  readonly input: TRequest;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}

export interface TemplateUpdateInput
  extends TemplateMutationInput<AdminUpdateLandingPageTemplateRequest> {
  readonly templateId: string;
}

export async function listPublicLandingPageTemplates() {
  const records = await prisma.landingPageTemplate.findMany({
    where: {
      status: LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED,
      archivedAt: null,
      deletedAt: null,
    },
    orderBy: [{ sortPriority: "asc" }, { updatedAt: "desc" }],
    select: landingPageTemplateRecordSelect,
  });

  return records.map(toPublicLandingPageTemplate);
}

export async function getAdminLandingPageTemplate(templateId: string) {
  const template = await prisma.landingPageTemplate.findUnique({
    where: { id: templateId },
    select: landingPageTemplateRecordSelect,
  });
  if (!template) throw notFound();

  return toAdminLandingPageTemplate(template);
}

export async function createAdminLandingPageTemplate({
  admin,
  input,
  requestId,
  telemetry,
}: TemplateMutationInput<AdminCreateLandingPageTemplateRequest>) {
  const definition = normalizeTemplateDefinition(input);

  assertPublishableWhenNeeded(definition);

  return prisma.$transaction(async (transaction) => {
    const template = await transaction.landingPageTemplate.create({
      data: {
        ...toTemplateCreateData(definition),
        createdByAdminUserId: admin.id,
        updatedByAdminUserId: admin.id,
        ...getStatusTimestamps({ nextStatus: definition.status }),
        assets: {
          create: definition.assetRequirements.map(toTemplateAssetCreateData),
        },
      },
      select: landingPageTemplateRecordSelect,
    });

    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action: PLATFORM_AUDIT_ACTION.TEMPLATE_CREATE,
        entityType: PLATFORM_ENTITY_TYPE.LANDING_PAGE_TEMPLATE,
        entityId: template.id,
        requestId,
        metadata: {
          key: template.key,
          status: template.status,
          source: template.source,
        },
        telemetry,
      },
      transaction
    );

    if (template.status === LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED) {
      await writePlatformAuditLog(
        {
          actorAdminUserId: admin.id,
          action: PLATFORM_AUDIT_ACTION.TEMPLATE_PUBLISH,
          entityType: PLATFORM_ENTITY_TYPE.LANDING_PAGE_TEMPLATE,
          entityId: template.id,
          requestId,
          metadata: { key: template.key, source: template.source },
          telemetry,
        },
        transaction
      );
    }

    return toAdminLandingPageTemplate(template);
  });
}

export async function updateAdminLandingPageTemplate({
  admin,
  templateId,
  input,
  requestId,
  telemetry,
}: TemplateUpdateInput) {
  const existing = await prisma.landingPageTemplate.findUnique({
    where: { id: templateId },
    select: landingPageTemplateRecordSelect,
  });
  if (!existing) throw notFound();

  const nextDefinition = normalizeTemplateDefinition(
    getNextTemplateDefinition(existing, input)
  );
  assertPublishableWhenNeeded(nextDefinition);

  return prisma.$transaction(async (transaction) => {
    const nextStatus = nextDefinition.status;

    await transaction.landingPageTemplate.update({
      where: { id: templateId },
      data: {
        ...toTemplateCreateData(nextDefinition),
        updatedByAdminUserId: admin.id,
        ...getStatusTransitionTimestamps({
          previousStatus: existing.status as LandingPageTemplateStatus,
          nextStatus,
          previousPublishedAt: existing.publishedAt,
        }),
      },
      select: { id: true },
    });

    await transaction.landingPageTemplateAsset.deleteMany({
      where: { templateId },
    });

    if (nextDefinition.assetRequirements.length > 0) {
      await transaction.landingPageTemplateAsset.createMany({
        data: nextDefinition.assetRequirements.map((asset, index) => ({
          ...toTemplateAssetCreateData(asset, index),
          templateId,
        })),
      });
    }

    const updated = await transaction.landingPageTemplate.findUniqueOrThrow({
      where: { id: templateId },
      select: landingPageTemplateRecordSelect,
    });

    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action: getTemplateAuditAction({
          previousStatus: existing.status as LandingPageTemplateStatus,
          nextStatus,
        }),
        entityType: PLATFORM_ENTITY_TYPE.LANDING_PAGE_TEMPLATE,
        entityId: updated.id,
        requestId,
        metadata: {
          key: updated.key,
          previousStatus: existing.status,
          nextStatus,
          source: updated.source,
        },
        telemetry,
      },
      transaction
    );

    return toAdminLandingPageTemplate(updated);
  });
}

export async function findUsableTemplateByKey({
  templateKey,
  transaction,
}: {
  readonly templateKey: string | undefined;
  readonly transaction: Prisma.TransactionClient;
}) {
  if (!templateKey) return null;

  return transaction.landingPageTemplate.findFirst({
    where: {
      key: templateKey,
      status: LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED,
      archivedAt: null,
      deletedAt: null,
    },
    select: { id: true, key: true },
  });
}

export async function recordLandingPageTemplateUsage({
  transaction,
  templateId,
  workspaceId,
  landingPageId,
  actorUserId,
}: {
  readonly transaction: Prisma.TransactionClient;
  readonly templateId: string;
  readonly workspaceId: string;
  readonly landingPageId: string;
  readonly actorUserId: string;
}) {
  const usedAt = new Date();

  await Promise.all([
    transaction.landingPageTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: usedAt,
      },
      select: { id: true },
    }),
    transaction.landingPageTemplateUsage.create({
      data: {
        templateId,
        workspaceId,
        landingPageId,
        actorUserId,
        usedAt,
      },
      select: { id: true },
    }),
  ]);
}

export function toPublicLandingPageTemplate(
  template: LandingPageTemplateRecord
) {
  const definition = normalizeTemplateDefinition({
    key: template.key,
    type: template.type,
    label: template.label,
    description: template.description,
    category: template.category,
    industry: template.industry,
    status: template.status as LandingPageTemplateStatus,
    source: template.source,
    sortPriority: template.sortPriority,
    flags: getStringArray(template.flags),
    tags: getStringArray(template.tags),
    recommendedFor: template.recommendedFor,
    requiredFields: getStringArray(template.requiredFields),
    optionalFields: getStringArray(template.optionalFields),
    defaultTitle: template.defaultTitle,
    defaultContent: getJsonObject(template.defaultContent),
    assetRequirements: template.assets
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map(toPublicTemplateAssetRequirement),
    thumbnail: getJsonObject(template.thumbnail),
    mobilePreview: getJsonObject(template.mobilePreview),
    accessibilityNotes: template.accessibilityNotes,
  } as LandingPageTemplateDefinition);

  return {
    ...definition,
    source: template.source,
  };
}

function toAdminLandingPageTemplate(template: LandingPageTemplateRecord) {
  return {
    id: template.id,
    usageCount: template.usageCount,
    lastUsedAt: template.lastUsedAt,
    publishedAt: template.publishedAt,
    archivedAt: template.archivedAt,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    deletedAt: template.deletedAt,
    ...toPublicLandingPageTemplate(template),
  };
}

export type PublicLandingPageTemplate = ReturnType<
  typeof toPublicLandingPageTemplate
>;

const landingPageTemplateRecordSelect = {
  id: true,
  key: true,
  type: true,
  label: true,
  description: true,
  category: true,
  industry: true,
  status: true,
  source: true,
  sortPriority: true,
  flags: true,
  tags: true,
  recommendedFor: true,
  requiredFields: true,
  optionalFields: true,
  defaultTitle: true,
  defaultContent: true,
  thumbnail: true,
  mobilePreview: true,
  accessibilityNotes: true,
  usageCount: true,
  lastUsedAt: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  assets: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      uploadedAssetId: true,
      slot: true,
      label: true,
      kind: true,
      required: true,
      assetPath: true,
      alt: true,
      width: true,
      height: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.LandingPageTemplateSelect;

type LandingPageTemplateRecord = Prisma.LandingPageTemplateGetPayload<{
  select: typeof landingPageTemplateRecordSelect;
}>;

function getNextTemplateDefinition(
  existing: LandingPageTemplateRecord,
  input: AdminUpdateLandingPageTemplateRequest
): LandingPageTemplateDefinition {
  return {
    key: input.key ?? existing.key,
    type: input.type ?? existing.type,
    label: input.label ?? existing.label,
    description: input.description ?? existing.description,
    category: input.category ?? existing.category,
    industry: input.industry ?? existing.industry,
    status: input.status ?? (existing.status as LandingPageTemplateStatus),
    source: input.source ?? existing.source,
    sortPriority: input.sortPriority ?? existing.sortPriority,
    flags: input.flags ?? getStringArray(existing.flags),
    tags: input.tags ?? getStringArray(existing.tags),
    recommendedFor: input.recommendedFor ?? existing.recommendedFor,
    requiredFields: input.requiredFields ?? getStringArray(existing.requiredFields),
    optionalFields: input.optionalFields ?? getStringArray(existing.optionalFields),
    defaultTitle: input.defaultTitle ?? existing.defaultTitle,
    defaultContent: input.defaultContent ?? getJsonObject(existing.defaultContent),
    assetRequirements:
      input.assetRequirements ??
      existing.assets
        .sort((first, second) => first.sortOrder - second.sortOrder)
        .map(toPublicTemplateAssetRequirement),
    thumbnail: input.thumbnail ?? getJsonObject(existing.thumbnail),
    mobilePreview: input.mobilePreview ?? getJsonObject(existing.mobilePreview),
    accessibilityNotes: input.accessibilityNotes ?? existing.accessibilityNotes,
  } as LandingPageTemplateDefinition;
}

function assertPublishableWhenNeeded(
  definition: LandingPageTemplateDefinition
): void {
  if (definition.status === LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED) {
    assertTemplateCanPublish(definition);
  }
}

function normalizeTemplateDefinition(
  definition: LandingPageTemplateDefinition
): LandingPageTemplateDefinition {
  return {
    ...definition,
    assetRequirements: definition.assetRequirements.map((asset) => ({
      ...asset,
      alt:
        asset.alt?.trim() ||
        getAltTextFromAssetName(asset.assetPath) ||
        asset.label,
    })),
    thumbnail: {
      ...definition.thumbnail,
      alt:
        definition.thumbnail.alt?.trim() ||
        getAltTextFromAssetName(definition.thumbnail.assetPath) ||
        `${definition.label} template thumbnail`,
    },
    mobilePreview: {
      ...definition.mobilePreview,
      alt:
        definition.mobilePreview.alt?.trim() ||
        getAltTextFromAssetName(definition.mobilePreview.assetPath) ||
        `${definition.label} mobile preview`,
    },
  };
}

function getAltTextFromAssetName(assetPath: string | undefined): string {
  if (!assetPath) return "";

  const fileName = assetPath
    .split(/[\\/]/)
    .pop()
    ?.split("?")[0]
    ?.replace(/\.[a-z0-9]+$/i, "");

  if (!fileName) return "";

  return fileName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function toTemplateCreateData(input: LandingPageTemplateDefinition) {
  return {
    key: input.key,
    type: input.type,
    label: input.label,
    description: input.description,
    category: input.category,
    industry: input.industry,
    status: input.status,
    source: input.source,
    sortPriority: input.sortPriority,
    flags: toTemplateJson(input.flags),
    tags: toTemplateJson(input.tags),
    recommendedFor: input.recommendedFor,
    requiredFields: toTemplateJson(input.requiredFields),
    optionalFields: toTemplateJson(input.optionalFields),
    defaultTitle: input.defaultTitle,
    defaultContent: toTemplateJson(input.defaultContent),
    thumbnail: toTemplateJson(input.thumbnail),
    mobilePreview: toTemplateJson(input.mobilePreview),
    accessibilityNotes: input.accessibilityNotes,
  };
}

function toTemplateAssetCreateData(
  asset: LandingPageTemplateDefinition["assetRequirements"][number],
  index = 0
) {
  return {
    slot: asset.slot,
    uploadedAssetId: asset.uploadedAssetId,
    label: asset.label,
    kind: asset.kind,
    required: asset.required,
    assetPath: asset.assetPath,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
    sortOrder: index,
  };
}

function toPublicTemplateAssetRequirement(
  asset: LandingPageTemplateRecord["assets"][number]
) {
  return {
    slot: asset.slot,
    label: asset.label,
    kind: asset.kind,
    required: asset.required,
    ...(asset.uploadedAssetId ? { uploadedAssetId: asset.uploadedAssetId } : {}),
    ...(asset.assetPath ? { assetPath: asset.assetPath } : {}),
    ...(asset.alt ? { alt: asset.alt } : {}),
    ...(asset.width ? { width: asset.width } : {}),
    ...(asset.height ? { height: asset.height } : {}),
  };
}

function getStatusTimestamps({
  nextStatus,
}: {
  readonly nextStatus: LandingPageTemplateStatus;
}) {
  if (nextStatus === LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED) {
    return { publishedAt: new Date(), archivedAt: null };
  }
  if (nextStatus === LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED) {
    return { archivedAt: new Date(), publishedAt: null };
  }

  return { publishedAt: null, archivedAt: null };
}

function getStatusTransitionTimestamps({
  previousStatus,
  nextStatus,
  previousPublishedAt,
}: {
  readonly previousStatus: LandingPageTemplateStatus;
  readonly nextStatus: LandingPageTemplateStatus;
  readonly previousPublishedAt: Date | null;
}) {
  if (nextStatus === LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED) {
    return {
      publishedAt: previousPublishedAt ?? new Date(),
      archivedAt: null,
    };
  }
  if (
    previousStatus === LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED &&
    nextStatus === LANDING_PAGE_TEMPLATE_STATUS.DRAFT
  ) {
    return { publishedAt: null, archivedAt: null };
  }
  if (nextStatus === LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED) {
    return { archivedAt: new Date() };
  }
  if (previousStatus === LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED) {
    return { archivedAt: null };
  }

  return {};
}

function getTemplateAuditAction({
  previousStatus,
  nextStatus,
}: {
  readonly previousStatus: LandingPageTemplateStatus;
  readonly nextStatus: LandingPageTemplateStatus;
}) {
  if (
    previousStatus === LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED &&
    nextStatus !== LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED
  ) {
    return PLATFORM_AUDIT_ACTION.TEMPLATE_RESTORE;
  }
  if (
    previousStatus !== LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED &&
    nextStatus === LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED
  ) {
    return PLATFORM_AUDIT_ACTION.TEMPLATE_ARCHIVE;
  }
  if (
    previousStatus !== LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED &&
    nextStatus === LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED
  ) {
    return PLATFORM_AUDIT_ACTION.TEMPLATE_PUBLISH;
  }

  return PLATFORM_AUDIT_ACTION.TEMPLATE_UPDATE;
}

function getStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function getJsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function notFound(): AdminAccessError {
  return new AdminAccessError(
    "ADMIN_TEMPLATE_NOT_FOUND",
    "Landing page template was not found.",
    404
  );
}
