import { apiError, createRequestId } from "@/server/api/response";
import { getDynamicQRCodeRedirectTarget } from "@/server/analytics/repository";
import { QR_CODE_TYPE } from "@/server/qr/constants";
import {
  getStoredContent,
  parseStoredVCardContent,
} from "@/server/qr/hosted";
import { buildVCardPayload } from "@/server/qr/payload";
import { normalizeDynamicSlug } from "@/server/qr/slugs";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly slug: string }>;
}

// Serves the downloadable .vcf for a contact-card dynamic QR. The vCard body is
// rebuilt from the same stored content and the same `buildVCardPayload`
// formatter the QR itself encodes, so the hosted "Save contact" link and a
// direct scan always produce an identical card.
export async function GET(_request: Request, context: RouteContext) {
  const requestId = createRequestId(_request);
  const { slug } = await context.params;
  const normalizedSlug = normalizeDynamicSlug(slug);

  try {
    const qrCode = await getDynamicQRCodeRedirectTarget({
      slug: normalizedSlug,
    });

    if (!qrCode || qrCode.type !== QR_CODE_TYPE.VCARD) {
      return apiError({
        code: "DYNAMIC_QR_NOT_FOUND",
        message: "This contact card is unavailable.",
        requestId,
        status: 404,
      });
    }

    const content = parseStoredVCardContent(getStoredContent(qrCode.payload));
    const vcard = buildVCardPayload(content).value;
    const fileName = getVCardFileName(content);

    return new Response(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return apiError({
      code: "DYNAMIC_QR_VCF_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Could not build this contact card.",
      requestId,
      status: 503,
      cause: error,
    });
  }
}

function getVCardFileName(content: {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly organization?: string;
}): string {
  const base =
    [content.firstName, content.lastName].filter(Boolean).join(" ") ||
    content.organization ||
    "contact";
  // Keep the header value safe: ASCII word characters only, collapsed to a
  // single token so no quote or control character can escape the filename.
  const slugified = base
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();

  return `${slugified || "contact"}.vcf`;
}
