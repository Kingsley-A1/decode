import type { ToolHistoryEntry, ToolHistoryTool } from "@/lib/history/types";

// Device-local history for the public tool pages. Anonymous users keep their
// recent activity across reloads without an account; the versioned key format
// mirrors the generator's auth-draft key (`decode:qr-generator:auth-draft:v1`).
const STORAGE_KEY_PREFIX = "decode:history:";
const STORAGE_KEY_VERSION = "v1";
export const TOOL_HISTORY_LIMIT = 20;

export function getToolHistoryStorageKey(tool: ToolHistoryTool): string {
  return `${STORAGE_KEY_PREFIX}${tool}:${STORAGE_KEY_VERSION}`;
}

export function readToolHistory(
  tool: ToolHistoryTool
): readonly ToolHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getToolHistoryStorageKey(tool));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is ToolHistoryEntry => isValidEntry(item, tool))
      .slice(0, TOOL_HISTORY_LIMIT);
  } catch {
    // Corrupt JSON or storage access failure (private mode) — start fresh.
    return [];
  }
}

export function appendToolHistory(
  entry: ToolHistoryEntry
): readonly ToolHistoryEntry[] {
  const current = readToolHistory(entry.tool);
  const dedupeKey = entry.dedupeKey ?? entry.id;
  const next = [
    entry,
    ...current.filter(
      (item) => item.id !== entry.id && (item.dedupeKey ?? item.id) !== dedupeKey
    ),
  ].slice(0, TOOL_HISTORY_LIMIT);

  writeToolHistory(entry.tool, next);

  return next;
}

export function clearToolHistory(tool: ToolHistoryTool): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getToolHistoryStorageKey(tool));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

function writeToolHistory(
  tool: ToolHistoryTool,
  entries: readonly ToolHistoryEntry[]
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getToolHistoryStorageKey(tool),
      JSON.stringify(entries)
    );
  } catch {
    // Quota exceeded or private mode — history simply stays session-only.
  }
}

function isValidEntry(item: unknown, tool: ToolHistoryTool): boolean {
  if (typeof item !== "object" || item === null) return false;

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    candidate.tool === tool &&
    typeof candidate.at === "string" &&
    typeof candidate.title === "string" &&
    candidate.title.length > 0
  );
}
