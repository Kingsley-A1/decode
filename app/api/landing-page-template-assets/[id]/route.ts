import {
  apiError,
  createRequestId,
} from "@/server/api/response";
import { getPublicLandingPageTemplateUploadedAsset } from "@/server/landing-page-templates/assets";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);
  const { id } = await context.params;

  try {
    const result = await getPublicLandingPageTemplateUploadedAsset(id);
    if (!result) {
      return apiError({
        code: "TEMPLATE_ASSET_NOT_FOUND",
        message: "Template asset was not found.",
        requestId,
        status: 404,
      });
    }

    const body = new ArrayBuffer(result.object.body.byteLength);
    new Uint8Array(body).set(result.object.body);

    return new Response(body, {
      headers: {
        "Content-Type": result.object.contentType ?? result.asset.contentType,
        "Content-Length": String(
          result.object.contentLength ?? result.asset.fileSizeBytes
        ),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError({
      code: "TEMPLATE_ASSET_LOAD_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Could not load this template asset.",
      requestId,
      status:
        error instanceof Error && error.message.includes("Missing required R2")
          ? 503
          : 500,
      cause: error,
    });
  }
}
