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
  AssetValidationError,
} from "@/server/assets/errors";
import { createPresignedAssetUpload } from "@/server/assets/service";
import { createPresignedUploadRequestSchema } from "@/server/assets/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before uploading assets.",
        requestId,
        status: 401,
      });
    }

    const body = await request.json();
    const uploadRequest = createPresignedUploadRequestSchema.parse(body);
    const result = await createPresignedAssetUpload({
      request: uploadRequest,
      userId: session.userId,
    });

    return apiSuccess({ data: result, requestId, status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: getAssetErrorCode(error),
      message: getSafeErrorMessage(error, "Could not create an upload URL."),
      requestId,
      status: getAssetErrorStatus(error),
      cause: error,
    });
  }
}

function getAssetErrorCode(error: unknown): string {
  if (error instanceof AssetValidationError) return "INVALID_ASSET_UPLOAD";
  if (error instanceof AssetNotFoundError) return "ASSET_PARENT_NOT_FOUND";
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }
  if (error instanceof Error && error.message.includes("Missing required R2")) {
    return "R2_NOT_CONFIGURED";
  }

  return "ASSET_PRESIGN_FAILED";
}

function getAssetErrorStatus(error: unknown): number {
  if (error instanceof AssetValidationError) return 400;
  if (error instanceof AssetNotFoundError) return 404;
  if (error instanceof Error && error.message.includes("access")) return 403;
  if (error instanceof Error && error.message.includes("Missing required R2")) {
    return 503;
  }

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
