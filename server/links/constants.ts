export const LINK_VERDICT = {
  SAFE: "safe",
  CAUTION: "caution",
  SUSPICIOUS: "suspicious",
} as const;

export const LINK_REASON_CODE = {
  BRAND_SPOOF: "brand_spoof",
  ENCODED_CONTROL_CHARS: "encoded_control_chars",
  EXCESSIVE_PATH_DEPTH: "excessive_path_depth",
  EXCESSIVE_SUBDOMAINS: "excessive_subdomains",
  LOCALHOST_HOST: "localhost_host",
  LONG_PATH: "long_path",
  MALFORMED_URL: "malformed_url",
  NONSTANDARD_PORT: "nonstandard_port",
  PRIVATE_NETWORK_HOST: "private_network_host",
  PUNYCODE_HOST: "punycode_host",
  RAW_IP_HOST: "raw_ip_host",
  RISKY_TLD: "risky_tld",
  SUSPICIOUS_CHARACTERS: "suspicious_characters",
  SUSPICIOUS_KEYWORDS: "suspicious_keywords",
  UNSUPPORTED_PROTOCOL: "unsupported_protocol",
  URL_CREDENTIALS: "url_credentials",
} as const;

export type LinkVerdict = (typeof LINK_VERDICT)[keyof typeof LINK_VERDICT];
export type LinkReasonCode =
  (typeof LINK_REASON_CODE)[keyof typeof LINK_REASON_CODE];
