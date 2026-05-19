import { ZodError } from "zod";
import { getRequiredUserSession } from "@/server/auth/session";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  AssetNotFoundError,
  AssetStateError,
  AssetValidationError,
} from "@/server/assets/errors";
import { confirmAssetUpload } from "@/server/assets/service";
import { confirmAssetUploadRequestSchema } from "@/server/assets/schemas";

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
        message: "Sign in before confirming uploads.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const body = await request.json();
    const confirmRequest = confirmAssetUploadRequestSchema.parse(body);
    const asset = await confirmAssetUpload({
      assetId: id,
      request: confirmRequest,
      userId: session.userId,
    });

    return apiSuccess({ data: { asset }, requestId });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: getAssetErrorCode(error),
      message: getSafeErrorMessage(error, "Could not confirm this upload."),
      requestId,
      status: getAssetErrorStatus(error),
      cause: error,
    });
  }
}

function getAssetErrorCode(error: unknown): string {
  if (error instanceof AssetNotFoundError) return "ASSET_NOT_FOUND";
  if (error instanceof AssetStateError) return "INVALID_ASSET_STATE";
  if (error instanceof AssetValidationError) return "INVALID_ASSET_UPLOAD";
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }
  if (error instanceof Error && error.message.includes("Missing required R2")) {
    return "R2_NOT_CONFIGURED";
  }

  return "ASSET_CONFIRM_FAILED";
}

function getAssetErrorStatus(error: unknown): number {
  if (error instanceof AssetNotFoundError) return 404;
  if (error instanceof AssetStateError || error instanceof AssetValidationError) {
    return 400;
  }
  if (error instanceof Error && error.message.includes("access")) return 403;
  if (error instanceof Error && error.message.includes("Missing required R2")) {
    return 503;
  }

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
