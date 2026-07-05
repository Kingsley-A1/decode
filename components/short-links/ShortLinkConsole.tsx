"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Skull,
  X,
} from "lucide-react";
import { Alert, Badge, Button, Dialog, Input, Skeleton } from "@/components/ui";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { useToolHistory } from "@/components/history/useToolHistory";
import type { ToolHistoryEntry } from "@/lib/history/types";

type Verdict = "safe" | "caution" | "suspicious" | "malicious";

interface VerifierSnapshot {
  readonly verdict: Verdict;
  readonly confidence: number;
  readonly signalCount: number;
  readonly sourceCount: number;
  readonly topConcerns: readonly string[];
}

interface ShortLinkSummary {
  readonly id: string;
  readonly slug: string;
  readonly shortUrl: string;
  readonly destinationUrl: string;
  readonly normalizedUrl: string;
  readonly status: string;
  readonly verdictAtCreate: string;
  readonly lastVerdict: string | null;
  readonly scanCount: number;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface CreateSuccess {
  readonly shortLink: ShortLinkSummary;
  readonly shortUrl: string;
  readonly verifier: VerifierSnapshot;
}

interface ApiSuccess<TData> {
  readonly ok: true;
  readonly data: TData;
}

interface ApiError {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly fields?: Readonly<Record<string, readonly string[]>>;
  };
}

type CreateResponse = ApiSuccess<CreateSuccess> | ApiError;
type ListResponse =
  | ApiSuccess<{
      readonly shortLinks: readonly ShortLinkSummary[];
      readonly nextCursor: string | null;
    }>
  | ApiError;

type CreateStatus = "idle" | "submitting" | "success" | "error";

interface ErrorState {
  readonly code: string;
  readonly message: string;
  readonly evidence: readonly string[];
  readonly httpStatus: number;
}

export function ShortLinkConsole() {
  const [url, setUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [acknowledgeChecked, setAcknowledgeChecked] = useState(false);
  const [status, setStatus] = useState<CreateStatus>("idle");
  const [result, setResult] = useState<CreateSuccess | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [copied, setCopied] = useState(false);

  const [recents, setRecents] = useState<readonly ShortLinkSummary[] | null>(
    null
  );
  const [recentsLoading, setRecentsLoading] = useState(true);
  const [anonymous, setAnonymous] = useState(false);

  const runIdRef = useRef(0);
  const inputLengthSnapshotRef = useRef(0);
  const localHistory = useToolHistory("shorten");

  const [manageError, setManageError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShortLinkSummary | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editAck, setEditAck] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditBusy, setIsEditBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ShortLinkSummary | null>(
    null
  );
  const [isDeleteBusy, setIsDeleteBusy] = useState(false);

  async function patchShortLink(
    id: string,
    body: Record<string, unknown>
  ): Promise<
    | { readonly ok: true; readonly shortLink: ShortLinkSummary }
    | { readonly ok: false; readonly message: string }
  > {
    try {
      const response = await fetch(
        `/api/short-links/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const payload = (await response.json().catch(() => null)) as
        | ApiSuccess<{ shortLink: ShortLinkSummary }>
        | ApiError
        | null;
      if (payload?.ok) {
        return { ok: true, shortLink: payload.data.shortLink };
      }

      return {
        ok: false,
        message:
          payload && !payload.ok
            ? payload.error.message
            : "Could not update this link.",
      };
    } catch {
      return {
        ok: false,
        message: "Could not reach Decode. Check your connection and try again.",
      };
    }
  }

  function replaceRecent(shortLink: ShortLinkSummary) {
    setRecents((current) =>
      current
        ? current.map((item) => (item.id === shortLink.id ? shortLink : item))
        : current
    );
  }

  async function handleToggleStatus(link: ShortLinkSummary) {
    setManageError(null);
    const nextStatus = link.status === "disabled" ? "active" : "disabled";
    const result = await patchShortLink(link.id, { status: nextStatus });

    if (result.ok) {
      replaceRecent(result.shortLink);
    } else {
      setManageError(result.message);
    }
  }

  function openEditDialog(link: ShortLinkSummary) {
    setEditing(link);
    setEditUrl(link.destinationUrl);
    setEditAck(false);
    setEditError(null);
  }

  async function handleEditSubmit() {
    if (!editing || !editUrl.trim()) return;

    setIsEditBusy(true);
    setEditError(null);
    const result = await patchShortLink(editing.id, {
      destinationUrl: editUrl.trim(),
      ...(editAck ? { acknowledgedSuspicious: true } : {}),
    });
    setIsEditBusy(false);

    if (result.ok) {
      replaceRecent(result.shortLink);
      setEditing(null);
    } else {
      setEditError(result.message);
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;

    setIsDeleteBusy(true);
    setManageError(null);
    try {
      const response = await fetch(
        `/api/short-links/${encodeURIComponent(pendingDelete.id)}`,
        { method: "DELETE" }
      );
      const payload = (await response.json().catch(() => null)) as
        | ApiSuccess<{ deleted: boolean }>
        | ApiError
        | null;

      if (payload?.ok) {
        setRecents((current) =>
          current
            ? current.filter((item) => item.id !== pendingDelete.id)
            : current
        );
        setPendingDelete(null);
      } else {
        setManageError(
          payload && !payload.ok
            ? payload.error.message
            : "Could not delete this link."
        );
        setPendingDelete(null);
      }
    } catch {
      setManageError(
        "Could not reach Decode. Check your connection and try again."
      );
      setPendingDelete(null);
    } finally {
      setIsDeleteBusy(false);
    }
  }

  async function fetchRecents() {
    setRecentsLoading(true);
    try {
      const response = await fetch("/api/short-links?take=10");
      if (response.status === 401) {
        setAnonymous(true);
        setRecents(null);
        return;
      }
      const payload = (await response.json()) as ListResponse;
      if (payload.ok) {
        setAnonymous(false);
        setRecents(payload.data.shortLinks);
      } else {
        setRecents([]);
      }
    } catch {
      setRecents([]);
    } finally {
      setRecentsLoading(false);
    }
  }

  useEffect(() => {
    // Defer the auth probe + list fetch so the mount commit has no chance to
    // trigger the cascading-render lint rule (same pattern as the verifier).
    const timer = setTimeout(() => {
      void fetchRecents();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    const runId = ++runIdRef.current;
    inputLengthSnapshotRef.current = trimmed.length;
    setStatus("submitting");
    setError(null);
    setResult(null);
    setCopied(false);

    let response: Response;
    try {
      response = await fetch("/api/short-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          expiresAt: expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
          acknowledgedSuspicious: acknowledgeChecked ? true : undefined,
        }),
      });
    } catch {
      if (runId !== runIdRef.current) return;
      setStatus("error");
      setError({
        code: "NETWORK_ERROR",
        message: "Could not reach Decode. Check your connection and try again.",
        evidence: [],
        httpStatus: 0,
      });
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | CreateResponse
      | null;
    if (runId !== runIdRef.current) return;

    if (payload && payload.ok) {
      setResult(payload.data);
      setStatus("success");
      setAcknowledgeChecked(false);
      localHistory.append({
        id: payload.data.shortLink.id,
        title: payload.data.shortUrl,
        subtitle: payload.data.shortLink.destinationUrl,
        dedupeKey: payload.data.shortLink.id,
      });
      // Prepend the new link to recents so the table reflects it instantly.
      if (!anonymous) {
        setRecents((current) =>
          current ? [payload.data.shortLink, ...current].slice(0, 10) : null
        );
      }
      return;
    }

    setStatus("error");
    setError({
      code: payload && !payload.ok ? payload.error.code : "UNKNOWN",
      message:
        payload && !payload.ok
          ? payload.error.message
          : "Could not shorten this link.",
      evidence:
        payload && !payload.ok
          ? (payload.error.fields?.evidenceSummary ?? [])
          : [],
      httpStatus: response.status,
    });
  }

  function handleClear() {
    runIdRef.current += 1;
    setUrl("");
    setExpiresAt("");
    setAcknowledgeChecked(false);
    setStatus("idle");
    setResult(null);
    setError(null);
    setCopied(false);
  }

  async function handleCopyShortUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleCopyOriginal() {
    if (!url.trim()) return;
    await navigator.clipboard.writeText(url.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const compression =
    result &&
    getCompressionRatio(
      inputLengthSnapshotRef.current || url.length,
      result.shortUrl.length
    );
  const requiresOverride = error?.code === "SHORT_LINK_REQUIRES_OVERRIDE";

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <Input
          label="Long URL"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/very/long/path?with=parameters"
          leftIcon={<LinkIcon className="h-4 w-4" aria-hidden="true" />}
          hint="Decode runs the verifier on every URL before issuing a short link. Malicious destinations are refused."
        />
        <Input
          label="Expires (optional)"
          type="datetime-local"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          hint="After this moment the short link returns a Decode-branded expired page instead of resolving."
        />
        {requiresOverride && (
          <OverridePrompt
            message={error.message}
            evidence={error.evidence}
            checked={acknowledgeChecked}
            onChange={setAcknowledgeChecked}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={
              status === "submitting" ||
              !url.trim() ||
              (requiresOverride && !acknowledgeChecked)
            }
            isLoading={status === "submitting"}
            leftIcon={<Scissors className="h-4 w-4" aria-hidden="true" />}
          >
            {requiresOverride ? "Shorten anyway" : "Shorten link"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClear}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyOriginal}
            disabled={!url.trim()}
            leftIcon={<Copy className="h-4 w-4" aria-hidden="true" />}
          >
            {copied ? "Copied" : "Copy original"}
          </Button>
        </div>
      </form>

      <section className="space-y-4" aria-live="polite">
        {status === "submitting" && <SubmittingSkeleton />}

        {status === "success" && result && (
          <SuccessPanel
            result={result}
            compression={compression}
            copied={copied}
            onCopy={handleCopyShortUrl}
          />
        )}

        {status === "error" && error && !requiresOverride && (
          <ErrorPanel error={error} onCopyOriginal={handleCopyOriginal} />
        )}
      </section>

      <div className="space-y-3">
        {manageError && <Alert variant="danger">{manageError}</Alert>}
        <RecentLinksPanel
          recents={recents}
          loading={recentsLoading}
          anonymous={anonymous}
          localEntries={localHistory.entries}
          onClearLocal={localHistory.clear}
          onEdit={openEditDialog}
          onToggleStatus={(link) => void handleToggleStatus(link)}
          onDelete={setPendingDelete}
        />
      </div>

      <Dialog
        open={editing !== null}
        title="Edit destination"
        description="The short link stays the same; scans redirect to the new destination after it passes verification."
        onClose={() => setEditing(null)}
      >
        <div className="space-y-4">
          <Input
            label="New destination URL"
            value={editUrl}
            onChange={(event) => setEditUrl(event.target.value)}
            placeholder="https://example.com/next"
          />
          {editError && <Alert variant="danger">{editError}</Alert>}
          {editError && (
            <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={editAck}
                onChange={(event) => setEditAck(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              I understand the warning and want to use this destination anyway.
            </label>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleEditSubmit()}
              disabled={!editUrl.trim()}
              isLoading={isEditBusy}
            >
              Save destination
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        title="Delete short link?"
        description="The link stops resolving immediately. This cannot be undone from the console."
        onClose={() => setPendingDelete(null)}
      >
        <div className="space-y-4">
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {pendingDelete?.shortUrl}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep link
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDeleteConfirm()}
              isLoading={isDeleteBusy}
            >
              Delete link
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function OverridePrompt({
  message,
  evidence,
  checked,
  onChange,
}: {
  readonly message: string;
  readonly evidence: readonly string[];
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-amber-900">{message}</p>
          {evidence.length > 0 && (
            <ul className="space-y-1 text-sm text-amber-900">
              {evidence.map((line) => (
                <li key={line} className="break-words">
                  · {line}
                </li>
              ))}
            </ul>
          )}
          <label className="mt-2 flex items-start gap-2 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => onChange(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-600"
            />
            <span>
              I understand the risk and want to issue a short link anyway. An
              authenticated session is required for the override to take
              effect.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function SuccessPanel({
  result,
  compression,
  copied,
  onCopy,
}: {
  readonly result: CreateSuccess;
  readonly compression: string | null;
  readonly copied: boolean;
  readonly onCopy: () => void;
}) {
  const tone = getVerdictTone(result.verifier.verdict);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2
            className="h-5 w-5 text-emerald-600"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-slate-950">
            Short link ready
          </h2>
        </div>
        <Badge variant={tone.variant} icon={tone.icon}>
          {tone.label}
        </Badge>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Short URL
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-base font-semibold text-sky-800 underline-offset-2 hover:underline"
          >
            {result.shortUrl}
          </a>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onCopy}
              leftIcon={<Copy className="h-4 w-4" aria-hidden="true" />}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                window.open(result.shortUrl, "_blank", "noopener,noreferrer")
              }
              leftIcon={
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              }
            >
              Open
            </Button>
          </div>
        </div>
        {compression && (
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold text-emerald-700">{compression}</span>{" "}
            than your original URL.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FactRow label="Destination">
          <span className="break-all">{result.shortLink.destinationUrl}</span>
        </FactRow>
        <FactRow label="Confidence">
          {result.verifier.confidence}% · {result.verifier.signalCount} signals
          across {result.verifier.sourceCount} sources
        </FactRow>
      </div>

      {result.verifier.topConcerns.length > 0 && (
        <Alert variant="warning">
          <span className="font-semibold">Verifier flagged:</span>{" "}
          {result.verifier.topConcerns.join(" · ")}
        </Alert>
      )}
    </div>
  );
}

function ErrorPanel({
  error,
  onCopyOriginal,
}: {
  readonly error: ErrorState;
  readonly onCopyOriginal: () => void;
}) {
  if (error.code === "URL_ALREADY_SHORT") {
    return (
      <Alert variant="info">
        <div className="space-y-2">
          <p className="font-semibold">
            This URL is already short — Decode will not shorten it.
          </p>
          <p>
            A Decode short link is only useful when it compresses the
            original by at least 3×. Use the original URL as-is.
          </p>
          <Button
            variant="secondary"
            onClick={onCopyOriginal}
            leftIcon={<Copy className="h-4 w-4" aria-hidden="true" />}
          >
            Copy original
          </Button>
        </div>
      </Alert>
    );
  }

  if (error.code === "SHORT_LINK_BLOCKED") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Skull
            className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="text-base font-semibold text-red-900">
              Decode refused to shorten this link.
            </p>
            <p className="text-sm text-red-900">{error.message}</p>
            {error.evidence.length > 0 && (
              <ul className="space-y-1 text-sm text-red-900">
                {error.evidence.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error.httpStatus === 429) {
    return (
      <Alert variant="warning">
        You are sending requests too fast. Wait a moment and try again.
      </Alert>
    );
  }

  if (error.code === "UNAUTHENTICATED" || error.httpStatus === 401) {
    return (
      <Alert variant="info">
        Sign in to attach a short link to a workspace, or remove the workspace
        field to issue an anonymous link.
      </Alert>
    );
  }

  if (error.code === "WORKSPACE_ACCESS_DENIED") {
    return (
      <Alert variant="danger">
        You do not have access to that workspace.
      </Alert>
    );
  }

  return (
    <Alert variant="danger">
      {error.message ||
        "Could not shorten this link. Please try again in a moment."}
    </Alert>
  );
}

function RecentLinksPanel({
  recents,
  loading,
  anonymous,
  localEntries,
  onClearLocal,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  readonly recents: readonly ShortLinkSummary[] | null;
  readonly loading: boolean;
  readonly anonymous: boolean;
  readonly localEntries: readonly ToolHistoryEntry[];
  readonly onClearLocal: () => void;
  readonly onEdit: (link: ShortLinkSummary) => void;
  readonly onToggleStatus: (link: ShortLinkSummary) => void;
  readonly onDelete: (link: ShortLinkSummary) => void;
}) {
  if (anonymous) {
    // Anonymous visitors get a device-local history; before the first link
    // exists, the section explains what signing in adds.
    if (localEntries.length > 0) {
      return (
        <HistoryPanel
          title="Your short links"
          entries={localEntries}
          source="local"
          description="Links created on this device."
          onClear={onClearLocal}
          footer={
            <p className="mt-3 text-xs leading-5 text-slate-500">
              This history lives in this browser. Sign in to track
              destinations, scan counts, and verdict history in your
              workspace.
            </p>
          }
        />
      );
    }

    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Your short links
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Sign in to track the links you create — destination, scan counts,
          and verdict history will appear here once you are authenticated.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Recent short links
      </h2>
      {loading && (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {!loading && (!recents || recents.length === 0) && (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nothing yet. Your most recent ten short links will appear here.
        </p>
      )}
      {!loading && recents && recents.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {recents.map((link) => (
            <RecentLinkRow
              key={link.id}
              link={link}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentLinkRow({
  link,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  readonly link: ShortLinkSummary;
  readonly onEdit: (link: ShortLinkSummary) => void;
  readonly onToggleStatus: (link: ShortLinkSummary) => void;
  readonly onDelete: (link: ShortLinkSummary) => void;
}) {
  const tone = getVerdictTone(
    (link.lastVerdict || link.verdictAtCreate) as Verdict
  );
  const isFlagged = link.status === "flagged";
  const isDisabled = link.status === "disabled";

  return (
    <li className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all text-sm font-semibold text-sky-800 underline-offset-2 hover:underline"
          >
            {link.shortUrl}
          </a>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            → {link.destinationUrl}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <Badge variant={tone.variant} icon={tone.icon}>
            {tone.label}
          </Badge>
          {isFlagged && <Badge variant="danger">Flagged</Badge>}
          {isDisabled && <Badge variant="neutral">Disabled</Badge>}
          <span>
            {link.scanCount} scan{link.scanCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(link)}>
          Edit destination
        </Button>
        {!isFlagged && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus(link)}
          >
            {isDisabled ? "Enable" : "Disable"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onDelete(link)}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function FactRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-800">{children}</p>
    </div>
  );
}

function SubmittingSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-sky-700">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Verifying and shortening…
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  );
}

function getVerdictTone(verdict: Verdict | string): {
  readonly label: string;
  readonly variant: "success" | "warning" | "danger";
  readonly icon: ReactNode;
} {
  if (verdict === "safe") {
    return {
      label: "Looks safe",
      variant: "success",
      icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
    };
  }
  if (verdict === "caution") {
    return {
      label: "Use caution",
      variant: "warning",
      icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
    };
  }
  if (verdict === "suspicious") {
    return {
      label: "Suspicious",
      variant: "danger",
      icon: <ShieldX className="h-4 w-4" aria-hidden="true" />,
    };
  }
  if (verdict === "malicious") {
    return {
      label: "Malicious",
      variant: "danger",
      icon: <Skull className="h-4 w-4" aria-hidden="true" />,
    };
  }

  return {
    label: verdict,
    variant: "warning",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
  };
}

function getCompressionRatio(
  longLength: number,
  shortLength: number
): string | null {
  if (longLength <= 0 || shortLength <= 0) return null;
  const ratio = longLength / shortLength;
  if (ratio < 1) return null;

  return `${ratio.toFixed(1)}× shorter`;
}
