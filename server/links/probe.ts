import "server-only";

import type {
  ProbeRedirectHop,
  ProbeSummary,
  ProbeTlsSummary,
} from "@/server/links/evidence";
import {
  SAFE_FETCH_ERROR_CODE,
  SafeFetchError,
  safeFetch,
  type SafeFetchOptions,
  type SafeFetchResult,
} from "@/server/net/safeFetch";
import { inspectTls } from "@/server/net/tlsInspect";

// Real network probe for Phase C. Runs HEAD against the URL, follows
// up to MAX_HOPS redirects manually (so each hop is re-validated by
// safeFetch's SSRF policy), and inspects the final hop's TLS cert when
// the final URL is HTTPS. Always returns a ProbeSummary — never throws.
// Errors are reported through the `error` field so the evidence mapper
// can translate them into structured evidence.

const MAX_HOPS = 5;
// Probe budget tuned for a responsive verifier UI: under 3s the user
// perceives the verdict as snapping in, beyond 4s it feels broken. We run
// in parallel with Web Risk (≤2.5s) under Promise.all, so the 3s probe
// ceiling effectively caps end-to-end verification at ~3s for a fresh URL.
const DEFAULT_TOTAL_BUDGET_MS = 3000;
const DEFAULT_PER_HOP_TIMEOUT_MS = 1500;
const DEFAULT_TLS_TIMEOUT_MS = 1200;
const MIN_TLS_BUDGET_MS = 200;

export type ProbeFetchImpl = (
  url: string,
  options: SafeFetchOptions
) => Promise<SafeFetchResult>;

export type ProbeTlsImpl = typeof inspectTls;

export interface ProbeOptions {
  readonly maxHops?: number;
  readonly totalBudgetMs?: number;
  readonly perHopTimeoutMs?: number;
  readonly tlsTimeoutMs?: number;
  readonly now?: () => number;
  // Test seams — production callers do not pass these.
  readonly safeFetchImpl?: ProbeFetchImpl;
  readonly inspectTlsImpl?: ProbeTlsImpl;
}

export async function probeUrl(
  initialUrl: string,
  options: ProbeOptions = {}
): Promise<ProbeSummary> {
  const maxHops = options.maxHops ?? MAX_HOPS;
  const totalBudgetMs = options.totalBudgetMs ?? DEFAULT_TOTAL_BUDGET_MS;
  const perHopTimeoutMs = options.perHopTimeoutMs ?? DEFAULT_PER_HOP_TIMEOUT_MS;
  const tlsTimeoutMs = options.tlsTimeoutMs ?? DEFAULT_TLS_TIMEOUT_MS;
  const now = options.now ?? Date.now;
  const fetchImpl = options.safeFetchImpl ?? safeFetch;
  const inspectImpl = options.inspectTlsImpl ?? inspectTls;

  const startedAt = now();
  const deadline = startedAt + totalBudgetMs;
  const chain: ProbeRedirectHop[] = [];

  let current = initialUrl;
  let lastResponse: SafeFetchResult | null = null;
  let error: string | null = null;

  for (let hop = 0; hop < maxHops; hop++) {
    const remaining = deadline - now();
    if (remaining <= 0) {
      error = "timeout";
      break;
    }

    try {
      const result = await fetchImpl(current, {
        method: "HEAD",
        timeoutMs: Math.min(perHopTimeoutMs, remaining),
      });
      lastResponse = result;
      chain.push({ url: current, status: result.status });

      if (isRedirect(result.status)) {
        const next = resolveRedirect(result, current);
        if (!next) {
          error = "redirect_missing_location";
          break;
        }
        current = next;
        continue;
      }

      // Non-redirect — done.
      break;
    } catch (caught) {
      error = mapFetchErrorToProbeError(caught);
      break;
    }
  }

  if (chain.length === maxHops && lastResponse && isRedirect(lastResponse.status)) {
    error = "too_many_redirects";
  }

  const finalUrl = lastResponse?.url ?? initialUrl;
  const tls = await maybeInspectTls({
    finalUrl,
    httpStatus: lastResponse?.status ?? null,
    deadline,
    now,
    inspectImpl,
    tlsTimeoutMs,
  });

  return {
    initialUrl,
    finalUrl,
    redirectChain: chain,
    httpStatus: lastResponse?.status ?? null,
    contentType: lastResponse?.contentType ?? null,
    tls,
    durationMs: now() - startedAt,
    truncated: lastResponse?.truncated ?? false,
    error,
  };
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400 && status !== 304;
}

function resolveRedirect(
  response: SafeFetchResult,
  currentUrl: string
): string | null {
  const location = response.headers.get("location");
  if (!location) return null;

  try {
    return new URL(location, currentUrl).toString();
  } catch {
    return null;
  }
}

/** Maps a SafeFetchError code to a stable probe-error string. The
 *  evidence mapper turns these into Evidence entries. SSRF blocks during
 *  redirects collapse to a single `redirect_to_private_network` signal —
 *  by the time we reach the probe, the initial URL has already passed
 *  the heuristic SSRF check. */
function mapFetchErrorToProbeError(error: unknown): string {
  if (!(error instanceof SafeFetchError)) return "network_error";

  switch (error.code) {
    case SAFE_FETCH_ERROR_CODE.PRIVATE_NETWORK:
    case SAFE_FETCH_ERROR_CODE.LOCALHOST_HOST:
    case SAFE_FETCH_ERROR_CODE.IP_LITERAL_BLOCKED:
      return "redirect_to_private_network";
    case SAFE_FETCH_ERROR_CODE.TIMEOUT:
    case SAFE_FETCH_ERROR_CODE.ABORTED:
      return "timeout";
    case SAFE_FETCH_ERROR_CODE.DNS_FAILED:
      return "dns_failed";
    default:
      return error.code;
  }
}

async function maybeInspectTls(args: {
  readonly finalUrl: string;
  readonly httpStatus: number | null;
  readonly deadline: number;
  readonly now: () => number;
  readonly inspectImpl: ProbeTlsImpl;
  readonly tlsTimeoutMs: number;
}): Promise<ProbeTlsSummary | null> {
  if (args.httpStatus === null) return null;

  let parsed: URL;
  try {
    parsed = new URL(args.finalUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;

  const remaining = args.deadline - args.now();
  if (remaining < MIN_TLS_BUDGET_MS) return null;

  const inspection = await args.inspectImpl({
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 443,
    servername: parsed.hostname,
    timeoutMs: Math.min(args.tlsTimeoutMs, remaining),
  });

  if (inspection.error) return null;

  return {
    issuer: inspection.issuer,
    subject: inspection.subject,
    validFrom: inspection.validFrom,
    validTo: inspection.validTo,
    daysToExpiry: inspection.daysToExpiry,
    selfSigned: inspection.selfSigned,
    hostnameMatches: inspection.hostnameMatches,
  };
}
