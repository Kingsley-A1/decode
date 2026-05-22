import "server-only";

import type {
  Evidence,
  ProbeSummary,
} from "@/server/links/evidence";

// Translates a ProbeSummary into structured Evidence entries that the
// scorer (Phase A) consumes. Pure function. Keeps the probe orchestrator
// free of verdict logic and keeps the evidence vocabulary in one place.

const KNOWN_URL_SHORTENER_HOSTS: ReadonlySet<string> = new Set([
  "bit.ly",
  "buff.ly",
  "cutt.ly",
  "goo.gl",
  "is.gd",
  "lnkd.in",
  "ow.ly",
  "rb.gy",
  "rebrand.ly",
  "shorturl.at",
  "t.co",
  "t.ly",
  "tiny.cc",
  "tinyurl.com",
  "trib.al",
  "v.gd",
]);

const EXECUTABLE_CONTENT_TYPES: readonly string[] = [
  "application/x-msdownload",
  "application/x-ms-installer",
  "application/x-msdos-program",
  "application/x-msi",
  "application/octet-stream",
  "application/vnd.microsoft.portable-executable",
  "application/x-sh",
  "application/x-shellscript",
];

const TLS_EXPIRY_WARN_DAYS = 14;

export function getProbeEvidence(probe: ProbeSummary): readonly Evidence[] {
  const observedAt = new Date().toISOString();
  const out: Evidence[] = [];

  if (probe.error) {
    out.push(getErrorEvidence(probe, observedAt));
    // When the probe could not complete, downstream signals are
    // unreliable. We still inspect anything we did manage to capture
    // (e.g. an early redirect chain) but skip status-based codes.
    out.push(...getRedirectChainEvidence(probe, observedAt));

    return out;
  }

  out.push(...getStatusEvidence(probe, observedAt));
  out.push(...getRedirectChainEvidence(probe, observedAt));
  out.push(...getContentTypeEvidence(probe, observedAt));
  out.push(...getTlsEvidence(probe, observedAt));

  return out;
}

function getErrorEvidence(probe: ProbeSummary, observedAt: string): Evidence {
  if (probe.error === "redirect_to_private_network") {
    return {
      code: "redirect_to_private_network",
      source: "probe",
      severity: "critical",
      message: "A redirect target pointed to a private or reserved network.",
      observedAt,
      data: { final_url: probe.finalUrl },
    };
  }

  if (probe.error === "too_many_redirects") {
    return {
      code: "probe_too_many_redirects",
      source: "probe",
      severity: "medium",
      message: "Redirect chain exceeded the verification limit.",
      observedAt,
      data: { hops: probe.redirectChain.length },
    };
  }

  return {
    code: "probe_unreachable",
    source: "probe",
    severity: "low",
    message: "Destination was not reachable during verification.",
    observedAt,
    data: { error: probe.error ?? "unknown_probe_error" },
  };
}

function getStatusEvidence(
  probe: ProbeSummary,
  observedAt: string
): readonly Evidence[] {
  const status = probe.httpStatus;
  if (status === null) return [];

  if (status >= 500) {
    return [
      {
        code: "probe_5xx",
        source: "probe",
        severity: "low",
        message: `Destination returned HTTP ${status}.`,
        observedAt,
        data: { http_status: status },
      },
    ];
  }

  if (status >= 400) {
    return [
      {
        code: "probe_4xx",
        source: "probe",
        severity: "low",
        message: `Destination returned HTTP ${status}.`,
        observedAt,
        data: { http_status: status },
      },
    ];
  }

  if (status >= 200 && status < 300) {
    return [
      {
        code: "probe_clean_response",
        source: "probe",
        severity: "info",
        message: "Destination responded successfully.",
        observedAt,
        data: { http_status: status },
      },
    ];
  }

  return [];
}

function getRedirectChainEvidence(
  probe: ProbeSummary,
  observedAt: string
): readonly Evidence[] {
  if (probe.redirectChain.length <= 1) return [];

  // Skip the initial hop — only intermediate / final hosts matter.
  for (const hop of probe.redirectChain.slice(1)) {
    const host = safeHostname(hop.url);
    if (!host) continue;

    if (KNOWN_URL_SHORTENER_HOSTS.has(host)) {
      return [
        {
          code: "redirect_to_url_shortener",
          source: "probe",
          severity: "medium",
          message: `Redirect chain routes through ${host}.`,
          observedAt,
          data: { shortener_host: host },
        },
      ];
    }
  }

  return [];
}

function getContentTypeEvidence(
  probe: ProbeSummary,
  observedAt: string
): readonly Evidence[] {
  if (!probe.contentType) return [];
  const lower = probe.contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!EXECUTABLE_CONTENT_TYPES.includes(lower)) return [];

  return [
    {
      code: "content_type_executable",
      source: "probe",
      severity: "high",
      message: "Destination serves a downloadable executable.",
      observedAt,
      data: { content_type: lower },
    },
  ];
}

function getTlsEvidence(
  probe: ProbeSummary,
  observedAt: string
): readonly Evidence[] {
  const tls = probe.tls;
  if (!tls) return [];

  const out: Evidence[] = [];

  if (tls.selfSigned) {
    out.push({
      code: "tls_self_signed",
      source: "tls",
      severity: "high",
      message: "TLS certificate is self-signed.",
      observedAt,
      data: { issuer: tls.issuer },
    });
  }

  if (tls.daysToExpiry < 0) {
    out.push({
      code: "tls_expired",
      source: "tls",
      severity: "high",
      message: "TLS certificate has expired.",
      observedAt,
      data: { valid_to: tls.validTo, days_to_expiry: tls.daysToExpiry },
    });
  }

  if (!tls.hostnameMatches) {
    out.push({
      code: "tls_hostname_mismatch",
      source: "tls",
      severity: "high",
      message: "TLS certificate does not cover the destination hostname.",
      observedAt,
      data: { subject: tls.subject },
    });
  }

  // tls_valid is a positive signal — emitted only when the cert is
  // present, not self-signed, not expired, hostname matches, and there
  // is reasonable time before expiry.
  if (
    !tls.selfSigned &&
    tls.daysToExpiry >= 0 &&
    tls.hostnameMatches
  ) {
    out.push({
      code: "tls_valid",
      source: "tls",
      severity: "info",
      message: "TLS certificate is valid for the destination.",
      observedAt,
      data: {
        issuer: tls.issuer,
        days_to_expiry: tls.daysToExpiry,
        expiring_soon: tls.daysToExpiry <= TLS_EXPIRY_WARN_DAYS,
      },
    });
  }

  return out;
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}
