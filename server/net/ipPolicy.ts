import { isIP } from "node:net";

// Phase A foundation. This module is the single source of truth for what
// counts as a "blockable" destination from the server. The link verifier
// and the SSRF-protected fetch wrapper both consume it. Logic is ported
// verbatim from the original `server/links/analysis.ts` heuristics so the
// existing verifier output does not change.

/** Returns true for hosts that resolve to the local machine by convention. */
export function isLocalhost(host: string): boolean {
  const lower = host.toLowerCase();
  return lower === "localhost" || lower.endsWith(".localhost");
}

/** Returns true if the given host is a literal IP and falls in a private,
 *  loopback, link-local, multicast, broadcast, or otherwise reserved range. */
export function isPrivateOrReservedIp(host: string): boolean {
  const ipVersion = isIP(host);
  if (ipVersion === 4) return isPrivateOrReservedIpv4(host);
  if (ipVersion === 6) return isPrivateOrReservedIpv6(host);

  return false;
}

/** Strips the surrounding `[` and `]` from a bracketed IPv6 hostname. */
export function stripIpv6Brackets(host: string): string {
  return host.replace(/^\[/, "").replace(/\]$/, "");
}

/** Returns true if the host is an IP literal in any form. */
export function isIpLiteral(host: string): boolean {
  return isIP(stripIpv6Brackets(host)) !== 0;
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
  const normalizedHost = stripIpv6Brackets(host).toLowerCase();
  if (normalizedHost === "::" || normalizedHost === "::1") return true;
  if (normalizedHost.startsWith("fc") || normalizedHost.startsWith("fd")) {
    return true;
  }

  return /^fe[89ab]/.test(normalizedHost);
}
