import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  LandingPageNotFoundError,
  LandingPageStateError,
} from "@/server/landing-pages/errors";
import { getWorkspaceLandingPage } from "@/server/landing-pages/repository";
import { updateLandingPage } from "@/server/landing-pages/service";
import { updateLandingPageRequestSchema } from "@/server/landing-pages/schemas";
import {
  getDefaultWorkspaceForUser,
  getWorkspaceAccess,
} from "@/server/workspaces/repository";

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
        message: "Sign in before viewing landing pages.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const workspaceId = await resolveReadableWorkspaceId({
      userId: session.userId,
      workspaceId:
        new URL(request.url).searchParams.get("workspaceId") ?? undefined,
    });

    if (!workspaceId) {
      return apiError({
        code: "WORKSPACE_NOT_FOUND",
        message: "No workspace was found for this user.",
        requestId,
        status: 404,
      });
    }

    const landingPage = await getWorkspaceLandingPage({
      workspaceId,
      landingPageId: id,
    });

    if (!landingPage) {
      return apiError({
        code: "LANDING_PAGE_NOT_FOUND",
        message: "Landing page was not found in this workspace.",
        requestId,
        status: 404,
      });
    }

    return apiSuccess({ data: { landingPage }, requestId });
  } catch (error) {
    return apiError({
      code: getLandingPageErrorCode(error),
      message: getSafeErrorMessage(error, "Could not load this landing page."),
      requestId,
      status: getLandingPageErrorStatus(error),
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
        message: "Sign in before editing landing pages.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const body = await request.json();
    const updateRequest = updateLandingPageRequestSchema.parse(body);
    const landingPage = await updateLandingPage({
      landingPageId: id,
      request: updateRequest,
      userId: session.userId,
    });

    return apiSuccess({ data: { landingPage }, requestId });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: getLandingPageErrorCode(error),
      message: getSafeErrorMessage(error, "Could not update this landing page."),
      requestId,
      status: getLandingPageErrorStatus(error),
      cause: error,
    });
  }
}

function getLandingPageErrorCode(error: unknown): string {
  if (error instanceof LandingPageNotFoundError) return "LANDING_PAGE_NOT_FOUND";
  if (error instanceof LandingPageStateError) return "INVALID_LANDING_PAGE_STATE";
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "LANDING_PAGE_UPDATE_FAILED";
}

function getLandingPageErrorStatus(error: unknown): number {
  if (error instanceof LandingPageNotFoundError) return 404;
  if (error instanceof LandingPageStateError) return 400;
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function resolveReadableWorkspaceId({
  userId,
  workspaceId,
}: {
  readonly userId: string;
  readonly workspaceId?: string;
}): Promise<string | null> {
  if (workspaceId) {
    const access = await getWorkspaceAccess({ userId, workspaceId });
    if (!access) throw new Error("You do not have access to this workspace.");

    return workspaceId;
  }

  const defaultWorkspace = await getDefaultWorkspaceForUser({ userId });

  return defaultWorkspace?.id ?? null;
}
