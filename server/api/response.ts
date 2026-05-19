import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  captureApiError,
  logStructured,
} from "@/server/observability/logging";

export interface ApiSuccess<TData> {
  ok: true;
  data: TData;
  requestId: string;
}

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  requestId: string;
}

interface ApiSuccessInput<TData> {
  data: TData;
  requestId: string;
  status?: number;
}

interface ApiErrorInput {
  code: string;
  message: string;
  requestId: string;
  status?: number;
  fields?: Record<string, string[]>;
  cause?: unknown;
}

export function createRequestId(request?: Request): string {
  const forwardedRequestId = request?.headers.get("x-request-id")?.trim();

  if (forwardedRequestId) {
    return forwardedRequestId;
  }

  const vercelRequestId = request?.headers.get("x-vercel-id")?.trim();

  if (vercelRequestId) {
    return vercelRequestId;
  }

  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}`;
}

export function apiSuccess<TData>({
  data,
  requestId,
  status = 200,
}: ApiSuccessInput<TData>): NextResponse<ApiSuccess<TData>> {
  logStructured({
    level: "info",
    event: "api.response",
    requestId,
    status,
    ok: true,
  });

  return NextResponse.json(
    { ok: true, data, requestId },
    {
      status,
      headers: {
        "x-request-id": requestId,
      },
    }
  );
}

export function apiError({
  code,
  message,
  requestId,
  status = 500,
  fields,
  cause,
}: ApiErrorInput): NextResponse<ApiErrorBody> {
  logStructured({
    level: status >= 500 ? "error" : "warn",
    event: "api.response",
    requestId,
    status,
    code,
    ok: false,
    error: cause,
  });

  if (status >= 500) {
    captureApiError({
      error: cause ?? new Error(message),
      requestId,
      code,
      status,
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error: { code, message, fields },
      requestId,
    },
    {
      status,
      headers: {
        "x-request-id": requestId,
      },
    }
  );
}

export function getZodErrorFields(
  error: ZodError
): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    fields[key] = [...(fields[key] ?? []), issue.message];
  }

  return fields;
}

export function apiValidationError({
  error,
  requestId,
}: {
  error: ZodError;
  requestId: string;
}): NextResponse<ApiErrorBody> {
  return apiError({
    code: "VALIDATION_ERROR",
    message: "Request validation failed.",
    requestId,
    status: 400,
    fields: getZodErrorFields(error),
  });
}
