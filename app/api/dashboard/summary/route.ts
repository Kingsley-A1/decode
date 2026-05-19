import { z, ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  getWorkspaceDashboardSummary,
  listRecentWorkspaceScans,
} from "@/server/dashboard/queries";
import {
  getDefaultWorkspaceForUser,
  getWorkspaceAccess,
} from "@/server/workspaces/repository";

export const runtime = "nodejs";

const dashboardSummaryQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  recentScanCursor: z.string().trim().min(1).optional(),
  recentScanTake: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before viewing dashboard analytics.",
        requestId,
        status: 401,
      });
    }

    const query = dashboardSummaryQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const workspaceId = await resolveDashboardWorkspaceId({
      userId: session.userId,
      workspaceId: query.workspaceId,
    });

    if (!workspaceId) {
      return apiError({
        code: "WORKSPACE_NOT_FOUND",
        message: "No dashboard workspace was found for this user.",
        requestId,
        status: 404,
      });
    }

    const [summary, recentScansPage] = await Promise.all([
      getWorkspaceDashboardSummary({ workspaceId }),
      listRecentWorkspaceScans({
        workspaceId,
        take: query.recentScanTake,
        cursorId: query.recentScanCursor,
      }),
    ]);

    return apiSuccess({
      data: {
        workspaceId,
        summary,
        recentScansPage,
        nextRecentScanCursor: getNextCursor(
          recentScansPage,
          query.recentScanTake
        ),
      },
      requestId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: getErrorCode(error),
      message: getSafeErrorMessage(error, "Could not load dashboard analytics."),
      requestId,
      status: getErrorStatus(error),
      cause: error,
    });
  }
}

async function resolveDashboardWorkspaceId({
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

function getNextCursor<TRecord extends { readonly id: string }>(
  records: readonly TRecord[],
  take: number
): string | null {
  if (records.length < take) return null;

  return records[records.length - 1]?.id ?? null;
}

function getErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "DASHBOARD_ANALYTICS_FAILED";
}

function getErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
