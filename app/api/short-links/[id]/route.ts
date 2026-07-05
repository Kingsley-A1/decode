import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import { toShortLinkDetail, toShortLinkSummary } from "@/server/short-links/dto";
import {
  ShortLinkError,
  getShortLinkErrorStatus,
} from "@/server/short-links/errors";
import { updateShortLinkRequestSchema } from "@/server/short-links/schemas";
import {
  deleteShortLink,
  getShortLinkDetail,
  updateShortLink,
} from "@/server/short-links/service";

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

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before updating a short link.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const parsed = updateShortLinkRequestSchema.parse(await request.json());

    const expiresAt =
      parsed.expiresAt === undefined
        ? undefined
        : parsed.expiresAt === null
          ? null
          : new Date(parsed.expiresAt);
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return apiError({
        code: "SHORT_LINK_EXPIRY_IN_PAST",
        message: "Expiry must be in the future.",
        requestId,
        status: 422,
      });
    }

    const row = await updateShortLink({
      id,
      ownerId: session.userId,
      destinationUrl: parsed.destinationUrl,
      status: parsed.status,
      expiresAt,
      acknowledgedSuspicious: parsed.acknowledgedSuspicious,
    });

    return apiSuccess({
      data: { shortLink: toShortLinkSummary(row) },
      requestId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    if (error instanceof ShortLinkError) {
      return apiError({
        code: error.code,
        message: error.message,
        requestId,
        status: getShortLinkErrorStatus(error.code),
        fields: error.summary
          ? {
              evidenceSummary: [
                `${error.summary.verdict} · ${error.summary.confidence}%`,
                ...error.summary.topConcerns,
              ],
            }
          : undefined,
      });
    }

    return apiError({
      code: "SHORT_LINK_UPDATE_FAILED",
      message: getSafeErrorMessage(error, "Could not update this short link."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before deleting a short link.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    await deleteShortLink({ id, ownerId: session.userId });

    return apiSuccess({ data: { deleted: true }, requestId });
  } catch (error) {
    if (error instanceof ShortLinkError) {
      return apiError({
        code: error.code,
        message: error.message,
        requestId,
        status: getShortLinkErrorStatus(error.code),
      });
    }

    return apiError({
      code: "SHORT_LINK_DELETE_FAILED",
      message: getSafeErrorMessage(error, "Could not delete this short link."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
