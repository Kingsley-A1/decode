import { ZodError } from "zod";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import { verifyLink } from "@/server/links/service";
import { verifyLinkRequestSchema } from "@/server/links/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const body = await request.json();
    const verifyRequest = verifyLinkRequestSchema.parse(body);
    const result = await verifyLink({ url: verifyRequest.url });

    return apiSuccess({ data: result, requestId });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: "LINK_VERIFY_FAILED",
      message: getSafeErrorMessage(error, "Could not verify this link."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
