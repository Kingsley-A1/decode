import { apiSuccess, createRequestId } from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { listAdminLandingPageTemplates } from "@/server/admin/queries";
import {
  adminCreateLandingPageTemplateRequestSchema,
} from "@/server/landing-page-templates/schemas";
import { createAdminLandingPageTemplate } from "@/server/landing-page-templates/service";
import { adminListQuerySchema } from "@/server/admin/schemas";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { getAdminRequestTelemetry } from "@/server/admin/telemetry";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    await getRequiredAdminSession();

    const query = adminListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const page = await listAdminLandingPageTemplates(query);

    return apiSuccess({ data: page, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_TEMPLATE_LIST_FAILED",
      fallbackMessage: "Could not load landing page templates.",
    });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const admin = await getRequiredAdminSession();
    const body = await request.json();
    const input = adminCreateLandingPageTemplateRequestSchema.parse(body);
    const template = await createAdminLandingPageTemplate({
      admin,
      input,
      requestId,
      telemetry: getAdminRequestTelemetry(request),
    });

    return apiSuccess({ data: { template }, requestId, status: 201 });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_TEMPLATE_CREATE_FAILED",
      fallbackMessage: "Could not create this landing page template.",
    });
  }
}
