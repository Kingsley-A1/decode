import { isIP } from "node:net";
import {
  LINK_REASON_CODE,
  LINK_VERDICT,
  type LinkReasonCode,
  type LinkVerdict,
} from "@/server/links/constants";

export interface LinkReason {
  readonly code: LinkReasonCode;
  readonly message: string;
  readonly severity: "low" | "medium" | "high";
}

export interface LinkAnalysisResult {
  readonly verdict: LinkVerdict;
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly reasons: readonly LinkReason[];
  readonly ssrfProtected: true;
}

interface LinkNormalizationResult {
  readonly url: URL | null;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly reasons: readonly LinkReason[];
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

const HARD_BLOCK_REASON_CODES = new Set<LinkReasonCode>([
  LINK_REASON_CODE.BRAND_SPOOF,
  LINK_REASON_CODE.LOCALHOST_HOST,
  LINK_REASON_CODE.MALFORMED_URL,
  LINK_REASON_CODE.PRIVATE_NETWORK_HOST,
  LINK_REASON_CODE.RAW_IP_HOST,
  LINK_REASON_CODE.UNSUPPORTED_PROTOCOL,
]);

export function analyzeLink(input: string): LinkAnalysisResult {
  const normalizedLink = normalizeLink(input);

  if (!normalizedLink.url) {
    return getAnalysisResult({
      normalizedUrl: normalizedLink.normalizedUrl,
      host: normalizedLink.host,
      reasons: normalizedLink.reasons,
    });
  }

  const reasons = [
    ...normalizedLink.reasons,
    ...getHostReasons(normalizedLink.url.hostname),
    ...getPathReasons(normalizedLink.url),
  ];

  return getAnalysisResult({
    normalizedUrl: normalizedLink.normalizedUrl,
    host: normalizedLink.host,
    reasons,
  });
}

export function normalizeLink(input: string): LinkNormalizationResult {
  const trimmedInput = input.trim();
  const candidate = getUrlCandidate(trimmedInput);
  const reasons: LinkReason[] = [];

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        url: null,
        normalizedUrl: null,
        host: url.hostname.toLowerCase() || null,
        reasons: [
          getReason(
            LINK_REASON_CODE.UNSUPPORTED_PROTOCOL,
            "Only http and https URLs can be verified.",
            "high"
          ),
        ],
      };
    }

    url.hash = "";
    url.hostname = url.hostname.toLowerCase();

    if (url.username || url.password) {
      reasons.push(
        getReason(
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
      reasons,
    };
  } catch {
    return {
      url: null,
      normalizedUrl: null,
      host: null,
      reasons: [
        getReason(
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

function getHostReasons(hostname: string): LinkReason[] {
  const host = stripIpv6Brackets(hostname.toLowerCase());
  const reasons: LinkReason[] = [];

  if (isLocalhost(host)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.LOCALHOST_HOST,
        "Localhost links are not valid public destinations.",
        "high"
      )
    );
  }

  if (isIP(host)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.RAW_IP_HOST,
        "URL uses a raw IP address instead of a domain name.",
        "high"
      )
    );
  }

  if (isPrivateOrReservedIp(host)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.PRIVATE_NETWORK_HOST,
        "URL targets a private, local, metadata, or reserved network range.",
        "high"
      )
    );
  }

  if (host.includes("xn--")) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.PUNYCODE_HOST,
        "Punycode domain detected, which may indicate a homograph attack.",
        "medium"
      )
    );
  }

  const tld = getTld(host);
  if (RISKY_TLDS.has(tld)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.RISKY_TLD,
        `High-risk top-level domain: .${tld}.`,
        "medium"
      )
    );
  }

  if (host.split(".").filter(Boolean).length > 4) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.EXCESSIVE_SUBDOMAINS,
        "URL uses an unusually deep subdomain chain.",
        "medium"
      )
    );
  }

  if (looksLikeBrandSpoof(host)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.BRAND_SPOOF,
        "Domain looks similar to a trusted brand pattern.",
        "high"
      )
    );
  }

  return reasons;
}

function getPathReasons(url: URL): LinkReason[] {
  const pathAndQuery = `${url.pathname}${url.search}`;
  const reasons: LinkReason[] = [];

  if (pathAndQuery.length > 200) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.LONG_PATH,
        "URL path or query is unusually long.",
        "medium"
      )
    );
  }

  if ((url.pathname.match(/\//g) ?? []).length > 6) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.EXCESSIVE_PATH_DEPTH,
        "URL path has excessive depth.",
        "medium"
      )
    );
  }

  if (SUSPICIOUS_CHARACTER_PATTERN.test(pathAndQuery)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.SUSPICIOUS_CHARACTERS,
        "URL path or query contains suspicious characters.",
        "medium"
      )
    );
  }

  if (ENCODED_CONTROL_PATTERN.test(pathAndQuery)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.ENCODED_CONTROL_CHARS,
        "URL contains encoded control characters.",
        "high"
      )
    );
  }

  if (hasSuspiciousKeywords(pathAndQuery)) {
    reasons.push(
      getReason(
        LINK_REASON_CODE.SUSPICIOUS_KEYWORDS,
        "URL contains high-risk keywords such as login, verify, or payment.",
        "medium"
      )
    );
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    reasons.push(
      getReason(
        LINK_REASON_CODE.NONSTANDARD_PORT,
        `URL uses non-standard port ${url.port}.`,
        "medium"
      )
    );
  }

  return reasons;
}

function getAnalysisResult({
  normalizedUrl,
  host,
  reasons,
}: {
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly reasons: readonly LinkReason[];
}): LinkAnalysisResult {
  const riskScore = reasons.reduce(
    (sum, reason) => sum + getReasonRiskWeight(reason),
    0
  );
  const verdict = getVerdict(riskScore, reasons);

  return {
    verdict,
    confidence: getConfidence(verdict, riskScore),
    normalizedUrl,
    host,
    reasons,
    ssrfProtected: true,
  };
}

function getVerdict(
  riskScore: number,
  reasons: readonly LinkReason[]
): LinkVerdict {
  if (reasons.some((reason) => HARD_BLOCK_REASON_CODES.has(reason.code))) {
    return LINK_VERDICT.SUSPICIOUS;
  }

  if (riskScore >= 45) return LINK_VERDICT.SUSPICIOUS;
  if (riskScore > 0) return LINK_VERDICT.CAUTION;

  return LINK_VERDICT.SAFE;
}

function getConfidence(verdict: LinkVerdict, riskScore: number): number {
  if (verdict === LINK_VERDICT.SAFE) return 90;

  return Math.min(98, 55 + riskScore);
}

function getReasonRiskWeight(reason: LinkReason): number {
  if (reason.severity === "high") return 35;
  if (reason.severity === "medium") return 18;

  return 8;
}

function getReason(
  code: LinkReasonCode,
  message: string,
  severity: LinkReason["severity"]
): LinkReason {
  return { code, message, severity };
}

function isLocalhost(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost");
}

function isPrivateOrReservedIp(host: string): boolean {
  const ipVersion = isIP(host);
  if (ipVersion === 4) return isPrivateOrReservedIpv4(host);
  if (ipVersion === 6) return isPrivateOrReservedIpv6(host);

  return false;
}

function isPrivateOrReservedIpv4(host: string): boolean {
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }

  const [first, second, third, fourth] = octets;
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;
  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 100 && second >= 64 && second <= 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 192 && second === 0 && third === 0) return true;
  if (first === 198 && (second === 18 || second === 19)) return true;
  if (first >= 224) return true;
  if (first === 255 && second === 255 && third === 255 && fourth === 255) {
    return true;
  }

  return false;
}

function isPrivateOrReservedIpv6(host: string): boolean {
  const normalizedHost = host.toLowerCase();
  if (normalizedHost === "::" || normalizedHost === "::1") return true;
  if (normalizedHost.startsWith("fc") || normalizedHost.startsWith("fd")) {
    return true;
  }

  return /^fe[89ab]/.test(normalizedHost);
}

function stripIpv6Brackets(host: string): string {
  return host.replace(/^\[/, "").replace(/\]$/, "");
}

function getTld(host: string): string {
  const parts = host.split(".").filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
}

function hasSuspiciousKeywords(pathAndQuery: string): boolean {
  const lower = pathAndQuery.toLowerCase();

  return SUSPICIOUS_KEYWORDS.some((word) => lower.includes(word));
}

function looksLikeBrandSpoof(host: string): boolean {
  const lower = host.toLowerCase();

  return BRAND_LOOKALIKE_PATTERNS.some(
    (entry) =>
      entry.patterns.some((pattern) => lower.includes(pattern)) ||
      lower.includes(`${entry.brand}-secure`)
  );
}
