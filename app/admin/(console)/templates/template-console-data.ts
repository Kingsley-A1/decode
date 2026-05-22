import "server-only";

import type {
  AdminTemplateConsoleDetail,
  AdminTemplateConsoleRow,
} from "@/components/admin/AdminTemplateConsole";
import { listAdminLandingPageTemplates } from "@/server/admin/queries";
import {
  adminListQuerySchema,
  type AdminListQuery,
} from "@/server/admin/schemas";
import { getAdminLandingPageTemplate } from "@/server/landing-page-templates/service";

export async function loadTemplateConsoleData(
  searchParams?: Record<string, string | string[] | undefined>
) {
  const query = parseListQuery(searchParams);
  try {
    const page = await listAdminLandingPageTemplates(query);

    return {
      query,
      total: page.total,
      nextCursor: page.nextCursor,
      backendUnavailable: false,
      rows: page.records.map((row): AdminTemplateConsoleRow => ({
        id: row.id,
        key: row.key,
        label: row.label,
        category: row.category,
        industry: row.industry,
        type: row.type,
        status: row.status,
        source: row.source,
        usageCount: row.usageCount,
        assetCount: row._count.assets,
        landingPageCount: row._count.landingPages,
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.warn("[admin-templates] template database unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      query,
      total: 0,
      nextCursor: null,
      backendUnavailable: true,
      rows: [] satisfies AdminTemplateConsoleRow[],
    };
  }
}

export async function loadTemplateConsoleTemplate(templateId: string) {
  return serializeTemplate(await getAdminLandingPageTemplate(templateId));
}

function parseListQuery(
  searchParams?: Record<string, string | string[] | undefined>
): AdminListQuery {
  const q = typeof searchParams?.q === "string" ? searchParams.q : undefined;
  const status =
    typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const cursor =
    typeof searchParams?.cursor === "string" ? searchParams.cursor : undefined;

  return adminListQuerySchema.parse({ q, status, cursor });
}

function serializeTemplate(
  template: Awaited<ReturnType<typeof getAdminLandingPageTemplate>>
): AdminTemplateConsoleDetail {
  return {
    id: template.id,
    key: template.key,
    type: template.type as AdminTemplateConsoleDetail["type"],
    label: template.label,
    description: template.description,
    category: template.category as AdminTemplateConsoleDetail["category"],
    industry: template.industry,
    status: template.status as AdminTemplateConsoleDetail["status"],
    source: template.source as AdminTemplateConsoleDetail["source"],
    sortPriority: template.sortPriority,
    flags: template.flags,
    tags: template.tags,
    recommendedFor: template.recommendedFor,
    requiredFields: template.requiredFields,
    optionalFields: template.optionalFields,
    defaultTitle: template.defaultTitle,
    defaultContent: template.defaultContent as Record<string, unknown>,
    assetRequirements:
      template.assetRequirements as AdminTemplateConsoleDetail["assetRequirements"],
    thumbnail:
      template.thumbnail as AdminTemplateConsoleDetail["thumbnail"],
    mobilePreview:
      template.mobilePreview as AdminTemplateConsoleDetail["mobilePreview"],
    accessibilityNotes: template.accessibilityNotes,
    usageCount: template.usageCount,
    lastUsedAt: template.lastUsedAt?.toISOString() ?? null,
    publishedAt: template.publishedAt?.toISOString() ?? null,
    archivedAt: template.archivedAt?.toISOString() ?? null,
    updatedAt: template.updatedAt.toISOString(),
  };
}
