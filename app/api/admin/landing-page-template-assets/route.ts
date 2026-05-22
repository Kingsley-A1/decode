import {
  apiError,
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { getAdminRequestTelemetry } from "@/server/admin/telemetry";
import { AssetValidationError } from "@/server/assets/errors";
import { uploadAdminLandingPageTemplateAsset } from "@/server/landing-page-templates/assets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    assertAdminSameOrigin(request);

    const admin = await getRequiredAdminSession();
    const formData = await request.formData();
    const file = formData.get("file");
    const checksum = formData.get("checksum");

    if (!file || typeof file === "string") {
      throw new AssetValidationError("Choose a template asset file to upload.");
    }

    const asset = await uploadAdminLandingPageTemplateAsset({
      admin,
      fileName: file.name,
      contentType: file.type,
      body: Buffer.from(await file.arrayBuffer()),
      checksum: typeof checksum === "string" ? checksum : undefined,
      requestId,
      telemetry: getAdminRequestTelemetry(request),
    });

    return apiSuccess({ data: { asset }, requestId, status: 201 });
  } catch (error) {
    if (error instanceof AssetValidationError) {
      return apiError({
        code: "INVALID_TEMPLATE_ASSET_UPLOAD",
        message: error.message,
        requestId,
        status: 400,
        cause: error,
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("Missing required R2")
    ) {
      return apiError({
        code: "R2_NOT_CONFIGURED",
        message: error.message,
        requestId,
        status: 503,
        cause: error,
      });
    }

    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_TEMPLATE_ASSET_UPLOAD_FAILED",
      fallbackMessage: "Could not upload this template asset.",
    });
  }
}
