import { ZodError } from "zod";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import { DecodeTransformError } from "@/server/decode/errors";
import { decodeRequestSchema } from "@/server/decode/schemas";
import { transformDecodeInput } from "@/server/decode/transforms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const body = await request.json();
    const decodeRequest = decodeRequestSchema.parse(body);
    const result = transformDecodeInput(decodeRequest);

    return apiSuccess({ data: result, requestId });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    if (error instanceof DecodeTransformError) {
      return apiError({
        code: "INVALID_DECODE_INPUT",
        message: error.message,
        requestId,
        status: 400,
      });
    }

    return apiError({
      code: "DECODE_FAILED",
      message: getSafeErrorMessage(error, "Could not transform this input."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
