import { after, NextResponse } from "next/server";
import { apiError, createRequestId } from "@/server/api/response";
import { buildScanTelemetry } from "@/server/analytics/scan";
import { logStructured } from "@/server/observability/logging";
import {
  getShortLinkInterstitialStatus,
  renderShortLinkInterstitial,
  type ShortLinkInterstitialKind,
} from "@/server/short-links/interstitial";
import {
  recordShortLinkScan,
  resolveShortLink,
} from "@/server/short-links/service";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);
  const { slug } = await context.params;

  try {
    const resolved = await resolveShortLink(slug);

    if (resolved.status === "ok") {
      // Record the scan after the response is sent, and never let an analytics
      // failure block the redirect — the user's destination matters more than
      // the metric.
      const telemetry = buildScanTelemetry(request);
      after(async () => {
        try {
          await recordShortLinkScan({
            shortLinkId: resolved.link.id,
            telemetry,
          });
        } catch (scanError) {
          logStructured({
            level: "warn",
            event: "short_link.scan_record_failed",
            requestId,
            ok: false,
            error:
              scanError instanceof Error ? scanError.message : "unknown",
          });
        }
      });

      logStructured({
        level: "info",
        event: "short_link.redirect_response",
        requestId,
        status: 302,
        ok: true,
      });

      return NextResponse.redirect(resolved.link.destinationUrl, {
        status: 302,
        headers: {
          // Never cache the redirect: destination edits and disable/expiry
          // actions must take effect immediately and every scan must count.
          "Cache-Control": "no-store",
          "x-request-id": requestId,
        },
      });
    }

    const kind = getInterstitialKind(resolved);
    logStructured({
      level: "info",
      event: "short_link.interstitial_response",
      requestId,
      status: getShortLinkInterstitialStatus(kind),
      ok: false,
    });

    return new Response(renderShortLinkInterstitial(kind), {
      status: getShortLinkInterstitialStatus(kind),
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return apiError({
      code: "SHORT_LINK_REDIRECT_FAILED",
      message: getSafeErrorMessage(error, "Could not open this short link."),
      requestId,
      status: 503,
      cause: error,
    });
  }
}

function getInterstitialKind(
  resolved: Exclude<
    Awaited<ReturnType<typeof resolveShortLink>>,
    { status: "ok" }
  >
): ShortLinkInterstitialKind {
  if (resolved.status === "expired") return "expired";
  if (resolved.status === "blocked") return resolved.reason;

  return "not_found";
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
