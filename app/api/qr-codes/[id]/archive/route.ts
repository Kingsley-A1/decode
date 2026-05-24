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
  QRCodeStateError,
} from "@/server/qr/errors";
import { toQRCodeListItem } from "@/server/qr/dto";
import { archiveQRCode } from "@/server/qr/service";
import { archiveQRCodeRequestSchema } from "@/server/qr/schemas";

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
        message: "Sign in before archiving QR codes.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const archiveRequest = archiveQRCodeRequestSchema.parse(body);
    const qrCode = await archiveQRCode({
      qrCodeId: id,
      request: archiveRequest,
      userId: session.userId,
    });

    return apiSuccess({
      data: { qrCode: toQRCodeListItem(qrCode) },
      requestId,
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

    if (error instanceof QRCodeStateError) {
      return apiError({
        code: "INVALID_QR_CODE_STATE",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    return apiError({
      code: getErrorCode(error),
      message: getSafeErrorMessage(error, "Could not archive this QR code."),
      requestId,
      status: getErrorStatus(error),
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "QR_CODE_ARCHIVE_FAILED";
}

function getErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}
