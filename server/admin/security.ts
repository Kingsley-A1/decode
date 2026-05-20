import "server-only";

import { AdminAuthError } from "@/server/admin/errors";

export function assertAdminSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = new Set(
    [
      requestOrigin,
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXTAUTH_URL,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => new URL(value).origin)
  );

  if (!allowedOrigins.has(new URL(origin).origin)) {
    throw new AdminAuthError(
      "ADMIN_ORIGIN_DENIED",
      "This admin request did not come from an allowed origin.",
      403
    );
  }
}
