"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Loader2,
  Pencil,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ApiCodeVariant {
  readonly id: string;
  readonly label: string;
  readonly language: string;
  readonly code: string;
}

export interface ApiRunRequest {
  readonly method: string;
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly credentials?: RequestCredentials;
}

interface ApiCodePanelProps {
  readonly code?: string;
  readonly label?: string;
  readonly language?: string;
  readonly variants?: readonly ApiCodeVariant[];
  readonly runRequest?: ApiRunRequest;
  readonly className?: string;
}

interface RunResult {
  readonly ok: boolean;
  readonly status: number;
  readonly durationMs: number;
  readonly body: string;
}

export function ApiCodePanel({
  code = "",
  label = "Code",
  language = "bash",
  variants,
  runRequest,
  className,
}: ApiCodePanelProps) {
  const codeVariants = useMemo(
    () =>
      variants?.length
        ? variants
        : [
            {
              id: "default",
              label: language.toUpperCase(),
              language,
              code,
            },
          ],
    [code, language, variants]
  );
  const [activeVariantId, setActiveVariantId] = useState(codeVariants[0].id);
  const [editedCodeById, setEditedCodeById] = useState<Record<string, string>>(
    {}
  );
  const [requestBodyText, setRequestBodyText] = useState(() =>
    formatEditableBody(runRequest?.body)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const activeVariant =
    codeVariants.find((variant) => variant.id === activeVariantId) ??
    codeVariants[0];
  const editableCode = editedCodeById[activeVariant.id] ?? activeVariant.code;
  const canEditRequestBody =
    Boolean(runRequest) &&
    runRequest?.body !== undefined &&
    typeof runRequest.body !== "string";
  const canEdit = canEditRequestBody || !runRequest;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      isEditing && !canEditRequestBody ? editableCode : activeVariant.code
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleEditToggle = () => {
    if (!canEdit) return;

    setIsEditing((value) => !value);
    setRunError(null);
  };

  const handleResetEdit = () => {
    if (canEditRequestBody) {
      setRequestBodyText(formatEditableBody(runRequest?.body));
      return;
    }

    setEditedCodeById((previous) => {
      const next = { ...previous };
      delete next[activeVariant.id];
      return next;
    });
  };

  const handleRun = async () => {
    if (!runRequest) return;

    setIsRunning(true);
    setRunError(null);
    setResult(null);

    const startedAt = performance.now();

    try {
      const headers = runRequest.headers ?? {};
      const requestBody = getRunnableRequestBody({
        runRequest,
        requestBodyText,
        canEditRequestBody,
      });
      const response = await fetch(runRequest.url, {
        method: runRequest.method,
        headers,
        credentials: runRequest.credentials,
        body:
          requestBody === undefined
            ? undefined
            : typeof requestBody === "string"
              ? requestBody
              : JSON.stringify(requestBody),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = contentType.includes("application/json")
        ? JSON.stringify(await response.json(), null, 2)
        : await response.text();

      setResult({
        ok: response.ok,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        body: rawBody.slice(0, 4000),
      });
    } catch (error) {
      setRunError(
        error instanceof Error ? error.message : "The request could not run."
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-sm",
        className
      )}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-50">{label}</p>
          <p className="text-xs uppercase tracking-normal text-slate-400">
            {activeVariant.language}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {codeVariants.length > 1 && (
            <div
              role="tablist"
              aria-label={`${label} language`}
              className="hidden rounded-lg border border-white/10 bg-white/5 p-0.5 sm:flex"
            >
              {codeVariants.map((variant) => {
                const isActive = variant.id === activeVariant.id;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveVariantId(variant.id)}
                    className={cn(
                      "min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                      isActive
                        ? "bg-sky-400/20 text-sky-100"
                        : "text-slate-300 hover:bg-white/10 hover:text-slate-50"
                    )}
                  >
                    {variant.label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={handleEditToggle}
            disabled={!canEdit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={isEditing ? "Close editor" : "Edit request"}
            title={isEditing ? "Close editor" : "Edit"}
          >
            {isEditing ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pencil className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label={copied ? "Code copied" : "Copy code"}
            title={copied ? "Copied" : "Copy"}
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Clipboard className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={!runRequest || isRunning}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={runRequest ? "Run request" : "Run unavailable"}
            title={
              runRequest
                ? "Run request"
                : "Run is available only for safe public examples"
            }
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Run</span>
          </button>
        </div>
      </div>

      {codeVariants.length > 1 && (
        <div
          role="tablist"
          aria-label={`${label} mobile language`}
          className="flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-900 px-3 py-2 sm:hidden"
        >
          {codeVariants.map((variant) => {
            const isActive = variant.id === activeVariant.id;

            return (
              <button
                key={variant.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveVariantId(variant.id)}
                className={cn(
                  "min-h-9 rounded-lg border px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  isActive
                    ? "border-sky-400/40 bg-sky-400/20 text-sky-100"
                    : "border-white/10 bg-white/5 text-slate-300"
                )}
              >
                {variant.label}
              </button>
            );
          })}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-300">
              {canEditRequestBody ? "Request body JSON" : "Editable code"}
            </p>
            <button
              type="button"
              onClick={handleResetEdit}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>
          <textarea
            aria-label={
              canEditRequestBody
                ? "Editable request body JSON"
                : "Editable code"
            }
            value={canEditRequestBody ? requestBodyText : editableCode}
            onChange={(event) => {
              if (canEditRequestBody) {
                setRequestBodyText(event.target.value);
                return;
              }

              setEditedCodeById((previous) => ({
                ...previous,
                [activeVariant.id]: event.target.value,
              }));
            }}
            spellCheck={false}
            className="min-h-64 w-full resize-y rounded-lg border border-white/10 bg-black/35 p-3 font-mono text-xs leading-6 text-slate-100 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          />
        </div>
      ) : (
        <pre
          tabIndex={0}
          className="max-h-[420px] overflow-x-auto p-4 text-xs leading-6 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <code>{activeVariant.code}</code>
        </pre>
      )}

      {(result || runError) && (
        <div className="border-t border-white/10 bg-slate-900/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              {result && (
                <>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-semibold",
                      result.ok
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-100"
                    )}
                  >
                    {result.status}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {result.durationMs}ms
                  </span>
                </>
              )}
              {runError && (
                <span className="text-sm leading-6 text-rose-200">
                  {runError}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setRunError(null);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Close run result"
              title="Close result"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {result && (
            <pre
              tabIndex={0}
              className="max-h-72 overflow-auto rounded-lg bg-black/35 p-3 text-xs leading-5 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <code>{result.body}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function getRunnableRequestBody({
  runRequest,
  requestBodyText,
  canEditRequestBody,
}: {
  readonly runRequest: ApiRunRequest;
  readonly requestBodyText: string;
  readonly canEditRequestBody: boolean;
}): unknown {
  if (!canEditRequestBody) return runRequest.body;

  try {
    return JSON.parse(requestBodyText);
  } catch {
    throw new Error("Fix the request body JSON before running this request.");
  }
}

function formatEditableBody(body: unknown): string {
  if (body === undefined) return "";
  if (typeof body === "string") return body;

  return JSON.stringify(body, null, 2);
}
