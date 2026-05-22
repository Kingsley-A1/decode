import {
  isIpLiteral,
  isLocalhost,
  isPrivateOrReservedIp,
  stripIpv6Brackets,
} from "@/server/net/ipPolicy";
import {
  LINK_REASON_CODE,
  type LinkReasonCode,
} from "@/server/links/constants";
import {
  type Evidence,
  type EvidenceDataValue,
  type EvidenceSeverity,
  type VerificationVerdict,
} from "@/server/links/evidence";
import { scoreEvidence } from "@/server/links/score";

// Phase B refactor: the analyzer now emits Evidence and consults
// scoreEvidence for the verdict + confidence. The shape that was visible
// to API consumers (verdict / confidence / normalizedUrl / host / reasons)
// stays the same on the wire — service.ts projects `reasons` from the
// canonical `evidence` list before responding. The flat-90% rule that
// made every SAFE verdict claim the same confidence is gone: a heuristic-
// only SAFE now reports the low confidence that matches its evidence.

export interface LinkAnalysisResult {
  readonly verdict: VerificationVerdict;
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly evidence: readonly Evidence[];
  /** True iff a network probe ran under SSRF protection. Phase B always
   *  returns false because no probe runs yet. The flag is no longer a
   *  hard-coded marketing claim — it tracks what the verifier actually did. */
  readonly ssrfProtected: boolean;
}

export interface LegacyReason {
  readonly code: LinkReasonCode;
  readonly message: string;
  readonly severity: "low" | "medium" | "high";
}

interface LinkNormalizationResult {
  readonly url: URL | null;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly evidence: readonly Evidence[];
}

const RISKY_TLDS = new Set([
  "zip",
  "mov",
  "country",
  "gq",
  "tk",
  "ml",
  "cf",
  "ga",
  "top",
]);

const SUSPICIOUS_KEYWORDS = [
  "login",
  "verify",
  "secure",
  "update",
  "confirm",
  "payment",
  "invoice",
  "gift",
];

const BRAND_LOOKALIKE_PATTERNS = [
  { brand: "paypal", patterns: ["paypa1", "paipal", "pypl", "paypal-secure", "secure-paypal"] },
  { brand: "apple", patterns: ["app1e", "appleid-verify", "support-appleid", "apple-secure"] },
  { brand: "microsoft", patterns: ["micros0ft", "office365-secure", "login-live", "m1crosoft"] },
  { brand: "google", patterns: ["g00gle", "goog1e", "accounts-google", "secure-gmail"] },
  { brand: "amazon", patterns: ["amaz0n", "arnazon", "amazon-verify", "amazon-login"] },
] as const;

const SUSPICIOUS_CHARACTER_PATTERN = /[@<>"'\\]|\s{2,}/;
const ENCODED_CONTROL_PATTERN = /%(?:00|0a|0d|1f|7f)/i;

export function analyzeLink(input: string): LinkAnalysisResult {
  const normalized = normalizeLink(input);

  const evidence = normalized.url
    ? [
        ...normalized.evidence,
        ...getHostEvidence(normalized.url.hostname),
        ...getPathEvidence(normalized.url),
      ]
    : normalized.evidence;

  const scored = scoreEvidence(evidence);

  return {
    verdict: scored.verdict,
    confidence: scored.confidence,
    normalizedUrl: normalized.normalizedUrl,
    host: normalized.host,
    evidence,
    ssrfProtected: false,
  };
}

/** Projects the canonical Evidence array onto the legacy `LinkReason[]`
 *  shape consumed by SuspiciousLinkChecker and the LinkCheck.reasons column.
 *  Only heuristic-source items are surfaced; the new sources land in Phase E. */
export function toLegacyReasons(
  evidence: readonly Evidence[]
): readonly LegacyReason[] {
  const reasons: LegacyReason[] = [];
  for (const entry of evidence) {
    if (entry.source !== "heuristic") continue;
    if (!isLegacyReasonCode(entry.code)) continue;
    reasons.push({
      code: entry.code,
      message: entry.message,
      severity: mapLegacySeverity(entry.severity),
    });
  }

  return reasons;
}

export function normalizeLink(input: string): LinkNormalizationResult {
  const trimmedInput = input.trim();
  const candidate = getUrlCandidate(trimmedInput);
  const evidence: Evidence[] = [];

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        url: null,
        normalizedUrl: null,
        host: url.hostname.toLowerCase() || null,
        evidence: [
          getHeuristicEvidence(
            LINK_REASON_CODE.UNSUPPORTED_PROTOCOL,
            "Only http and https URLs can be verified.",
            "high",
            { protocol: url.protocol }
          ),
        ],
      };
    }

    url.hash = "";
    url.hostname = url.hostname.toLowerCase();

    if (url.username || url.password) {
      evidence.push(
        getHeuristicEvidence(
          LINK_REASON_CODE.URL_CREDENTIALS,
          "URL contains embedded credentials.",
          "high"
        )
      );
      url.username = "";
      url.password = "";
    }

    return {
      url,
      normalizedUrl: url.toString(),
      host: url.hostname,
      evidence,
    };
  } catch {
    return {
      url: null,
      normalizedUrl: null,
      host: null,
      evidence: [
        getHeuristicEvidence(
          LINK_REASON_CODE.MALFORMED_URL,
          "URL is malformed and cannot be safely parsed.",
          "high"
        ),
      ],
    };
  }
}

function getUrlCandidate(input: string): string {
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(input);

  return hasScheme ? input : `https://${input}`;
}

function getHostEvidence(hostname: string): readonly Evidence[] {
  const host = stripIpv6Brackets(hostname.toLowerCase());
  const evidence: Evidence[] = [];

  if (isLocalhost(host)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.LOCALHOST_HOST,
        "Localhost links are not valid public destinations.",
        "high"
      )
    );
  }

  if (isIpLiteral(host)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.RAW_IP_HOST,
        "URL uses a raw IP address instead of a domain name.",
        "high"
      )
    );
  }

  if (isPrivateOrReservedIp(host)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.PRIVATE_NETWORK_HOST,
        "URL targets a private, local, metadata, or reserved network range.",
        "high"
      )
    );
  }

  if (host.includes("xn--")) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.PUNYCODE_HOST,
        "Punycode domain detected, which may indicate a homograph attack.",
        "medium"
      )
    );
  }

  const tld = getTld(host);
  if (RISKY_TLDS.has(tld)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.RISKY_TLD,
        `High-risk top-level domain: .${tld}.`,
        "medium",
        { tld }
      )
    );
  }

  const subdomainCount = host.split(".").filter(Boolean).length;
  if (subdomainCount > 4) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.EXCESSIVE_SUBDOMAINS,
        "URL uses an unusually deep subdomain chain.",
        "medium",
        { subdomain_count: subdomainCount }
      )
    );
  }

  const spoof = matchBrandSpoof(host);
  if (spoof) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.BRAND_SPOOF,
        "Domain looks similar to a trusted brand pattern.",
        "high",
        { matched_brand: spoof.brand, matched_pattern: spoof.pattern }
      )
    );
  }

  return evidence;
}

function getPathEvidence(url: URL): readonly Evidence[] {
  const pathAndQuery = `${url.pathname}${url.search}`;
  const evidence: Evidence[] = [];

  if (pathAndQuery.length > 200) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.LONG_PATH,
        "URL path or query is unusually long.",
        "medium",
        { length: pathAndQuery.length }
      )
    );
  }

  const pathDepth = (url.pathname.match(/\//g) ?? []).length;
  if (pathDepth > 6) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.EXCESSIVE_PATH_DEPTH,
        "URL path has excessive depth.",
        "medium",
        { path_depth: pathDepth }
      )
    );
  }

  if (SUSPICIOUS_CHARACTER_PATTERN.test(pathAndQuery)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.SUSPICIOUS_CHARACTERS,
        "URL path or query contains suspicious characters.",
        "medium"
      )
    );
  }

  if (ENCODED_CONTROL_PATTERN.test(pathAndQuery)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.ENCODED_CONTROL_CHARS,
        "URL contains encoded control characters.",
        "high"
      )
    );
  }

  if (hasSuspiciousKeywords(pathAndQuery)) {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.SUSPICIOUS_KEYWORDS,
        "URL contains high-risk keywords such as login, verify, or payment.",
        "medium"
      )
    );
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    evidence.push(
      getHeuristicEvidence(
        LINK_REASON_CODE.NONSTANDARD_PORT,
        `URL uses non-standard port ${url.port}.`,
        "medium",
        { port: Number.parseInt(url.port, 10) }
      )
    );
  }

  return evidence;
}

function getHeuristicEvidence(
  code: LinkReasonCode,
  message: string,
  severity: EvidenceSeverity,
  data?: Readonly<Record<string, EvidenceDataValue>>
): Evidence {
  return {
    code,
    source: "heuristic",
    severity,
    message,
    observedAt: new Date().toISOString(),
    ...(data ? { data } : {}),
  };
}

function getTld(host: string): string {
  const parts = host.split(".").filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
}

function hasSuspiciousKeywords(pathAndQuery: string): boolean {
  const lower = pathAndQuery.toLowerCase();

  return SUSPICIOUS_KEYWORDS.some((word) => lower.includes(word));
}

function matchBrandSpoof(
  host: string
): { readonly brand: string; readonly pattern: string } | null {
  const lower = host.toLowerCase();
  for (const entry of BRAND_LOOKALIKE_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (lower.includes(pattern)) return { brand: entry.brand, pattern };
    }
    if (lower.includes(`${entry.brand}-secure`)) {
      return { brand: entry.brand, pattern: `${entry.brand}-secure` };
    }
  }

  return null;
}

function isLegacyReasonCode(code: string): code is LinkReasonCode {
  return Object.values(LINK_REASON_CODE).includes(code as LinkReasonCode);
}

function mapLegacySeverity(
  severity: EvidenceSeverity
): "low" | "medium" | "high" {
  if (severity === "critical") return "high";
  if (severity === "info") return "low";

  return severity;
}
