import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { getAdminOverview } from "@/server/admin/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    await getRequiredAdminSession();
    const overview = await getAdminOverview();

    return apiSuccess({ data: overview, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_OVERVIEW_FAILED",
      fallbackMessage: "Could not load admin overview.",
    });
  }
}
