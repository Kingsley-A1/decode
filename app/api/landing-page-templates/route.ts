import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { defaultLandingPageTemplatePresets } from "@/components/landing-pages/landing-page-data";
import { listPublicLandingPageTemplates } from "@/server/landing-page-templates/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  if (shouldUseStaticFallbackBeforePrisma()) {
    console.warn(
      "[landing-page-templates] database URL is unavailable or unsupported; using static fallback",
      { requestId, environment: process.env.NODE_ENV }
    );

    return buildStaticTemplateFallbackResponse({ requestId });
  }

  try {
    const templates = await listPublicLandingPageTemplates();
    const hasFirstPartyTemplates = templates.some(
      (template) => template.source === "first_party"
    );
    const catalog =
      templates.length === 0
        ? defaultLandingPageTemplatePresets
        : hasFirstPartyTemplates
          ? templates
          : mergeTemplateCatalogs({
              staticTemplates: defaultLandingPageTemplatePresets,
              databaseTemplates: templates,
            });
    const source =
      templates.length === 0
        ? "static-fallback"
        : hasFirstPartyTemplates
          ? "database"
          : "database-with-static-fallback";

    if (source !== "database") {
      console.warn("[landing-page-templates] using static fallback catalog", {
        requestId,
        source,
        databaseTemplateCount: templates.length,
      });
    }

    return apiSuccess({
      data: {
        templates: catalog,
        source,
        backendReady: templates.length > 0,
        fallbackActive: source !== "database",
      },
      requestId,
    });
  } catch (error) {
    console.warn("[landing-page-templates] database unavailable; using static fallback", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return buildStaticTemplateFallbackResponse({ requestId });
  }
}

function shouldUseStaticFallbackBeforePrisma() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return true;

  return !databaseUrl.startsWith("prisma://") &&
    !databaseUrl.startsWith("prisma+postgres://");
}

function buildStaticTemplateFallbackResponse({
  requestId,
}: {
  readonly requestId: string;
}) {
  return apiSuccess({
    data: {
      templates: defaultLandingPageTemplatePresets,
      source: "static-fallback",
      backendReady: false,
      fallbackActive: true,
    },
    requestId,
  });
}

function mergeTemplateCatalogs({
  staticTemplates,
  databaseTemplates,
}: {
  readonly staticTemplates: typeof defaultLandingPageTemplatePresets;
  readonly databaseTemplates: Awaited<
    ReturnType<typeof listPublicLandingPageTemplates>
  >;
}) {
  const byKey = new Map<
    string,
    (typeof staticTemplates)[number] | (typeof databaseTemplates)[number]
  >();

  for (const template of staticTemplates) byKey.set(template.key, template);
  for (const template of databaseTemplates) byKey.set(template.key, template);

  return Array.from(byKey.values()).sort(
    (first, second) => first.sortPriority - second.sortPriority
  );
}
