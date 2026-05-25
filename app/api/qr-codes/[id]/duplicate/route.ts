import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  QRCodeConflictError,
  QRCodeNotFoundError,
  QRCodePayloadError,
  QRCodeStateError,
} from "@/server/qr/errors";
import { toQRCodeListItem } from "@/server/qr/dto";
import { duplicateQRCode } from "@/server/qr/service";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before duplicating QR codes.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const workspaceId =
      new URL(request.url).searchParams.get("workspaceId") ?? undefined;
    const result = await duplicateQRCode({
      qrCodeId: id,
      workspaceId,
      userId: session.userId,
    });

    return apiSuccess({
      data: {
        qrCode: result.qrCode ? toQRCodeListItem(result.qrCode) : null,
      },
      requestId,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    if (error instanceof QRCodeNotFoundError) {
      return apiError({
        code: "QR_CODE_NOT_FOUND",
        message: error.message,
        requestId,
        status: 404,
      });
    }

    if (error instanceof QRCodeConflictError) {
      return apiError({
        code: "QR_CODE_SLUG_CONFLICT",
        message: error.message,
        requestId,
        status: 409,
      });
    }

    if (
      error instanceof QRCodePayloadError ||
      error instanceof QRCodeStateError
    ) {
      return apiError({
        code: "INVALID_QR_CODE_STATE",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    return apiError({
      code: "QR_CODE_DUPLICATE_FAILED",
      message: getSafeErrorMessage(error, "Could not duplicate this QR code."),
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
