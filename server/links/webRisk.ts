import "server-only";

import type { Evidence } from "@/server/links/evidence";

// Google Web Risk (v1 Lookup) as an external threat-intelligence source.
// Web Risk is the enterprise-grade successor to the consumer Safe Browsing
// API: same lineage, stricter SLA, designed to be embedded in commercial
// products. The Decode platform uses it because a serious link verifier
// should not rely on a hobbyist-tier API for malicious-URL coverage.
//
// API: GET https://webrisk.googleapis.com/v1/uris:search
//   ?key={API_KEY}&uri={url}&threatTypes=MALWARE&threatTypes=...
// Clean response: `{}`
// Threat response: `{ "threat": { "threatTypes": ["MALWARE"], "expireTime": "RFC3339" } }`
//
// Gating: the module is a no-op unless GOOGLE_WEB_RISK_API_KEY is set. When
// unconfigured it returns `configured: false` with no evidence and no error,
// so local dev and CI builds run unchanged.
//
// Privacy: the Lookup API discloses checked URLs to Google. The caller is
// responsible for not handing us private / internal URLs (the verifier only
// calls this for public hosts).

const WEB_RISK_ENDPOINT = "https://webrisk.googleapis.com/v1/uris:search";

const THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "SOCIAL_ENGINEERING_EXTENDED_COVERAGE",
] as const;

const THREAT_TYPE_TO_CODE: Readonly<Record<string, string>> = {
  MALWARE: "web_risk_malware",
  SOCIAL_ENGINEERING: "web_risk_social_engineering",
  // Extended coverage is a broader social-engineering signal — same code,
  // same severity, with a data hint so analysts can tell the two apart.
  SOCIAL_ENGINEERING_EXTENDED_COVERAGE: "web_risk_social_engineering",
  UNWANTED_SOFTWARE: "web_risk_unwanted_software",
};

const THREAT_TYPE_TO_LABEL: Readonly<Record<string, string>> = {
  MALWARE: "malware",
  SOCIAL_ENGINEERING: "social engineering / phishing",
  SOCIAL_ENGINEERING_EXTENDED_COVERAGE:
    "social engineering (extended coverage)",
  UNWANTED_SOFTWARE: "unwanted software",
};

const DEFAULT_TIMEOUT_MS = 2500;
const THREAT_TTL_MIN_MS = 5 * 60 * 1000;
const THREAT_TTL_MAX_MS = 24 * 60 * 60 * 1000;
const CLEAN_TTL_MS = 6 * 60 * 60 * 1000;

export interface WebRiskResult {
  /** False when no API key is configured — the source is simply absent. */
  readonly configured: boolean;
  /** True when the lookup completed (clean or matched) without error. */
  readonly checked: boolean;
  readonly evidence: readonly Evidence[];
  /** Suggested freshness window for the Web Risk portion of the verdict. */
  readonly cacheTtlMs: number | null;
  readonly error: string | null;
}

export interface WebRiskOptions {
  readonly apiKey?: string;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  // Test seam — production callers should not pass this.
  readonly fetchImpl?: typeof fetch;
}

export async function checkWebRisk(
  url: string,
  options: WebRiskOptions = {}
): Promise<WebRiskResult> {
  const apiKey = options.apiKey ?? process.env.GOOGLE_WEB_RISK_API_KEY;
  if (!apiKey) {
    return notConfigured();
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const nowMs = options.now ? options.now() : Date.now();
  const observedAt = new Date(nowMs).toISOString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildRequestUrl(url, apiKey), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      return errored(`web_risk_http_${response.status}`);
    }

    const payload: unknown = await response.json();

    return interpret(payload, observedAt, nowMs);
  } catch (error) {
    return errored(getErrorCode(error));
  } finally {
    clearTimeout(timer);
  }
}

function buildRequestUrl(url: string, apiKey: string): string {
  // Web Risk expects a flat GET with repeated `threatTypes` params, not a
  // JSON body — building manually keeps the wire shape obvious and avoids a
  // URLSearchParams trip for the static threat-types list.
  const params = new URLSearchParams();
  params.append("key", apiKey);
  params.append("uri", url);
  for (const threatType of THREAT_TYPES) {
    params.append("threatTypes", threatType);
  }

  return `${WEB_RISK_ENDPOINT}?${params.toString()}`;
}

function interpret(
  payload: unknown,
  observedAt: string,
  nowMs: number
): WebRiskResult {
  const threat = extractThreat(payload);

  if (!threat || threat.threatTypes.length === 0) {
    return {
      configured: true,
      checked: true,
      evidence: [
        {
          code: "web_risk_clean",
          source: "web_risk",
          severity: "info",
          message: "Google Web Risk has no record of this URL.",
          observedAt,
        },
      ],
      cacheTtlMs: CLEAN_TTL_MS,
      error: null,
    };
  }

  const evidence: Evidence[] = [];
  const seen = new Set<string>();

  for (const threatType of threat.threatTypes) {
    const code = THREAT_TYPE_TO_CODE[threatType];
    if (!code || seen.has(code)) continue;
    seen.add(code);

    evidence.push({
      code,
      source: "web_risk",
      severity: "critical",
      message: `Google Web Risk flagged this URL for ${
        THREAT_TYPE_TO_LABEL[threatType] ?? "a known threat"
      }.`,
      observedAt,
      data: { threat_type: threatType },
    });
  }

  const threatTtlMs = computeThreatTtlMs(threat.expireTime, nowMs);

  return {
    configured: true,
    checked: true,
    evidence,
    cacheTtlMs: threatTtlMs,
    error: null,
  };
}

interface ParsedThreat {
  readonly threatTypes: readonly string[];
  readonly expireTime?: string;
}

function extractThreat(payload: unknown): ParsedThreat | null {
  if (!payload || typeof payload !== "object") return null;
  const threat = (payload as { threat?: unknown }).threat;
  if (!threat || typeof threat !== "object") return null;

  const rawTypes = (threat as { threatTypes?: unknown }).threatTypes;
  if (!Array.isArray(rawTypes)) return null;

  const threatTypes: string[] = [];
  for (const entry of rawTypes) {
    if (typeof entry === "string") threatTypes.push(entry);
  }

  const expireTime = (threat as { expireTime?: unknown }).expireTime;

  return {
    threatTypes,
    expireTime: typeof expireTime === "string" ? expireTime : undefined,
  };
}

function computeThreatTtlMs(
  expireTime: string | undefined,
  nowMs: number
): number {
  if (!expireTime) return THREAT_TTL_MIN_MS;
  const expireMs = Date.parse(expireTime);
  if (!Number.isFinite(expireMs)) return THREAT_TTL_MIN_MS;

  const remaining = expireMs - nowMs;
  if (remaining < THREAT_TTL_MIN_MS) return THREAT_TTL_MIN_MS;
  if (remaining > THREAT_TTL_MAX_MS) return THREAT_TTL_MAX_MS;

  return remaining;
}

function notConfigured(): WebRiskResult {
  return {
    configured: false,
    checked: false,
    evidence: [],
    cacheTtlMs: null,
    error: null,
  };
}

function errored(code: string): WebRiskResult {
  return {
    configured: true,
    checked: false,
    evidence: [],
    cacheTtlMs: null,
    error: code,
  };
}

function getErrorCode(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "web_risk_timeout";
  }

  return "web_risk_unreachable";
}
