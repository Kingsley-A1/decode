import {
  apiError,
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import {
  ScanImageDecodeError,
  ScanImageValidationError,
} from "@/server/scans/errors";
import { decodeQRCodeImage } from "@/server/scans/image";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError({
        code: "SCAN_IMAGE_REQUIRED",
        message: "Upload an image file using the `file` field.",
        requestId,
        status: 400,
      });
    }

    const result = await decodeQRCodeImage({ file });

    return apiSuccess({ data: result, requestId });
  } catch (error) {
    if (error instanceof ScanImageValidationError) {
      return apiError({
        code: "INVALID_SCAN_IMAGE",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    if (error instanceof ScanImageDecodeError) {
      return apiError({
        code: "QR_CODE_NOT_DETECTED",
        message: error.message,
        requestId,
        status: 422,
      });
    }

    return apiError({
      code: "SCAN_IMAGE_DECODE_FAILED",
      message: getSafeErrorMessage(error, "Could not decode this image."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
