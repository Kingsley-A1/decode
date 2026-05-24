import "server-only";

import type { Evidence } from "@/server/links/evidence";

// Google Safe Browsing (v4 Lookup API) as an external threat-intelligence
// source. This is the first verifier signal that is reputation-based rather
// than inferred: a match here is authoritative enough to call a URL
// `malicious`, and a clean result earns the last of a SAFE verdict's
// confidence.
//
// Gating: the module is a no-op unless GOOGLE_SAFE_BROWSING_API_KEY is set.
// When unconfigured it returns `configured: false` with no evidence and no
// error, so local dev and CI builds run unchanged.
//
// Privacy note: the Lookup API sends the full URL to Google. The caller is
// responsible for not handing us private / internal URLs (the verifier only
// calls this for public hosts). We never send localhost or private-network
// targets.

const SAFE_BROWSING_ENDPOINT =
  "https://safebrowsing.googleapis.com/v4/threatMatches:find";

const THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "POTENTIALLY_HARMFUL_APPLICATION",
] as const;

const THREAT_TYPE_TO_CODE: Readonly<Record<string, string>> = {
  MALWARE: "safe_browsing_malware",
  SOCIAL_ENGINEERING: "safe_browsing_social_engineering",
  UNWANTED_SOFTWARE: "safe_browsing_unwanted_software",
  POTENTIALLY_HARMFUL_APPLICATION: "safe_browsing_potentially_harmful",
};

const THREAT_TYPE_TO_LABEL: Readonly<Record<string, string>> = {
  MALWARE: "malware",
  SOCIAL_ENGINEERING: "social engineering / phishing",
  UNWANTED_SOFTWARE: "unwanted software",
  POTENTIALLY_HARMFUL_APPLICATION: "a potentially harmful application",
};

const DEFAULT_TIMEOUT_MS = 3000;
const THREAT_TTL_MIN_MS = 5 * 60 * 1000;
const THREAT_TTL_MAX_MS = 24 * 60 * 60 * 1000;
const CLEAN_TTL_MS = 6 * 60 * 60 * 1000;

export interface SafeBrowsingResult {
  /** False when no API key is configured — the source is simply absent. */
  readonly configured: boolean;
  /** True when the lookup completed (clean or matched) without error. */
  readonly checked: boolean;
  readonly evidence: readonly Evidence[];
  /** Suggested freshness window for the SB portion of the verdict. */
  readonly cacheTtlMs: number | null;
  readonly error: string | null;
}

export interface SafeBrowsingOptions {
  readonly apiKey?: string;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  // Test seam — production callers should not pass this.
  readonly fetchImpl?: typeof fetch;
}

export async function checkSafeBrowsing(
  url: string,
  options: SafeBrowsingOptions = {}
): Promise<SafeBrowsingResult> {
  const apiKey = options.apiKey ?? process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return notConfigured();
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const observedAt = new Date(options.now ? options.now() : Date.now())
    .toISOString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(
      `${SAFE_BROWSING_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequestBody(url)),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      return errored(`safe_browsing_http_${response.status}`);
    }

    const payload: unknown = await response.json();

    return interpret(payload, observedAt);
  } catch (error) {
    return errored(getErrorCode(error));
  } finally {
    clearTimeout(timer);
  }
}

function buildRequestBody(url: string) {
  return {
    client: { clientId: "decode", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: THREAT_TYPES,
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };
}

function interpret(payload: unknown, observedAt: string): SafeBrowsingResult {
  const matches = extractMatches(payload);

  if (matches.length === 0) {
    return {
      configured: true,
      checked: true,
      evidence: [
        {
          code: "safe_browsing_clean",
          source: "safe_browsing",
          severity: "info",
          message: "Google Safe Browsing has no record of this URL.",
          observedAt,
        },
      ],
      cacheTtlMs: CLEAN_TTL_MS,
      error: null,
    };
  }

  const evidence: Evidence[] = [];
  const seen = new Set<string>();
  let maxCacheMs = 0;

  for (const match of matches) {
    const code = THREAT_TYPE_TO_CODE[match.threatType];
    if (!code || seen.has(code)) continue;
    seen.add(code);

    evidence.push({
      code,
      source: "safe_browsing",
      severity: "critical",
      message: `Google Safe Browsing flagged this URL for ${
        THREAT_TYPE_TO_LABEL[match.threatType] ?? "a known threat"
      }.`,
      observedAt,
      data: { threat_type: match.threatType },
    });

    const ms = parseCacheDurationMs(match.cacheDuration);
    if (ms !== null && ms > maxCacheMs) maxCacheMs = ms;
  }

  return {
    configured: true,
    checked: true,
    evidence,
    cacheTtlMs: clampThreatTtl(maxCacheMs),
    error: null,
  };
}

interface SafeBrowsingMatch {
  readonly threatType: string;
  readonly cacheDuration?: string;
}

function extractMatches(payload: unknown): readonly SafeBrowsingMatch[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload as { matches?: unknown }).matches;
  if (!Array.isArray(raw)) return [];

  const matches: SafeBrowsingMatch[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const threatType = (entry as { threatType?: unknown }).threatType;
    if (typeof threatType !== "string") continue;
    const cacheDuration = (entry as { cacheDuration?: unknown }).cacheDuration;
    matches.push({
      threatType,
      cacheDuration:
        typeof cacheDuration === "string" ? cacheDuration : undefined,
    });
  }

  return matches;
}

/** Parses Safe Browsing's protobuf-duration strings ("300s", "300.5s"). */
function parseCacheDurationMs(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value.trim());
  if (!match) return null;
  const seconds = Number.parseFloat(match[1] ?? "");

  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
}

function clampThreatTtl(ms: number): number {
  if (ms < THREAT_TTL_MIN_MS) return THREAT_TTL_MIN_MS;
  if (ms > THREAT_TTL_MAX_MS) return THREAT_TTL_MAX_MS;

  return ms;
}

function notConfigured(): SafeBrowsingResult {
  return {
    configured: false,
    checked: false,
    evidence: [],
    cacheTtlMs: null,
    error: null,
  };
}

function errored(code: string): SafeBrowsingResult {
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
    return "safe_browsing_timeout";
  }

  return "safe_browsing_unreachable";
}
