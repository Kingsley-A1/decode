import { createHash } from "node:crypto";
import { SCAN_BOT_DEVICE_CLASS } from "@/server/analytics/constants";

export interface ScanTelemetry {
  readonly deviceClass: string;
  readonly browser: string;
  readonly operatingSystem: string;
  readonly referrer: string | null;
  readonly country: string | null;
  readonly region: string | null;
  readonly ipHash: string | null;
  readonly userAgentHash: string | null;
}

export function buildScanTelemetry(request: Request): ScanTelemetry {
  const userAgent = request.headers.get("user-agent") ?? "";
  const ipAddress = getClientIpAddress(request);

  return {
    deviceClass: getDeviceClass(userAgent),
    browser: getBrowser(userAgent),
    operatingSystem: getOperatingSystem(userAgent),
    referrer: getBoundedHeader(request, "referer", 2048),
    country: getBoundedHeader(request, "x-vercel-ip-country", 64),
    region: getBoundedHeader(request, "x-vercel-ip-country-region", 128),
    ipHash: ipAddress ? hashTelemetryValue(ipAddress) : null,
    userAgentHash: userAgent ? hashTelemetryValue(userAgent) : null,
  };
}

function getClientIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    null
  );
}

function getBoundedHeader(
  request: Request,
  headerName: string,
  maxLength: number
): string | null {
  const value = request.headers.get(headerName)?.trim();
  if (!value) return null;

  return value.slice(0, maxLength);
}

function getDeviceClass(userAgent: string): string {
  if (!userAgent) return "unknown";
  if (/bot|crawler|spider|slurp|preview|facebookexternalhit/i.test(userAgent)) {
    return SCAN_BOT_DEVICE_CLASS;
  }
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile/i.test(userAgent)) return "mobile";

  return "desktop";
}

function getBrowser(userAgent: string): string {
  if (!userAgent) return "unknown";
  if (/edg\//i.test(userAgent)) return "edge";
  if (/firefox\//i.test(userAgent)) return "firefox";
  if (/samsungbrowser\//i.test(userAgent)) return "samsung";
  if (/chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)) {
    return "chrome";
  }
  if (/safari\//i.test(userAgent) && /version\//i.test(userAgent)) {
    return "safari";
  }

  return "unknown";
}

function getOperatingSystem(userAgent: string): string {
  if (!userAgent) return "unknown";
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/windows nt/i.test(userAgent)) return "windows";
  if (/mac os x/i.test(userAgent)) return "macos";
  if (/linux/i.test(userAgent)) return "linux";

  return "unknown";
}

function hashTelemetryValue(value: string): string {
  const salt =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "decode-local-scan-analytics-salt";

  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}
