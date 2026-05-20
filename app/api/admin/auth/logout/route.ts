import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { logoutAdmin } from "@/server/admin/auth";
import { clearAdminSessionCookie } from "@/server/admin/cookies";
import { assertAdminSameOrigin } from "@/server/admin/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);
    await logoutAdmin({ request, requestId });

    const response = apiSuccess({ data: { ok: true }, requestId });
    clearAdminSessionCookie(response);

    return response;
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_LOGOUT_FAILED",
      fallbackMessage: "Could not sign out of the admin console.",
    });
  }
}
