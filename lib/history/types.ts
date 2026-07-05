export type ToolHistoryTool = "generate" | "scan" | "shorten" | "verify";

export interface ToolHistoryEntry {
  readonly id: string;
  readonly tool: ToolHistoryTool;
  /** ISO timestamp of when the action happened. */
  readonly at: string;
  readonly title: string;
  readonly subtitle?: string;
  /** Optional in-app link (e.g. a saved QR's dashboard page). */
  readonly href?: string;
  /**
   * When set, appending replaces any existing entry with the same key
   * (e.g. re-scanning the same value refreshes it instead of duplicating).
   */
  readonly dedupeKey?: string;
  readonly meta?: Readonly<Record<string, string>>;
}
