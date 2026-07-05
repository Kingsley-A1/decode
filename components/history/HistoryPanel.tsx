"use client";

import type { ReactNode } from "react";
import { ExternalLink, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { ToolHistoryEntry } from "@/lib/history/types";
import type { ToolHistorySource } from "@/components/history/useToolHistory";

/**
 * Shared history section for the tool pages (Generate, Scan, Shorten,
 * Verify). Renders nothing until at least one entry exists; local histories
 * offer Clear, account histories link into the workspace.
 */
export function HistoryPanel({
  title,
  entries,
  source,
  description,
  onClear,
  onSelect,
  footer,
  maxVisible = 10,
}: {
  readonly title: string;
  readonly entries: readonly ToolHistoryEntry[];
  readonly source: ToolHistorySource;
  readonly description?: string;
  readonly onClear?: () => void;
  readonly onSelect?: (entry: ToolHistoryEntry) => void;
  readonly footer?: ReactNode;
  readonly maxVisible?: number;
}) {
  if (entries.length === 0) return null;

  return (
    <section
      aria-label={title}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {title}
        </h2>
        {source === "local" && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      )}
      <ul aria-live="polite" className="mt-3 grid gap-2">
        {entries.slice(0, maxVisible).map((entry) => (
          <li key={entry.id}>
            <HistoryRow entry={entry} onSelect={onSelect} />
          </li>
        ))}
      </ul>
      {footer}
    </section>
  );
}

function HistoryRow({
  entry,
  onSelect,
}: {
  readonly entry: ToolHistoryEntry;
  readonly onSelect?: (entry: ToolHistoryEntry) => void;
}) {
  const body = (
    <span className="flex min-w-0 flex-1 flex-col text-left">
      <span className="truncate text-sm font-medium text-slate-900">
        {entry.title}
      </span>
      <span className="truncate text-xs leading-5 text-slate-500">
        {entry.subtitle ? `${entry.subtitle} · ` : ""}
        {formatHistoryTime(entry.at)}
      </span>
    </span>
  );
  const rowClassName =
    "flex min-h-11 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors";
  const interactiveClassName =
    " hover:border-sky-300 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500";

  if (entry.href) {
    return (
      <Link href={entry.href} className={rowClassName + interactiveClassName}>
        {body}
        <ExternalLink
          className="h-4 w-4 shrink-0 text-slate-400"
          aria-hidden="true"
        />
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(entry)}
        className={rowClassName + interactiveClassName}
      >
        {body}
      </button>
    );
  }

  return <div className={rowClassName}>{body}</div>;
}

function formatHistoryTime(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "";

  const elapsedMs = Date.now() - timestamp;
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Date(timestamp).toLocaleDateString();
}
