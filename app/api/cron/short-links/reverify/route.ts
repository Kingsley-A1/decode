import {
  apiError,
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { reverifyStaleShortLinks } from "@/server/short-links/reverify";

export const runtime = "nodejs";

/**
 * Daily re-verification of the stalest active short links (see vercel.json
 * crons). Vercel attaches `Authorization: Bearer ${CRON_SECRET}` when the
 * env var is configured; without a configured secret the endpoint refuses
 * every request.
 */
export async function GET(request: Request) {
  const requestId = createRequestId(request);
  const secret = process.env.CRON_SECRET;
  const authorized =
    Boolean(secret) &&
    request.headers.get("authorization") === `Bearer ${secret}`;

  if (!authorized) {
    return apiError({
      code: "CRON_UNAUTHORIZED",
      message: "This endpoint is reserved for the scheduled job.",
      requestId,
      status: 401,
    });
  }

  try {
    const summary = await reverifyStaleShortLinks();

    return apiSuccess({ data: summary, requestId });
  } catch (error) {
    return apiError({
      code: "SHORT_LINK_REVERIFY_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Could not re-verify short links.",
      requestId,
      status: 500,
      cause: error,
    });
  }
}
