import { ZodError } from "zod";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import { renderQRCode } from "@/server/qr/render";
import { renderUnsavedQRCodeRequestSchema } from "@/server/qr/schemas";
import { enforceRateLimit } from "@/server/security/rate-limit";

export const runtime = "nodejs";

// Stateless render for unsaved QR codes. Static and anonymous downloads call
// this so the exported file is produced by the same styled SVG renderer as
// saved/dynamic codes — keeping the frame, frame color, and design consistent.
// No persistence and no account required; bounded inputs + rate limiting guard
// against abuse.
export async function POST(request: Request) {
  const requestId = createRequestId(request);

  const limited = enforceRateLimit({
    request,
    scope: "qr-render",
    options: { limit: 60, windowMs: 60_000 },
    requestId,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const renderRequest = renderUnsavedQRCodeRequestSchema.parse(body);

    const rendered = await renderQRCode({
      value: renderRequest.value,
      design: renderRequest.design,
      format: renderRequest.format,
      title: renderRequest.title,
      logo: renderRequest.design.logo
        ? { dataUrl: renderRequest.design.logo }
        : null,
    });

    const bodyBuffer =
      typeof rendered.body === "string"
        ? Buffer.from(rendered.body)
        : rendered.body;

    return apiSuccess({
      data: {
        base64: bodyBuffer.toString("base64"),
        contentType: rendered.contentType,
        extension: rendered.extension,
      },
      requestId,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: "QR_CODE_RENDER_FAILED",
      message:
        error instanceof Error ? error.message : "Could not render this QR code.",
      requestId,
      status: 500,
      cause: error,
    });
  }
}
