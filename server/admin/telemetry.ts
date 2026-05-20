import "server-only";

import { hashAdminTelemetryValue } from "@/server/admin/crypto";

export interface AdminRequestTelemetry {
  readonly ipHash: string | null;
  readonly userAgentHash: string | null;
}

export function getAdminRequestTelemetry(
  request: Request
): AdminRequestTelemetry {
  const userAgent = request.headers.get("user-agent")?.trim() ?? "";
  const ipAddress = getClientIpAddress(request);

  return {
    ipHash: ipAddress ? hashAdminTelemetryValue(ipAddress) : null,
    userAgentHash: userAgent ? hashAdminTelemetryValue(userAgent) : null,
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
