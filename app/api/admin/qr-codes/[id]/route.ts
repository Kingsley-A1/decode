import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { updateQRCodeVisibility } from "@/server/admin/operations";
import { adminQRCodeVisibilityRequestSchema } from "@/server/admin/schemas";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { getAdminRequestTelemetry } from "@/server/admin/telemetry";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const admin = await getRequiredAdminSession();
    const { id } = await context.params;
    const body = await request.json();
    const input = adminQRCodeVisibilityRequestSchema.parse(body);
    const qrCode = await updateQRCodeVisibility({
      admin,
      qrCodeId: id,
      input,
      requestId,
      telemetry: getAdminRequestTelemetry(request),
    });

    return apiSuccess({ data: { qrCode }, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_QR_CODE_UPDATE_FAILED",
      fallbackMessage: "Could not update this QR code.",
    });
  }
}
