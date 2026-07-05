"use client";

import { useCallback, useEffect, useState } from "react";
import {
  appendToolHistory,
  clearToolHistory,
  readToolHistory,
} from "@/lib/history/local-store";
import type { ToolHistoryEntry, ToolHistoryTool } from "@/lib/history/types";

export type ToolHistorySource = "local" | "account";

export interface ToolHistoryAppendInput {
  readonly title: string;
  readonly subtitle?: string;
  readonly href?: string;
  readonly dedupeKey?: string;
  readonly meta?: Readonly<Record<string, string>>;
  readonly id?: string;
  readonly at?: string;
}

export interface UseToolHistoryOptions {
  /**
   * Optional account-backed loader (e.g. saved QR codes from the workspace
   * API). When it resolves with entries, they replace the device-local list
   * and the source flips to "account"; on null or failure the local history
   * stays. The loader must handle its own auth check and be referentially
   * stable (a module-level function), or it will retrigger loads.
   */
  readonly loadAccountEntries?: () => Promise<
    readonly ToolHistoryEntry[] | null
  >;
}

export function useToolHistory(
  tool: ToolHistoryTool,
  options: UseToolHistoryOptions = {}
) {
  const [entries, setEntries] = useState<readonly ToolHistoryEntry[]>([]);
  const [source, setSource] = useState<ToolHistorySource>("local");
  const loadAccountEntries = options.loadAccountEntries;

  useEffect(() => {
    let isActive = true;

    // Deferred so the mount commit never sets state synchronously (same
    // pattern as the verifier and short-link console).
    const timer = setTimeout(() => {
      if (!isActive) return;

      setEntries(readToolHistory(tool));
      setSource("local");

      if (!loadAccountEntries) return;

      void (async () => {
        try {
          const accountEntries = await loadAccountEntries();
          if (isActive && accountEntries) {
            setEntries(accountEntries);
            setSource("account");
          }
        } catch {
          // Account load failed — the device-local history stays.
        }
      })();
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [tool, loadAccountEntries]);

  const append = useCallback(
    (input: ToolHistoryAppendInput) => {
      const entry: ToolHistoryEntry = {
        id: input.id ?? crypto.randomUUID(),
        tool,
        at: input.at ?? new Date().toISOString(),
        title: input.title,
        subtitle: input.subtitle,
        href: input.href,
        dedupeKey: input.dedupeKey,
        meta: input.meta,
      };
      const stored = appendToolHistory(entry);

      // Local source mirrors the store; an account-sourced list gets the new
      // action prepended immediately and refreshes fully on next load.
      setEntries((current) =>
        source === "account" ? [entry, ...current].slice(0, 20) : stored
      );

      return entry;
    },
    [tool, source]
  );

  const clear = useCallback(() => {
    clearToolHistory(tool);
    setEntries([]);
  }, [tool]);

  return { entries, source, append, clear };
}
