import "server-only";

import { NextResponse } from "next/server";

/**
 * Lightweight in-memory, fixed-window rate limiter for abusable write/expensive
 * endpoints (QR create, render, duplicate). It is intentionally NOT applied to
 * scan redirects so legitimate scans of a published QR are never throttled.
 *
 * Note: state is per-instance. On serverless this is best-effort burst
 * protection, not a distributed quota — swap in a shared store (e.g. Redis)
 * when stronger guarantees are needed.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now: number = Date.now()
): RateLimitResult {
  pruneExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });

    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientRateLimitKey(request: Request, scope: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `${scope}:${ip}`;
}

/**
 * Returns a 429 response when the caller has exceeded the limit, otherwise
 * `null`. Mirrors the standard API error body so clients parse it uniformly.
 */
export function enforceRateLimit({
  request,
  scope,
  options,
  requestId,
}: {
  readonly request: Request;
  readonly scope: string;
  readonly options: RateLimitOptions;
  readonly requestId: string;
}): NextResponse | null {
  const result = checkRateLimit(getClientRateLimitKey(request, scope), options);
  if (result.allowed) return null;

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down and try again shortly.",
      },
      requestId,
    },
    {
      status: 429,
      headers: {
        "x-request-id": requestId,
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

function pruneExpired(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
