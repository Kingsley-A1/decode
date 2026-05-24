import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { getWorkspaceQRCodeAnalytics } from "@/server/dashboard/queries";
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
        message: "Sign in before viewing QR analytics.",
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

    const summary = await getWorkspaceQRCodeAnalytics({
      workspaceId,
      qrCodeId: id,
    });

    if (!summary) {
      return apiError({
        code: "QR_CODE_NOT_FOUND",
        message: "QR code was not found in this workspace.",
        requestId,
        status: 404,
      });
    }

    return apiSuccess({
      data: { workspaceId, summary },
      requestId,
    });
  } catch (error) {
    return apiError({
      code: getAccessErrorCode(error),
      message: getSafeErrorMessage(error, "Could not load QR analytics."),
      requestId,
      status: getAccessErrorStatus(error),
      cause: error,
    });
  }
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

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getAccessErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "QR_CODE_ANALYTICS_FAILED";
}

function getAccessErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}
