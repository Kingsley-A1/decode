import "server-only";

import { ZodError } from "zod";
import type { NextResponse } from "next/server";
import {
  apiError,
  apiValidationError,
  type ApiErrorBody,
} from "@/server/api/response";
import { AdminAccessError, AdminAuthError } from "@/server/admin/errors";

export function adminApiError({
  error,
  requestId,
  fallbackCode,
  fallbackMessage,
}: {
  readonly error: unknown;
  readonly requestId: string;
  readonly fallbackCode: string;
  readonly fallbackMessage: string;
}): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return apiValidationError({ error, requestId });
  }

  if (error instanceof AdminAuthError || error instanceof AdminAccessError) {
    return apiError({
      code: error.code,
      message: error.message,
      requestId,
      status: error.status,
    });
  }

  return apiError({
    code: fallbackCode,
    message: error instanceof Error ? error.message : fallbackMessage,
    requestId,
    status: 500,
    cause: error,
  });
}
