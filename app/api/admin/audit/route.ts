import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { listAdminAuditEvents } from "@/server/admin/queries";
import { adminAuditQuerySchema } from "@/server/admin/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    await getRequiredAdminSession();
    const query = adminAuditQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const events = await listAdminAuditEvents(query);

    return apiSuccess({
      data: {
        events,
        nextCursor:
          events.length < query.take
            ? null
            : events[events.length - 1]?.createdAt.toISOString() ?? null,
      },
      requestId,
    });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_AUDIT_FAILED",
      fallbackMessage: "Could not load admin audit events.",
    });
  }
}
