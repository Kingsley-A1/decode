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
import { normalizeDynamicSlug } from "@/server/qr/slugs";

export const runtime = "nodejs";

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
    const hasPublishedLandingPage =
      landingPage &&
      landingPage.status === LANDING_PAGE_STATUS.PUBLISHED &&
      landingPage.deletedAt === null;

    if (!hasPublishedLandingPage && !qrCode.destinationUrl) {
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

    if (hasPublishedLandingPage) {
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
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            // The landing page renders no scripts, so block them entirely as a
            // hard stop against any injected markup that slips past escaping.
            "Content-Security-Policy":
              "default-src 'none'; img-src 'self'; media-src 'self'; " +
              "style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; " +
              "frame-ancestors 'none'",
            "x-request-id": requestId,
          },
        }
      );
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
