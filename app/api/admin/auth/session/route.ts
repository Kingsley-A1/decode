import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    const admin = await getRequiredAdminSession();

    return apiSuccess({ data: { admin }, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_SESSION_FAILED",
      fallbackMessage: "Could not load the admin session.",
    });
  }
}
