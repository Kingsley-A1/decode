import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { toShortLinkDetail } from "@/server/short-links/dto";
import { getShortLinkDetail } from "@/server/short-links/service";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before viewing a short link.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;

    const row = await getShortLinkDetail({
      id,
      ownerId: session.userId,
    });

    if (!row) {
      // Return 404 regardless of whether the row exists for a different
      // owner — never leak the existence of someone else's short link.
      return apiError({
        code: "SHORT_LINK_NOT_FOUND",
        message: "Short link not found.",
        requestId,
        status: 404,
      });
    }

    return apiSuccess({
      data: { shortLink: toShortLinkDetail(row) },
      requestId,
    });
  } catch (error) {
    return apiError({
      code: "SHORT_LINK_READ_FAILED",
      message: getSafeErrorMessage(error, "Could not load this short link."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
