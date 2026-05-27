import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { getWorkspaceAccess } from "@/server/workspaces/repository";
import { toShortLinkSummary } from "@/server/short-links/dto";
import { ShortLinkError, getShortLinkErrorStatus } from "@/server/short-links/errors";
import { createShortLinkRequestSchema } from "@/server/short-links/schemas";
import {
  SHORT_LINK_LIST_DEFAULT_TAKE,
  SHORT_LINK_LIST_MAX_TAKE,
  createShortLink,
  listShortLinks,
} from "@/server/short-links/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  const limited = enforceRateLimit({
    request,
    scope: "short-link-create",
    options: { limit: 20, windowMs: 60_000 },
    requestId,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = createShortLinkRequestSchema.parse(body);
    const session = await getRequiredUserSession();

    if (parsed.workspaceId && !session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before attaching a short link to a workspace.",
        requestId,
        status: 401,
      });
    }

    if (parsed.workspaceId && session) {
      const access = await getWorkspaceAccess({
        userId: session.userId,
        workspaceId: parsed.workspaceId,
      });
      if (!access) {
        return apiError({
          code: "WORKSPACE_ACCESS_DENIED",
          message: "You do not have access to that workspace.",
          requestId,
          status: 403,
        });
      }
    }

    const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return apiError({
        code: "SHORT_LINK_EXPIRY_IN_PAST",
        message: "Expiry must be in the future.",
        requestId,
        status: 422,
      });
    }

    const result = await createShortLink({
      url: parsed.url,
      ownerId: session?.userId ?? null,
      workspaceId: parsed.workspaceId ?? null,
      acknowledgedSuspicious: parsed.acknowledgedSuspicious,
      expiresAt,
    });

    return apiSuccess({
      data: {
        shortLink: toShortLinkSummary(result.row),
        shortUrl: result.shortUrl,
        verifier: {
          verdict: result.verdict,
          confidence: result.confidence,
          signalCount: result.evidenceSummary.signalCount,
          sourceCount: result.evidenceSummary.sourceCount,
          topConcerns: result.evidenceSummary.topConcerns,
        },
      },
      requestId,
      status: 201,
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
      code: "SHORT_LINK_CREATE_FAILED",
      message: getSafeErrorMessage(error, "Could not create this short link."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before listing short links.",
        requestId,
        status: 401,
      });
    }

    const searchParams = new URL(request.url).searchParams;
    const workspaceId = searchParams.get("workspaceId") ?? undefined;
    const take = parseTake(searchParams.get("take"));
    const cursorId = searchParams.get("cursor") ?? undefined;

    if (workspaceId) {
      const access = await getWorkspaceAccess({
        userId: session.userId,
        workspaceId,
      });
      if (!access) {
        return apiError({
          code: "WORKSPACE_ACCESS_DENIED",
          message: "You do not have access to that workspace.",
          requestId,
          status: 403,
        });
      }
    }

    const { shortLinks, nextCursor } = await listShortLinks({
      ownerId: session.userId,
      workspaceId,
      take,
      cursorId,
    });

    return apiSuccess({
      data: {
        shortLinks: shortLinks.map((row) => toShortLinkSummary(row)),
        nextCursor,
      },
      requestId,
    });
  } catch (error) {
    return apiError({
      code: "SHORT_LINK_LIST_FAILED",
      message: getSafeErrorMessage(error, "Could not load short links."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function parseTake(value: string | null): number {
  if (!value) return SHORT_LINK_LIST_DEFAULT_TAKE;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return SHORT_LINK_LIST_DEFAULT_TAKE;

  return Math.min(Math.max(parsed, 1), SHORT_LINK_LIST_MAX_TAKE);
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
