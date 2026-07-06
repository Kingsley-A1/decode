import { after, NextResponse } from "next/server";
import {
  apiError,
  createRequestId,
} from "@/server/api/response";
import {
  getDynamicQRCodeRedirectTarget,
  recordDynamicQRCodeScan,
} from "@/server/analytics/repository";
import { buildScanTelemetry } from "@/server/analytics/scan";
import { LANDING_PAGE_STATUS } from "@/server/landing-pages/constants";
import { renderLandingPageHtml } from "@/server/landing-pages/render";
import { logStructured } from "@/server/observability/logging";
import { QR_CODE_TYPE } from "@/server/qr/constants";
import {
  getQRFileDownloadUrl,
  getStoredContent,
  parseStoredVCardContent,
  renderContactPage,
  renderTextPage,
} from "@/server/qr/hosted";
import { normalizeDynamicSlug } from "@/server/qr/slugs";

export const runtime = "nodejs";

// The landing page and hosted text/contact pages render no scripts, so scripts
// are blocked entirely as a hard stop against any injected markup that slips
// past escaping. A short cache keeps repeat scans fast without hiding edits.
const HOSTED_HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "Content-Security-Policy":
    "default-src 'none'; img-src 'self'; media-src 'self'; " +
    "style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; " +
    "frame-ancestors 'none'",
} as const;

interface RouteContext {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);
  const { slug } = await context.params;
  const normalizedSlug = normalizeDynamicSlug(slug);

  try {
    const qrCode = await getDynamicQRCodeRedirectTarget({
      slug: normalizedSlug,
    });

    if (!qrCode) {
      return apiError({
        code: "DYNAMIC_QR_NOT_FOUND",
        message: "This dynamic QR code is unavailable.",
        requestId,
        status: 404,
      });
    }

    const landingPage = qrCode.landingPage;
    const hasPublishedLandingPage = Boolean(
      landingPage &&
        landingPage.status === LANDING_PAGE_STATUS.PUBLISHED &&
        landingPage.deletedAt === null
    );

    // File targets are resolved to a signed URL up front so a missing or
    // detached asset 404s like any other absent destination — before a scan is
    // recorded against a target that no longer exists.
    const storedContent = getStoredContent(qrCode.payload);
    let fileDownloadUrl: string | null = null;
    if (!hasPublishedLandingPage && qrCode.type === QR_CODE_TYPE.FILE) {
      const assetId =
        typeof storedContent.assetId === "string"
          ? storedContent.assetId
          : null;
      if (assetId) {
        fileDownloadUrl = await getQRFileDownloadUrl({
          qrCodeId: qrCode.id,
          workspaceId: qrCode.workspaceId,
          assetId,
        });
      }
    }

    const isHostedType =
      qrCode.type === QR_CODE_TYPE.TEXT || qrCode.type === QR_CODE_TYPE.VCARD;
    const hasTarget =
      hasPublishedLandingPage ||
      isHostedType ||
      Boolean(fileDownloadUrl) ||
      Boolean(qrCode.destinationUrl);

    if (!hasTarget) {
      return apiError({
        code: "DYNAMIC_QR_TARGET_NOT_FOUND",
        message: "This dynamic QR code does not have an active destination.",
        requestId,
        status: 404,
      });
    }

    // Record the scan after the response is sent, and never let an analytics
    // failure break the redirect — the visitor's destination matters more than
    // the metric. Mirrors the resilience of the short-link route.
    const telemetry = buildScanTelemetry(request);
    after(async () => {
      try {
        await recordDynamicQRCodeScan({
          qrCodeId: qrCode.id,
          workspaceId: qrCode.workspaceId,
          telemetry,
        });
      } catch (scanError) {
        logStructured({
          level: "warn",
          event: "dynamic_qr.scan_record_failed",
          requestId,
          ok: false,
          error: scanError instanceof Error ? scanError.message : "unknown",
        });
      }
    });

    if (hasPublishedLandingPage && landingPage) {
      logStructured({
        level: "info",
        event: "dynamic_qr.landing_page_response",
        requestId,
        status: 200,
        ok: true,
      });

      return new Response(
        renderLandingPageHtml({
          title: landingPage.title,
          type: landingPage.type,
          content: landingPage.content,
        }),
        {
          headers: { ...HOSTED_HTML_HEADERS, "x-request-id": requestId },
        }
      );
    }

    if (isHostedType) {
      const title = qrCode.title ?? "";
      const html =
        qrCode.type === QR_CODE_TYPE.TEXT
          ? renderTextPage({
              title,
              text:
                typeof storedContent.text === "string"
                  ? storedContent.text
                  : "",
            })
          : renderContactPage({
              title,
              content: parseStoredVCardContent(storedContent),
              vcfUrl: `/r/${normalizedSlug}/vcf`,
            });

      logStructured({
        level: "info",
        event: "dynamic_qr.hosted_response",
        requestId,
        status: 200,
        ok: true,
      });

      return new Response(html, {
        headers: { ...HOSTED_HTML_HEADERS, "x-request-id": requestId },
      });
    }

    if (fileDownloadUrl) {
      logStructured({
        level: "info",
        event: "dynamic_qr.file_response",
        requestId,
        status: 302,
        ok: true,
      });

      return NextResponse.redirect(fileDownloadUrl, {
        status: 302,
        headers: {
          // Never cache: the signed URL is short-lived and destination edits
          // (swapping the file) must take effect immediately.
          "Cache-Control": "no-store",
          "x-request-id": requestId,
        },
      });
    }

    if (!qrCode.destinationUrl) {
      throw new Error("Dynamic QR destination was unexpectedly empty.");
    }

    logStructured({
      level: "info",
      event: "dynamic_qr.redirect_response",
      requestId,
      status: 302,
      ok: true,
    });

    return NextResponse.redirect(qrCode.destinationUrl, {
      status: 302,
      headers: {
        // Never cache the redirect: destination edits must take effect
        // immediately and every scan must reach the server to be counted.
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return apiError({
      code: "DYNAMIC_QR_REDIRECT_FAILED",
      message: getSafeErrorMessage(error, "Could not open this dynamic QR code."),
      requestId,
      status: 503,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
