import "server-only";

import { lookup } from "node:dns/promises";
import {
  isIpLiteral,
  isLocalhost,
  isPrivateOrReservedIp,
  stripIpv6Brackets,
} from "@/server/net/ipPolicy";

// SSRF-protected fetch. Used by the link-verification probe (Phase C) and
// the threat-intel probes that follow. The verifier in Phase A does not
// call this yet — the module is kept dormant and tested in isolation so
// later phases can rely on it without surprises.
//
// Defense strategy:
//   1. Reject non-allowlisted protocols and ports.
//   2. Reject IP-literal hostnames that are private/reserved.
//   3. Resolve the hostname via DNS *before* the fetch. If any resolved
//      address is private/reserved/loopback/link-local, reject.
//   4. Enforce a hard request timeout via AbortController.
//   5. Cap the response body size by reading the stream chunk by chunk.
//
// TOCTOU caveat: between our DNS lookup and the fetch's own DNS lookup the
// authoritative server could return a different address (DNS rebinding).
// Mitigations for that live in the probe layer in Phase C (re-validating
// each redirect hop) rather than here.

export type SafeFetchMethod = "HEAD" | "GET";
export type SafeFetchProtocol = "http:" | "https:";

export const SAFE_FETCH_ERROR_CODE = {
  INVALID_URL: "invalid_url",
  PROTOCOL_NOT_ALLOWED: "protocol_not_allowed",
  PORT_NOT_ALLOWED: "port_not_allowed",
  METHOD_NOT_ALLOWED: "method_not_allowed",
  LOCALHOST_HOST: "localhost_host",
  IP_LITERAL_BLOCKED: "ip_literal_blocked",
  PRIVATE_NETWORK: "private_network",
  DNS_FAILED: "dns_failed",
  TIMEOUT: "timeout",
  ABORTED: "aborted",
  NETWORK_ERROR: "network_error",
} as const;

export type SafeFetchErrorCode =
  (typeof SAFE_FETCH_ERROR_CODE)[keyof typeof SAFE_FETCH_ERROR_CODE];

export interface DnsLookupAddress {
  readonly address: string;
  readonly family: 4 | 6;
}

export type SafeFetchDnsLookup = (
  host: string
) => Promise<readonly DnsLookupAddress[]>;

export interface SafeFetchOptions {
  readonly method?: SafeFetchMethod;
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
  readonly allowedProtocols?: readonly SafeFetchProtocol[];
  readonly allowedPorts?: readonly number[];
  readonly userAgent?: string;
  readonly signal?: AbortSignal;
  // Test seams — production callers should not pass these.
  readonly fetchImpl?: typeof fetch;
  readonly dnsLookup?: SafeFetchDnsLookup;
}

export interface SafeFetchResult {
  readonly url: string;
  readonly status: number;
  readonly headers: Headers;
  readonly contentType: string | null;
  readonly resolvedAddresses: readonly string[];
  readonly body: Uint8Array;
  readonly truncated: boolean;
  readonly durationMs: number;
}

export class SafeFetchError extends Error {
  readonly code: SafeFetchErrorCode;

  constructor(code: SafeFetchErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "SafeFetchError";
  }
}

const DEFAULT_TIMEOUT_MS = 4000;
const DEFAULT_MAX_BYTES = 64 * 1024;
const DEFAULT_PROTOCOLS: readonly SafeFetchProtocol[] = ["http:", "https:"];
const DEFAULT_PORTS: readonly number[] = [80, 443];
const DEFAULT_USER_AGENT = "DecodeLinkVerifier/1.0 (+https://decode.com.ng)";

export async function safeFetch(
  inputUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const url = parseUrlOrThrow(inputUrl);
  const method: SafeFetchMethod = options.method ?? "HEAD";
  const allowedProtocols = options.allowedProtocols ?? DEFAULT_PROTOCOLS;
  const allowedPorts = options.allowedPorts ?? DEFAULT_PORTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;
  const dnsLookup = options.dnsLookup ?? defaultDnsLookup;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  if (method !== "HEAD" && method !== "GET") {
    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.METHOD_NOT_ALLOWED,
      `HTTP method ${method} is not allowed.`
    );
  }

  if (!allowedProtocols.includes(url.protocol as SafeFetchProtocol)) {
    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.PROTOCOL_NOT_ALLOWED,
      `Protocol ${url.protocol} is not allowed.`
    );
  }

  const port = getEffectivePort(url);
  if (!allowedPorts.includes(port)) {
    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.PORT_NOT_ALLOWED,
      `Port ${port} is not allowed.`
    );
  }

  const hostname = stripIpv6Brackets(url.hostname);

  if (isLocalhost(hostname)) {
    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.LOCALHOST_HOST,
      "Localhost destinations cannot be fetched."
    );
  }

  if (isIpLiteral(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new SafeFetchError(
        SAFE_FETCH_ERROR_CODE.PRIVATE_NETWORK,
        "IP literal targets a private or reserved range."
      );
    }
    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.IP_LITERAL_BLOCKED,
      "URLs that use a raw IP literal are not allowed."
    );
  }

  const resolved = await resolveOrThrow(hostname, dnsLookup);

  for (const entry of resolved) {
    if (isPrivateOrReservedIp(entry.address)) {
      throw new SafeFetchError(
        SAFE_FETCH_ERROR_CODE.PRIVATE_NETWORK,
        `DNS for ${hostname} resolved to a private or reserved address.`
      );
    }
  }

  const controller = new AbortController();
  const onParentAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", onParentAbort, { once: true });
  const timer = setTimeout(() => {
    controller.abort(
      new SafeFetchError(SAFE_FETCH_ERROR_CODE.TIMEOUT, "Request timed out.")
    );
  }, timeoutMs);

  const startedAt = Date.now();

  try {
    const response = await fetchImpl(url.toString(), {
      method,
      headers: {
        "User-Agent": userAgent,
        Accept: "*/*",
        ...(options.headers ?? {}),
      },
      redirect: "manual",
      signal: controller.signal,
    });

    const { body, truncated } = await readCappedBody(
      response,
      method,
      maxResponseBytes
    );

    return {
      url: url.toString(),
      status: response.status,
      headers: response.headers,
      contentType: response.headers.get("content-type"),
      resolvedAddresses: resolved.map((r) => r.address),
      body,
      truncated,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;

    if (isAbortError(error)) {
      const reason = controller.signal.reason;
      if (reason instanceof SafeFetchError) throw reason;

      throw new SafeFetchError(
        SAFE_FETCH_ERROR_CODE.ABORTED,
        "Request was aborted."
      );
    }

    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.NETWORK_ERROR,
      getNetworkErrorMessage(error)
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onParentAbort);
  }
}

function parseUrlOrThrow(input: string): URL {
  try {
    return new URL(input);
  } catch {
    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.INVALID_URL,
      "URL could not be parsed."
    );
  }
}

function getEffectivePort(url: URL): number {
  if (url.port) return Number.parseInt(url.port, 10);

  return url.protocol === "https:" ? 443 : 80;
}

async function resolveOrThrow(
  hostname: string,
  dnsLookup: SafeFetchDnsLookup
): Promise<readonly DnsLookupAddress[]> {
  try {
    const addresses = await dnsLookup(hostname);
    if (addresses.length === 0) {
      throw new SafeFetchError(
        SAFE_FETCH_ERROR_CODE.DNS_FAILED,
        `Could not resolve ${hostname}.`
      );
    }

    return addresses;
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;

    throw new SafeFetchError(
      SAFE_FETCH_ERROR_CODE.DNS_FAILED,
      `DNS lookup failed for ${hostname}.`
    );
  }
}

async function defaultDnsLookup(
  host: string
): Promise<readonly DnsLookupAddress[]> {
  const records = await lookup(host, { all: true });

  return records.map((record) => ({
    address: record.address,
    family: record.family === 6 ? 6 : 4,
  }));
}

async function readCappedBody(
  response: Response,
  method: SafeFetchMethod,
  maxBytes: number
): Promise<{ readonly body: Uint8Array; readonly truncated: boolean }> {
  if (method === "HEAD" || !response.body) {
    return { body: new Uint8Array(), truncated: false };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;

  try {
    while (received < maxBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      const remaining = maxBytes - received;
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        received += remaining;
        truncated = true;
        break;
      }

      chunks.push(value);
      received += value.byteLength;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // best effort
    }
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { body, truncated };
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { readonly name?: unknown };
  return e.name === "AbortError";
}

function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  return "Network request failed.";
}
