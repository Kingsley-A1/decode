import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  LandingPageConflictError,
  LandingPageNotFoundError,
  LandingPageStateError,
} from "@/server/landing-pages/errors";
import { createLandingPage } from "@/server/landing-pages/service";
import { createLandingPageRequestSchema } from "@/server/landing-pages/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before creating landing pages.",
        requestId,
        status: 401,
      });
    }

    const body = await request.json();
    const createRequest = createLandingPageRequestSchema.parse(body);
    const landingPage = await createLandingPage({
      request: createRequest,
      userId: session.userId,
    });

    return apiSuccess({ data: { landingPage }, requestId, status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: getLandingPageErrorCode(error),
      message: getSafeErrorMessage(error, "Could not create this landing page."),
      requestId,
      status: getLandingPageErrorStatus(error),
      cause: error,
    });
  }
}

function getLandingPageErrorCode(error: unknown): string {
  if (error instanceof LandingPageConflictError) return "LANDING_PAGE_CONFLICT";
  if (error instanceof LandingPageNotFoundError) return "LANDING_PAGE_NOT_FOUND";
  if (error instanceof LandingPageStateError) return "INVALID_LANDING_PAGE_STATE";
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "LANDING_PAGE_CREATE_FAILED";
}

function getLandingPageErrorStatus(error: unknown): number {
  if (error instanceof LandingPageConflictError) return 409;
  if (error instanceof LandingPageNotFoundError) return 404;
  if (error instanceof LandingPageStateError) return 400;
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
