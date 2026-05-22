import "server-only";

import { connect, type PeerCertificate, type TLSSocket } from "node:tls";

// Inspects the TLS peer certificate of a host:port without trusting the
// system CA bundle to *block* connections. We deliberately use
// `rejectUnauthorized: false` so that a self-signed or expired cert
// completes the handshake — letting us report on it rather than fail
// silently. The probe layer maps the inspection result to evidence.
//
// Phase C scope: extract issuer / subject / validity dates, derive
// self-signed and hostname-match flags. No chain validation beyond
// what `authorized` already gives us. Deep PKI inspection is out of
// scope until a future phase needs it.

export interface TlsInspectionResult {
  readonly issuer: string;
  readonly subject: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly daysToExpiry: number;
  readonly selfSigned: boolean;
  readonly hostnameMatches: boolean;
  /** True if Node's default CA chain validation accepted the peer. */
  readonly chainAuthorized: boolean;
  readonly error: string | null;
}

export type TlsConnectImpl = typeof connect;

export interface TlsInspectOptions {
  readonly host: string;
  readonly port?: number;
  readonly servername?: string;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  readonly connectImpl?: TlsConnectImpl;
}

const DEFAULT_TIMEOUT_MS = 2000;

export async function inspectTls(
  options: TlsInspectOptions
): Promise<TlsInspectionResult> {
  const port = options.port ?? 443;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? Date.now;
  const connectImpl = options.connectImpl ?? connect;
  const servername = options.servername ?? options.host;

  return new Promise<TlsInspectionResult>((resolve) => {
    let settled = false;

    const socket: TLSSocket = connectImpl({
      host: options.host,
      port,
      servername,
      rejectUnauthorized: false,
      ALPNProtocols: ["http/1.1"],
    });

    const finish = (result: TlsInspectionResult) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        // best effort
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish(getErrorResult("timeout"));
    }, timeoutMs);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const cert = socket.getPeerCertificate(true);

      if (!cert || Object.keys(cert).length === 0) {
        finish(getErrorResult("no_peer_certificate"));
        return;
      }

      finish(buildInspectionResult(cert, options.host, socket.authorized, now));
    });

    socket.once("error", (error) => {
      clearTimeout(timer);
      finish(getErrorResult(getSafeMessage(error)));
    });
  });
}

function buildInspectionResult(
  cert: PeerCertificate,
  host: string,
  chainAuthorized: boolean,
  now: () => number
): TlsInspectionResult {
  const issuer = formatDistinguishedName(cert.issuer);
  const subject = formatDistinguishedName(cert.subject);
  const validToTs = parseCertDate(cert.valid_to);
  const daysToExpiry = validToTs
    ? Math.floor((validToTs - now()) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    issuer,
    subject,
    validFrom: cert.valid_from ?? "",
    validTo: cert.valid_to ?? "",
    daysToExpiry,
    selfSigned: isSelfSigned(cert),
    hostnameMatches: hostMatchesCert(host, cert),
    chainAuthorized,
    error: null,
  };
}

function getErrorResult(message: string): TlsInspectionResult {
  return {
    issuer: "",
    subject: "",
    validFrom: "",
    validTo: "",
    daysToExpiry: 0,
    selfSigned: false,
    hostnameMatches: false,
    chainAuthorized: false,
    error: message,
  };
}

function formatDistinguishedName(
  dn: PeerCertificate["issuer"] | PeerCertificate["subject"] | undefined
): string {
  if (!dn) return "";
  const dnRecord = dn as unknown as Record<string, string | undefined>;
  const parts: string[] = [];
  for (const key of ["CN", "O", "OU", "C"] as const) {
    const value = dnRecord[key];
    if (value) parts.push(`${key}=${value}`);
  }

  return parts.join(", ");
}

function parseCertDate(value: string | undefined): number | null {
  if (!value) return null;
  const ts = Date.parse(value);

  return Number.isNaN(ts) ? null : ts;
}

function isSelfSigned(cert: PeerCertificate): boolean {
  const issuerCn = (cert.issuer as unknown as Record<string, string | undefined>)
    ?.CN;
  const subjectCn = (
    cert.subject as unknown as Record<string, string | undefined>
  )?.CN;
  if (!issuerCn || !subjectCn) return false;

  return issuerCn === subjectCn;
}

export function hostMatchesCert(
  host: string,
  cert: PeerCertificate
): boolean {
  const normalizedHost = host.toLowerCase();
  const cn = (cert.subject as unknown as Record<string, string | undefined>)
    ?.CN;
  if (cn && hostMatchesName(normalizedHost, cn)) return true;

  const san = cert.subjectaltname;
  if (!san) return false;

  for (const entry of san.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed.startsWith("DNS:")) continue;
    if (hostMatchesName(normalizedHost, trimmed.slice(4))) return true;
  }

  return false;
}

function hostMatchesName(host: string, certName: string): boolean {
  const candidate = certName.toLowerCase();
  if (candidate === host) return true;

  if (!candidate.startsWith("*.")) return false;

  const suffix = candidate.slice(1); // ".example.com"
  if (!host.endsWith(suffix)) return false;

  // Wildcard matches exactly one label.
  const head = host.slice(0, -suffix.length);
  if (head.length === 0) return false;
  if (head.includes(".")) return false;

  return true;
}

function getSafeMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  return "tls_inspection_failed";
}
