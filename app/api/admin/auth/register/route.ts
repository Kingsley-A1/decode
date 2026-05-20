import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { setAdminSessionCookie } from "@/server/admin/cookies";
import { registerAdmin } from "@/server/admin/auth";
import { adminRegisterRequestSchema } from "@/server/admin/schemas";
import { assertAdminSameOrigin } from "@/server/admin/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const body = await request.json();
    const input = adminRegisterRequestSchema.parse(body);
    const result = await registerAdmin({ request, requestId, input });
    const response = apiSuccess({
      data: { admin: result.admin },
      requestId,
      status: 201,
    });

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
      fallbackCode: "ADMIN_REGISTER_FAILED",
      fallbackMessage: "Could not register this admin account.",
    });
  }
}
