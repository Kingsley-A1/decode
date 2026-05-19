import {
  apiError,
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import {
  AssetNotFoundError,
  AssetStateError,
} from "@/server/assets/errors";
import { getPublicLandingPageAsset } from "@/server/assets/repository";
import { getR2Object } from "@/server/assets/r2";
import { deleteAsset } from "@/server/assets/service";
import { getRequiredUserSession } from "@/server/auth/session";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);
  const { id } = await context.params;

  try {
    const asset = await getPublicLandingPageAsset(id);
    if (!asset) {
      return apiError({
        code: "ASSET_NOT_FOUND",
        message: "Asset was not found.",
        requestId,
        status: 404,
      });
    }

    const object = await getR2Object(asset.key);
    const body = new ArrayBuffer(object.body.byteLength);
    new Uint8Array(body).set(object.body);

    return new Response(body, {
      headers: {
        "Content-Type": object.contentType ?? asset.contentType,
        "Content-Length": String(object.contentLength ?? asset.fileSizeBytes),
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError({
      code: getAssetErrorCode(error),
      message: getSafeErrorMessage(error, "Could not load this asset."),
      requestId,
      status: getAssetErrorStatus(error),
      cause: error,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    const session = await getRequiredUserSession();
    if (!session) {
      return apiError({
        code: "UNAUTHENTICATED",
        message: "Sign in before deleting assets.",
        requestId,
        status: 401,
      });
    }

    const { id } = await context.params;
    const workspaceId =
      new URL(request.url).searchParams.get("workspaceId") ?? undefined;
    const asset = await deleteAsset({
      assetId: id,
      workspaceId,
      userId: session.userId,
    });

    return apiSuccess({ data: { asset }, requestId });
  } catch (error) {
    return apiError({
      code: getAssetErrorCode(error),
      message: getSafeErrorMessage(error, "Could not delete this asset."),
      requestId,
      status: getAssetErrorStatus(error),
      cause: error,
    });
  }
}

function getAssetErrorCode(error: unknown): string {
  if (error instanceof AssetNotFoundError) return "ASSET_NOT_FOUND";
  if (error instanceof AssetStateError) return "INVALID_ASSET_STATE";
  if (error instanceof Error && error.message.includes("access")) {
    return "WORKSPACE_ACCESS_DENIED";
  }
  if (error instanceof Error && error.message.includes("Missing required R2")) {
    return "R2_NOT_CONFIGURED";
  }

  return "ASSET_REQUEST_FAILED";
}

function getAssetErrorStatus(error: unknown): number {
  if (error instanceof AssetNotFoundError) return 404;
  if (error instanceof AssetStateError) return 400;
  if (error instanceof Error && error.message.includes("access")) return 403;
  if (error instanceof Error && error.message.includes("Missing required R2")) {
    return 503;
  }

  return 500;
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
