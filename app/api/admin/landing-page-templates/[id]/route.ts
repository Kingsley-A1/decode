import { apiSuccess, createRequestId } from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { getAdminRequestTelemetry } from "@/server/admin/telemetry";
import { adminUpdateLandingPageTemplateRequestSchema } from "@/server/landing-page-templates/schemas";
import {
  getAdminLandingPageTemplate,
  updateAdminLandingPageTemplate,
} from "@/server/landing-page-templates/service";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    await getRequiredAdminSession();

    const { id } = await context.params;
    const template = await getAdminLandingPageTemplate(id);

    return apiSuccess({ data: { template }, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_TEMPLATE_LOAD_FAILED",
      fallbackMessage: "Could not load this landing page template.",
    });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const admin = await getRequiredAdminSession();
    const { id } = await context.params;
    const body = await request.json();
    const input = adminUpdateLandingPageTemplateRequestSchema.parse(body);
    const template = await updateAdminLandingPageTemplate({
      admin,
      templateId: id,
      input,
      requestId,
      telemetry: getAdminRequestTelemetry(request),
    });

    return apiSuccess({ data: { template }, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_TEMPLATE_UPDATE_FAILED",
      fallbackMessage: "Could not update this landing page template.",
    });
  }
}
