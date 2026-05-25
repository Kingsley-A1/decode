import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import { renderSavedQRCode } from "@/server/qr/service";
import { renderQRCodeRequestSchema } from "@/server/qr/schemas";
import { enforceRateLimit } from "@/server/security/rate-limit";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  const limited = enforceRateLimit({
    request,
    scope: "qr-render",
    options: { limit: 60, windowMs: 60_000 },
    requestId,
  });
  if (limited) return limited;

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before rendering saved QR codes.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const body = await request.json();
    const renderRequest = renderQRCodeRequestSchema.parse(body);
    const result = await renderSavedQRCode({
      qrCodeId: id,
      request: renderRequest,
      userId: session.userId,
    });

    return apiSuccess({
      data: result,
      requestId,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: getErrorCode(error),
      message: getSafeErrorMessage(error, "Could not render this QR code."),
      requestId,
      status: getErrorStatus(error),
      cause: error,
    });
  }
}

function getErrorCode(error: unknown): string {
  if (isMissingR2EnvironmentError(error)) return "R2_NOT_CONFIGURED";
  if (isNotFoundError(error)) return "QR_CODE_NOT_FOUND";
  if (isWorkspaceAccessError(error)) return "WORKSPACE_ACCESS_DENIED";

  return "QR_CODE_RENDER_FAILED";
}

function getErrorStatus(error: unknown): number {
  if (isMissingR2EnvironmentError(error)) return 503;
  if (isNotFoundError(error)) return 404;
  if (isWorkspaceAccessError(error)) return 403;

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isMissingR2EnvironmentError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Missing required R2");
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("not found");
}

function isWorkspaceAccessError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("access");
}
