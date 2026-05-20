import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { reviewWorkspaceStatus } from "@/server/admin/operations";
import { workspaceReviewRequestSchema } from "@/server/admin/schemas";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { getAdminRequestTelemetry } from "@/server/admin/telemetry";

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
    const body = await request.json();
    const input = workspaceReviewRequestSchema.parse(body);
    const workspace = await reviewWorkspaceStatus({
      admin,
      workspaceId: id,
      input,
      requestId,
      telemetry: getAdminRequestTelemetry(request),
    });

    return apiSuccess({ data: { workspace }, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_WORKSPACE_REVIEW_FAILED",
      fallbackMessage: "Could not record this workspace review.",
    });
  }
}
