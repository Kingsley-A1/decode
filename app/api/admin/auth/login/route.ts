import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { loginAdmin } from "@/server/admin/auth";
import { setAdminSessionCookie } from "@/server/admin/cookies";
import { adminLoginRequestSchema } from "@/server/admin/schemas";
import { assertAdminSameOrigin } from "@/server/admin/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const body = await request.json();
    const input = adminLoginRequestSchema.parse(body);
    const result = await loginAdmin({ request, requestId, input });
    const response = apiSuccess({ data: { admin: result.admin }, requestId });

    setAdminSessionCookie({
      response,
      token: result.token,
      expiresAt: result.expiresAt,
    });

    return response;
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_LOGIN_FAILED",
      fallbackMessage: "Could not sign in to the admin console.",
    });
  }
}
