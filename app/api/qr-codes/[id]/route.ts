import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  QRCodeNotFoundError,
  QRCodePayloadError,
  QRCodeStateError,
} from "@/server/qr/errors";
import { getWorkspaceQRCodeAnalytics } from "@/server/dashboard/queries";
import { toQRCodeDetail, toQRCodeListItem } from "@/server/qr/dto";
import { getWorkspaceQRCodeDetail } from "@/server/qr/repository";
import { updateQRCode } from "@/server/qr/service";
import { updateQRCodeRequestSchema } from "@/server/qr/schemas";
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
        message: "Sign in before viewing saved QR codes.",
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

    const qrCode = await getWorkspaceQRCodeDetail({ workspaceId, qrCodeId: id });
    if (!qrCode) {
      return apiError({
        code: "QR_CODE_NOT_FOUND",
        message: "QR code was not found in this workspace.",
        requestId,
        status: 404,
      });
    }

    const analytics = await getWorkspaceQRCodeAnalytics({
      workspaceId,
      qrCodeId: id,
    });

    return apiSuccess({
      data: { qrCode: toQRCodeDetail(qrCode), analytics },
      requestId,
    });
  } catch (error) {
    return apiError({
      code: getAccessErrorCode(error),
      message: getSafeErrorMessage(error, "Could not load this QR code."),
      requestId,
      status: getAccessErrorStatus(error),
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
        message: "Sign in before editing dynamic QR codes.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const body = await request.json();
    const updateRequest = updateQRCodeRequestSchema.parse(body);
    const result = await updateQRCode({
      qrCodeId: id,
      request: updateRequest,
      userId: session.userId,
    });

    return apiSuccess({
      data: { ...result, qrCode: toQRCodeListItem(result.qrCode) },
      requestId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    if (error instanceof QRCodePayloadError) {
      return apiError({
        code: "INVALID_DESTINATION_URL",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    if (error instanceof QRCodeNotFoundError) {
      return apiError({
        code: "QR_CODE_NOT_FOUND",
        message: error.message,
        requestId,
        status: 404,
      });
    }

    if (error instanceof QRCodeStateError) {
      return apiError({
        code: "INVALID_QR_CODE_STATE",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    return apiError({
      code: "QR_CODE_UPDATE_FAILED",
      message: getSafeErrorMessage(error, "Could not update this QR code."),
      requestId,
      status: getErrorStatus(error),
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
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

function getAccessErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "QR_CODE_LOAD_FAILED";
}

function getAccessErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}
