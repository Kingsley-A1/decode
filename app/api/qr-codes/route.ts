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
  QRCodePayloadError,
  QRCodeStateError,
} from "@/server/qr/errors";
import { toQRCodeListItem } from "@/server/qr/dto";
import { createQRCode } from "@/server/qr/service";
import { listWorkspaceQRCodes } from "@/server/qr/repository";
import { createQRCodeRequestSchema } from "@/server/qr/schemas";
import {
  getDefaultWorkspaceForUser,
  getWorkspaceAccess,
} from "@/server/workspaces/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

    const searchParams = new URL(request.url).searchParams;
    const workspaceId = await resolveReadableWorkspaceId({
      userId: session.userId,
      workspaceId: searchParams.get("workspaceId") ?? undefined,
    });
    const take = getBoundedTake(searchParams.get("take"));
    const cursorId = searchParams.get("cursor") ?? undefined;

    if (!workspaceId) {
      return apiSuccess({
        data: { qrCodes: [], nextCursor: null, workspaceId: null },
        requestId,
      });
    }

    const qrCodes = await listWorkspaceQRCodes({
      workspaceId,
      take,
      cursorId,
    });

    return apiSuccess({
      data: {
        workspaceId,
        qrCodes: qrCodes.map(toQRCodeListItem),
        nextCursor:
          qrCodes.length < take ? null : (qrCodes[qrCodes.length - 1]?.id ?? null),
      },
      requestId,
    });
  } catch (error) {
    return apiError({
      code: getAccessErrorCode(error),
      message: getSafeErrorMessage(error, "Could not load saved QR codes."),
      requestId,
      status: getAccessErrorStatus(error),
      cause: error,
    });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const body = await request.json();
    const createRequest = createQRCodeRequestSchema.parse(body);
    const session = createRequest.save
      ? await getRequiredUserSession()
      : null;

    if (createRequest.save && !session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before saving QR codes.",
        requestId,
        status: 401,
      });
    }

    const result = await createQRCode({
      request: createRequest,
      userId: session?.userId,
    });

    return apiSuccess({
      data: {
        qrCode: result.qrCode ? toQRCodeListItem(result.qrCode) : null,
        payload: {
          type: result.payload.type,
          value: result.payload.value,
          destinationUrl: result.payload.destinationUrl,
        },
        design: result.design,
        warnings: result.warnings,
      },
      requestId,
      status: result.qrCode ? 201 : 200,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    if (error instanceof QRCodePayloadError) {
      return apiError({
        code: "INVALID_QR_PAYLOAD",
        message: error.message,
        requestId,
        status: 400,
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

    if (error instanceof QRCodeStateError) {
      return apiError({
        code: "INVALID_QR_CODE_STATE",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    return apiError({
      code: "QR_CODE_CREATE_FAILED",
      message: getSafeErrorMessage(error, "Could not create this QR code."),
      requestId,
      status: 500,
      cause: error,
    });
  }
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

function getBoundedTake(value: string | null): number {
  if (!value) return 25;

  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) return 25;

  return Math.min(Math.max(parsedValue, 1), 100);
}

function getAccessErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }

  return "QR_CODE_LIST_FAILED";
}

function getAccessErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message.includes("access")) return 403;

  return 500;
}
