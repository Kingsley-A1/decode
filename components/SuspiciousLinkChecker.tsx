"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Link as LinkIcon,
  Lock,
  Loader2,
  Server,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Skull,
  X,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  Input,
  Skeleton,
} from "@/components/ui";

type EvidenceSource =
  | "heuristic"
  | "dns"
  | "probe"
  | "tls"
  | "web_risk"
  | "threat_feed"
  | "cache";

type EvidenceSeverity = "info" | "low" | "medium" | "high" | "critical";

type Verdict = "safe" | "caution" | "suspicious" | "malicious";

interface Evidence {
  readonly code: string;
  readonly source: EvidenceSource;
  readonly severity: EvidenceSeverity;
  readonly message: string;
  readonly observedAt: string;
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}

interface ProbeTls {
  readonly issuer: string;
  readonly subject: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly daysToExpiry: number;
  readonly selfSigned: boolean;
  readonly hostnameMatches: boolean;
}

interface ProbeSummary {
  readonly initialUrl: string;
  readonly finalUrl: string;
  readonly redirectChain: readonly { readonly url: string; readonly status: number }[];
  readonly httpStatus: number | null;
  readonly contentType: string | null;
  readonly tls: ProbeTls | null;
  readonly durationMs: number;
  readonly truncated: boolean;
  readonly error: string | null;
}

interface LinkVerificationResult {
  readonly verdict: Verdict;
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly evidence: readonly Evidence[];
  readonly probe: ProbeSummary | null;
  readonly ssrfProtected: boolean;
  readonly cache: {
    readonly hit: boolean;
    readonly cacheable: boolean;
    readonly checkedAt: string | null;
    readonly expiresAt: string | null;
  };
}

interface ApiSuccess<TData> {
  readonly ok: true;
  readonly data: TData;
}

interface ApiError {
  readonly ok: false;
  readonly error: { readonly message: string };
}

type LinkVerifyResponse = ApiSuccess<LinkVerificationResult> | ApiError;

type CheckStatus =
  | "idle"
  | "checking-instant"
  | "checking-full"
  | "done"
  | "error";

export function SuspiciousLinkChecker() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deepCheckFailed, setDeepCheckFailed] = useState(false);
  const [result, setResult] = useState<LinkVerificationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const runIdRef = useRef(0);

  const normalizedUrl = result?.normalizedUrl ?? "";
  const verdictTone = result ? getVerdictTone(result.verdict) : null;
  const shouldConfirmOpen = result ? result.verdict !== "safe" : false;
  const isBusy = status === "checking-instant" || status === "checking-full";
  const groupedEvidence = useMemo(
    () => groupEvidenceBySource(result?.evidence ?? []),
    [result]
  );

  // Declared before the effect that calls it so the lint/compiler rules can
  // track it lexically.
  async function runCheck(value: string) {
    const url = value.trim();
    if (!url) return;

    setInput(value);
    const runId = ++runIdRef.current;
    setError(null);
    setDeepCheckFailed(false);
    setResult(null);
    setCopied(false);
    setIsOpenDialogVisible(false);
    setStatus("checking-instant");

    // Step 1 — instant heuristic-only verdict for an immediate first paint.
    let instant: LinkVerificationResult;
    try {
      instant = await verify(url, true);
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      setError(getErrorMessage(caught));
      setStatus("error");
      return;
    }
    if (runId !== runIdRef.current) return;
    setResult(instant);

    // A malformed URL has nothing more to learn from a network probe.
    if (!instant.normalizedUrl) {
      setStatus("done");
      return;
    }

    // Step 2 — full verdict with the network probe and threat intelligence.
    setStatus("checking-full");
    try {
      const full = await verify(url, false);
      if (runId !== runIdRef.current) return;
      setResult(full);
      setStatus("done");
    } catch {
      if (runId !== runIdRef.current) return;
      // Keep the instant verdict; surface the deep-check failure non-fatally.
      setDeepCheckFailed(true);
      setStatus("done");
    }
  }

  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("url");
    if (!url) return;

    // Auto-verify a deep-linked URL (e.g. handed off from the scanner).
    // Deferred to a later task so the verdict's state updates do not run
    // synchronously during the mount commit.
    const timer = setTimeout(() => void runCheck(url), 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await runCheck(input);
  }

  function handleClear() {
    runIdRef.current += 1;
    setInput("");
    setStatus("idle");
    setError(null);
    setDeepCheckFailed(false);
    setResult(null);
    setCopied(false);
    setIsOpenDialogVisible(false);
  }

  async function handleCopy() {
    const value = normalizedUrl || input.trim();
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function handleOpenRequest() {
    if (!normalizedUrl || !result) return;
    if (shouldConfirmOpen) {
      setIsOpenDialogVisible(true);
      return;
    }
    openVerifiedUrl();
  }

  function openVerifiedUrl() {
    if (!normalizedUrl) return;
    window.open(normalizedUrl, "_blank", "noopener,noreferrer");
    setIsOpenDialogVisible(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <Input
            label="Link to verify"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://example.com/login"
            leftIcon={<LinkIcon className="h-4 w-4" aria-hidden="true" />}
            hint="Decode normalizes the URL, runs heuristics, probes the destination, and checks threat intelligence before you open it."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isBusy || !input.trim()}
              isLoading={isBusy}
              leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            >
              Check link
            </Button>
            <Button
              variant="secondary"
              onClick={handleClear}
              leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
            >
              Clear
            </Button>
            <Button
              variant="secondary"
              onClick={handleCopy}
              disabled={!input.trim() && !normalizedUrl}
              leftIcon={<Copy className="h-4 w-4" aria-hidden="true" />}
            >
              {copied ? "Copied URL" : "Copy URL"}
            </Button>
            <Button
              variant={shouldConfirmOpen ? "danger" : "secondary"}
              onClick={handleOpenRequest}
              disabled={!normalizedUrl || !result}
              leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            >
              {shouldConfirmOpen ? "Open with caution" : "Open verified link"}
            </Button>
          </div>
        </form>

        <section
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-live="polite"
        >
          {status === "checking-instant" && <VerificationSkeleton />}

          {status === "error" && error && (
            <Alert variant="danger">{error}</Alert>
          )}

          {status === "idle" && (
            <EmptyVerdict />
          )}

          {result && verdictTone && status !== "checking-instant" && (
            <div className="space-y-5">
              <VerdictHeader
                tone={verdictTone}
                result={result}
                isDeepRunning={status === "checking-full"}
              />

              {deepCheckFailed && (
                <Alert
                  variant="warning"
                  icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
                >
                  The deep network and threat-intelligence checks could not be
                  completed. The verdict below is based on URL heuristics only.
                </Alert>
              )}

              <NormalizedUrlRow result={result} />

              <EvidencePanel groups={groupedEvidence} />

              <ProbePanel
                probe={result.probe}
                isRunning={status === "checking-full"}
              />

              <TrustFooter result={result} />
            </div>
          )}
        </section>
      </section>

      <OpenPolicyAside />

      <Dialog
        open={isOpenDialogVisible}
        title="Open flagged link?"
        description="Decode found reasons to be cautious. Review the verdict before continuing."
        onClose={() => setIsOpenDialogVisible(false)}
      >
        <div className="space-y-4">
          {result && verdictTone && (
            <Badge variant={verdictTone.variant} icon={verdictTone.icon}>
              {verdictTone.label} · {result.confidence}% confidence
            </Badge>
          )}
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {normalizedUrl}
          </p>
          {result && getTopConcerns(result.evidence).length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {getTopConcerns(result.evidence).map((entry) => (
                <li key={`${entry.source}-${entry.code}`} className="flex gap-2">
                  <AlertTriangle
                    className="mt-1 h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  {entry.message}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsOpenDialogVisible(false)}
            >
              Stay here
            </Button>
            <Button
              variant="danger"
              onClick={openVerifiedUrl}
              leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            >
              Open anyway
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

async function verify(
  url: string,
  skipProbe: boolean
): Promise<LinkVerificationResult> {
  const response = await fetch("/api/links/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, skipProbe }),
  });
  const payload = (await response.json()) as LinkVerifyResponse;
  if (!payload.ok) throw new Error(payload.error.message);

  return payload.data;
}

function VerdictHeader({
  tone,
  result,
  isDeepRunning,
}: {
  readonly tone: VerdictTone;
  readonly result: LinkVerificationResult;
  readonly isDeepRunning: boolean;
}) {
  const sources = countSources(result.evidence);
  const signals = result.evidence.length;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant={tone.variant} icon={tone.icon}>
          {tone.label}
        </Badge>
        {isDeepRunning ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Running deep checks…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {result.cache.hit ? "Cached verdict" : "Fresh verdict"}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-slate-700">Confidence</p>
          <p className="text-sm font-semibold text-slate-950">
            {result.confidence}%
          </p>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={result.confidence}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Verdict confidence"
        >
          <div
            className={`h-full rounded-full ${tone.barClass}`}
            style={{ width: `${Math.max(4, result.confidence)}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {signals === 0
            ? "No signals collected yet."
            : `Based on ${signals} ${
                signals === 1 ? "signal" : "signals"
              } across ${sources} ${sources === 1 ? "source" : "sources"}.`}
        </p>
      </div>
    </div>
  );
}

function NormalizedUrlRow({
  result,
}: {
  readonly result: LinkVerificationResult;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Normalized URL
        </p>
        <p className="mt-1 break-all text-sm leading-6 text-slate-800">
          {result.normalizedUrl ?? "Could not normalize this URL."}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Host</p>
        <p className="mt-1 break-all text-sm leading-6 text-slate-800">
          {result.host ?? "Unknown"}
        </p>
      </div>
    </div>
  );
}

function EvidencePanel({
  groups,
}: {
  readonly groups: readonly EvidenceGroup[];
}) {
  if (groups.length === 0) {
    return (
      <Alert variant="success">
        No findings yet. Decode keeps checking unfamiliar destinations before
        you share sensitive data.
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-950">Evidence</p>
      {groups.map((group) => {
        const meta = SOURCE_META[group.source];
        return (
          <div
            key={group.source}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sky-700">{meta.icon}</span>
              <p className="text-sm font-semibold text-slate-900">
                {meta.label}
              </p>
              <span className="text-xs text-slate-400">
                {group.items.length}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {group.items.map((entry) => {
                const severity = getSeverityTone(entry.severity);
                return (
                  <li
                    key={`${entry.source}-${entry.code}`}
                    className="rounded-md border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={severity.variant}>{severity.label}</Badge>
                      <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">
                        {entry.code}
                      </code>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">
                      {entry.message}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ProbePanel({
  probe,
  isRunning,
}: {
  readonly probe: ProbeSummary | null;
  readonly isRunning: boolean;
}) {
  if (isRunning && !probe) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-700" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">Network probe</p>
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!probe) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700">Network probe</p>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          No network probe ran for this verdict.
        </p>
      </div>
    );
  }

  const redirected =
    probe.redirectChain.length > 1 || probe.finalUrl !== probe.initialUrl;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-700" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">Network probe</p>
        </div>
        <span className="text-xs text-slate-400">{probe.durationMs} ms</span>
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <ProbeField label="HTTP status">
          {probe.httpStatus ?? (probe.error ? "Unreachable" : "—")}
        </ProbeField>
        <ProbeField label="Content type">
          {probe.contentType ?? "—"}
        </ProbeField>
      </dl>

      {redirected && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Redirect chain
          </p>
          <ol className="mt-2 space-y-1">
            {probe.redirectChain.map((hop, index) => (
              <li
                key={`${hop.url}-${index}`}
                className="flex items-start gap-2 text-sm leading-6 text-slate-700"
              >
                <span className="mt-0.5 shrink-0 rounded bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
                  {hop.status}
                </span>
                <span className="break-all">{hop.url}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 break-all text-sm leading-6 text-slate-700">
            <span className="font-semibold text-slate-900">Final: </span>
            {probe.finalUrl}
          </p>
        </div>
      )}

      {probe.tls && <TlsRow tls={probe.tls} />}
    </div>
  );
}

function TlsRow({ tls }: { readonly tls: ProbeTls }) {
  const expiry =
    tls.daysToExpiry < 0
      ? "Expired"
      : `${tls.daysToExpiry} day${tls.daysToExpiry === 1 ? "" : "s"} left`;

  return (
    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-2.5">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-sky-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-900">TLS certificate</p>
      </div>
      <dl className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
        <ProbeField label="Issuer">{tls.issuer || "—"}</ProbeField>
        <ProbeField label="Expires">{expiry}</ProbeField>
        <ProbeField label="Hostname match">
          <BoolMark ok={tls.hostnameMatches} okText="Matches" badText="Mismatch" />
        </ProbeField>
        <ProbeField label="Self-signed">
          <BoolMark ok={!tls.selfSigned} okText="No" badText="Yes" />
        </ProbeField>
      </dl>
    </div>
  );
}

function ProbeField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-all text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function BoolMark({
  ok,
  okText,
  badText,
}: {
  readonly ok: boolean;
  readonly okText: string;
  readonly badText: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${
        ok ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {ok ? okText : badText}
    </span>
  );
}

function TrustFooter({ result }: { readonly result: LinkVerificationResult }) {
  return (
    <Alert
      variant="info"
      icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
    >
      {result.ssrfProtected
        ? "Verified with an SSRF-protected network probe."
        : "Heuristic-only verdict — no network probe was run for this URL."}
      {result.cache.checkedAt
        ? ` Checked ${formatDateTime(result.cache.checkedAt)}.`
        : ""}
    </Alert>
  );
}

function EmptyVerdict() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <ShieldCheck
        className="mx-auto h-8 w-8 text-sky-700"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-semibold text-slate-950">No verdict yet</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Paste a destination or arrive from the QR scanner to run a server-backed
        check.
      </p>
    </div>
  );
}

function OpenPolicyAside() {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Open policy</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Decode separates checking from opening so risky destinations never
          launch silently.
        </p>
        <div className="mt-4 space-y-3">
          <PolicyRow
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            title="Safe"
            text="Can be opened directly after the verdict."
          />
          <PolicyRow
            icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
            title="Caution"
            text="Requires an explicit confirmation dialog."
          />
          <PolicyRow
            icon={<ShieldX className="h-4 w-4" aria-hidden="true" />}
            title="Suspicious"
            text="Requires confirmation and keeps evidence visible."
          />
          <PolicyRow
            icon={<Skull className="h-4 w-4" aria-hidden="true" />}
            title="Malicious"
            text="Confirmed by threat intelligence. Opening is strongly discouraged."
          />
        </div>
      </section>
    </aside>
  );
}

function PolicyRow({
  icon,
  title,
  text,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className="mt-0.5 text-sky-700">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">
          {text}
        </span>
      </span>
    </div>
  );
}

function VerificationSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading link verdict">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

interface VerdictTone {
  readonly label: string;
  readonly variant: "success" | "warning" | "danger";
  readonly barClass: string;
  readonly icon: ReactNode;
}

function getVerdictTone(verdict: Verdict): VerdictTone {
  if (verdict === "safe") {
    return {
      label: "Looks safe",
      variant: "success",
      barClass: "bg-emerald-500",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
    };
  }
  if (verdict === "caution") {
    return {
      label: "Use caution",
      variant: "warning",
      barClass: "bg-amber-500",
      icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
    };
  }
  if (verdict === "suspicious") {
    return {
      label: "Suspicious",
      variant: "danger",
      barClass: "bg-red-500",
      icon: <ShieldX className="h-4 w-4" aria-hidden="true" />,
    };
  }

  return {
    label: "Malicious",
    variant: "danger",
    barClass: "bg-red-600",
    icon: <Skull className="h-4 w-4" aria-hidden="true" />,
  };
}

function getSeverityTone(severity: EvidenceSeverity): {
  readonly label: string;
  readonly variant: "neutral" | "info" | "success" | "warning" | "danger";
} {
  if (severity === "critical") return { label: "critical", variant: "danger" };
  if (severity === "high") return { label: "high", variant: "danger" };
  if (severity === "medium") return { label: "medium", variant: "warning" };
  if (severity === "low") return { label: "low", variant: "neutral" };

  // `info` severity is reserved for positive, corroborating signals.
  return { label: "clear", variant: "success" };
}

interface EvidenceGroup {
  readonly source: EvidenceSource;
  readonly items: readonly Evidence[];
}

const SOURCE_ORDER: readonly EvidenceSource[] = [
  "web_risk",
  "threat_feed",
  "probe",
  "tls",
  "dns",
  "heuristic",
  "cache",
];

const SOURCE_META: Readonly<
  Record<EvidenceSource, { readonly label: string; readonly icon: ReactNode }>
> = {
  heuristic: {
    label: "URL structure",
    icon: <LinkIcon className="h-4 w-4" aria-hidden="true" />,
  },
  dns: {
    label: "DNS",
    icon: <Server className="h-4 w-4" aria-hidden="true" />,
  },
  probe: {
    label: "Network probe",
    icon: <Globe className="h-4 w-4" aria-hidden="true" />,
  },
  tls: {
    label: "TLS certificate",
    icon: <Lock className="h-4 w-4" aria-hidden="true" />,
  },
  web_risk: {
    label: "Google Web Risk",
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
  },
  threat_feed: {
    label: "Threat feeds",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
  },
  cache: {
    label: "Cache",
    icon: <Clock className="h-4 w-4" aria-hidden="true" />,
  },
};

function groupEvidenceBySource(
  evidence: readonly Evidence[]
): readonly EvidenceGroup[] {
  const bySource = new Map<EvidenceSource, Evidence[]>();
  for (const entry of evidence) {
    const list = bySource.get(entry.source) ?? [];
    list.push(entry);
    bySource.set(entry.source, list);
  }

  return SOURCE_ORDER.filter((source) => bySource.has(source)).map(
    (source) => ({ source, items: bySource.get(source) ?? [] })
  );
}

function countSources(evidence: readonly Evidence[]): number {
  return new Set(evidence.map((entry) => entry.source)).size;
}

function getTopConcerns(evidence: readonly Evidence[]): readonly Evidence[] {
  const rank: Record<EvidenceSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  return [...evidence]
    .filter((entry) => entry.severity !== "info")
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .slice(0, 3);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not verify this link.";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
