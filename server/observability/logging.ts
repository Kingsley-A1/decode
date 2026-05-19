import "server-only";

import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface StructuredLogInput {
  readonly level: LogLevel;
  readonly event: string;
  readonly requestId?: string;
  readonly status?: number;
  readonly code?: string;
  readonly ok?: boolean;
  readonly error?: unknown;
}

export function logStructured(input: StructuredLogInput): void {
  if (process.env.NODE_ENV === "test" && input.level !== "error") return;

  const payload = {
    timestamp: new Date().toISOString(),
    level: input.level,
    event: input.event,
    requestId: input.requestId,
    status: input.status,
    code: input.code,
    ok: input.ok,
    errorName:
      input.error instanceof Error ? input.error.name : undefined,
    errorMessage:
      input.error instanceof Error ? input.error.message : undefined,
  };

  const line = JSON.stringify(payload);

  if (input.level === "error") {
    console.error(line);
    return;
  }

  if (input.level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function captureApiError({
  error,
  requestId,
  code,
  status,
}: {
  readonly error: unknown;
  readonly requestId: string;
  readonly code: string;
  readonly status: number;
}): void {
  const capturedError =
    error instanceof Error ? error : new Error(String(error || code));

  Sentry.withScope((scope) => {
    scope.setTag("request_id", requestId);
    scope.setTag("api_error_code", code);
    scope.setTag("http_status", String(status));
    scope.setContext("api", {
      requestId,
      code,
      status,
    });
    Sentry.captureException(capturedError);
  });
}
