import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context
) => {
  const requestId =
    getHeaderValue(request.headers["x-request-id"]) ??
    getHeaderValue(request.headers["x-vercel-id"]) ??
    getFallbackRequestId();

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "next.request_error",
      requestId,
      routePath: context.routePath,
      routeType: context.routeType,
      method: request.method,
      path: request.path,
      errorName: error instanceof Error ? error.name : undefined,
      errorMessage: error instanceof Error ? error.message : undefined,
    })
  );

  Sentry.withScope((scope) => {
    scope.setTag("request_id", requestId);
    scope.setTag("route_path", context.routePath);
    scope.setTag("route_type", context.routeType);
    scope.setContext("request", {
      requestId,
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
    });
    Sentry.captureRequestError(error, request, context);
  });
};

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;

  return value?.trim() || null;
}

function getFallbackRequestId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}`;
}
