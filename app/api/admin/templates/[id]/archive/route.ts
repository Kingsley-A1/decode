import { apiSuccess, createRequestId } from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { getAdminRequestTelemetry } from "@/server/admin/telemetry";
import { updateAdminLandingPageTemplate } from "@/server/landing-page-templates/service";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const admin = await getRequiredAdminSession();
    const { id } = await context.params;
    const template = await updateAdminLandingPageTemplate({
      admin,
      templateId: id,
      input: { status: "archived" },
      requestId,
      telemetry: getAdminRequestTelemetry(request),
    });

    return apiSuccess({ data: { template }, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_TEMPLATE_ARCHIVE_FAILED",
      fallbackMessage: "Could not archive this template.",
    });
  }
}
