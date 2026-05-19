"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Link as LinkIcon,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
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

interface LinkReason {
  readonly code: string;
  readonly message: string;
  readonly severity: "low" | "medium" | "high";
}

interface LinkVerificationResult {
  readonly verdict: "safe" | "caution" | "suspicious";
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly reasons: readonly LinkReason[];
  readonly ssrfProtected: true;
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

export function SuspiciousLinkChecker() {
  const [input, setInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkVerificationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const normalizedUrl = result?.normalizedUrl ?? "";
  const verdictTone = result ? getVerdictTone(result.verdict) : null;
  const shouldConfirmOpen = result?.verdict === "caution" || result?.verdict === "suspicious";
  const reasonSummary = useMemo(() => getReasonSummary(result?.reasons ?? []), [result]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (!url) return;

    setInput(url);
    void handleCheckUrl(url);
  }, []);

  async function handleCheck(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await handleCheckUrl(input);
  }

  async function handleCheckUrl(value: string) {
    const url = value.trim();
    if (!url) return;

    setHasChecked(true);
    setIsChecking(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/links/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json()) as LinkVerifyResponse;

      if (!payload.ok) throw new Error(payload.error.message);

      setResult(payload.data);
    } catch (checkError) {
      setError(
        checkError instanceof Error
          ? checkError.message
          : "Could not verify this link."
      );
    } finally {
      setIsChecking(false);
    }
  }

  function handleClear() {
    setInput("");
    setHasChecked(false);
    setError(null);
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Server-backed link verification
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Normalize a destination URL, run Decode&apos;s server-side checks,
              and require confirmation for risky opens.
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-sky-700" aria-hidden="true" />
        </div>

        <form
          onSubmit={handleCheck}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <Input
            label="Link to verify"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://example.com/login"
            leftIcon={<LinkIcon className="h-4 w-4" aria-hidden="true" />}
            hint="URLs from scanner results can be verified here before opening."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isChecking || !input.trim()}
              isLoading={isChecking}
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
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-live="polite"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Verdict details
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Status, confidence, normalized URL, reason codes, and cache
                metadata.
              </p>
            </div>
            {result && verdictTone && (
              <Badge variant={verdictTone.variant} icon={verdictTone.icon}>
                {verdictTone.label}
              </Badge>
            )}
          </div>

          {isChecking && <VerificationSkeleton />}

          {!isChecking && error && (
            <Alert className="mt-4" variant="danger">
              {error}
            </Alert>
          )}

          {!isChecking && !error && !result && (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <ShieldCheck
                className="mx-auto h-8 w-8 text-sky-700"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {hasChecked ? "Waiting for verdict" : "No verdict yet"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Paste a destination or arrive from the QR scanner to run a
                server-backed check.
              </p>
            </div>
          )}

          {!isChecking && result && verdictTone && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard label="Confidence" value={`${result.confidence}%`} />
                <MetricCard label="Host" value={result.host ?? "Unknown"} />
                <MetricCard
                  label="Verdict source"
                  value={result.cache.hit ? "Cached" : "Fresh"}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Normalized URL
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-slate-800">
                  {result.normalizedUrl ?? "Could not normalize this URL."}
                </p>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    Reason codes
                  </p>
                  <Badge variant="neutral">
                    {reasonSummary.high} high / {reasonSummary.medium} medium /{" "}
                    {reasonSummary.low} low
                  </Badge>
                </div>
                {result.reasons.length === 0 ? (
                  <Alert variant="success">
                    No obvious red flags were found. Continue to verify
                    unfamiliar destinations before sharing sensitive data.
                  </Alert>
                ) : (
                  <ul className="space-y-2">
                    {result.reasons.map((reason) => (
                      <li
                        key={reason.code}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getReasonVariant(reason.severity)}>
                            {reason.severity}
                          </Badge>
                          <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {reason.code}
                          </code>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {reason.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Alert
                variant="info"
                icon={<Info className="h-4 w-4" aria-hidden="true" />}
              >
                SSRF protected. Checked{" "}
                {result.cache.checkedAt
                  ? formatDateTime(result.cache.checkedAt)
                  : "without cache storage"}
                .
              </Alert>
            </div>
          )}
        </section>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Open policy
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Decode separates checking from opening so risky destinations never
            launch silently.
          </p>
          <div className="mt-4 space-y-3">
            <PolicyRow
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              title="Safe"
              text="Can be opened directly after the server verdict."
            />
            <PolicyRow
              icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
              title="Caution"
              text="Requires an explicit confirmation dialog."
            />
            <PolicyRow
              icon={<ShieldX className="h-4 w-4" aria-hidden="true" />}
              title="Suspicious"
              text="Requires confirmation and keeps reasons visible."
            />
          </div>
        </section>
      </aside>

      <Dialog
        open={isOpenDialogVisible}
        title="Open flagged link?"
        description="Decode found reasons to be cautious. Review the verdict before continuing."
        onClose={() => setIsOpenDialogVisible(false)}
      >
        <div className="space-y-4">
          {result && verdictTone && (
            <Badge variant={verdictTone.variant} icon={verdictTone.icon}>
              {verdictTone.label} - {result.confidence}% confidence
            </Badge>
          )}
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {normalizedUrl}
          </p>
          {result?.reasons.length ? (
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {result.reasons.slice(0, 3).map((reason) => (
                <li key={reason.code} className="flex gap-2">
                  <AlertTriangle
                    className="mt-1 h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  {reason.message}
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

function MetricCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PolicyRow({
  icon,
  title,
  text,
}: {
  readonly icon: React.ReactNode;
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
    <div className="mt-4 space-y-3" aria-label="Loading link verdict">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-16 w-2/3" />
    </div>
  );
}

function getVerdictTone(verdict: LinkVerificationResult["verdict"]) {
  if (verdict === "safe") {
    return {
      label: "Looks safe",
      variant: "success" as const,
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
    };
  }

  if (verdict === "caution") {
    return {
      label: "Use caution",
      variant: "warning" as const,
      icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
    };
  }

  return {
    label: "Suspicious",
    variant: "danger" as const,
    icon: <ShieldX className="h-4 w-4" aria-hidden="true" />,
  };
}

function getReasonVariant(
  severity: LinkReason["severity"]
): "neutral" | "warning" | "danger" {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warning";

  return "neutral";
}

function getReasonSummary(reasons: readonly LinkReason[]) {
  return reasons.reduce(
    (summary, reason) => ({
      ...summary,
      [reason.severity]: summary[reason.severity] + 1,
    }),
    { low: 0, medium: 0, high: 0 }
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
