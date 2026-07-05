import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  appendToolHistory,
  clearToolHistory,
  getToolHistoryStorageKey,
  readToolHistory,
  TOOL_HISTORY_LIMIT,
} from "@/lib/history/local-store";
import type { ToolHistoryEntry } from "@/lib/history/types";

// The suite runs in the node environment; the store only touches
// `window.localStorage`, so a Map-backed stub stands in for the browser.
function createLocalStorageStub() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  };
}

const globalWithWindow = globalThis as {
  window?: { localStorage: ReturnType<typeof createLocalStorageStub> };
};
globalWithWindow.window = { localStorage: createLocalStorageStub() };
const windowStub = globalWithWindow.window;

afterAll(() => {
  delete globalWithWindow.window;
});

function entry(overrides: Partial<ToolHistoryEntry> = {}): ToolHistoryEntry {
  return {
    id: "entry-1",
    tool: "scan",
    at: "2026-07-05T12:00:00.000Z",
    title: "https://example.com",
    ...overrides,
  };
}

describe("tool history local store", () => {
  beforeEach(() => {
    windowStub.localStorage.clear();
  });

  it("appends newest-first and reads back", () => {
    appendToolHistory(entry({ id: "a", title: "first" }));
    const entries = appendToolHistory(entry({ id: "b", title: "second" }));

    expect(entries.map((item) => item.id)).toEqual(["b", "a"]);
    expect(readToolHistory("scan").map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("caps the history at the limit", () => {
    for (let i = 0; i < TOOL_HISTORY_LIMIT + 5; i += 1) {
      appendToolHistory(entry({ id: `id-${i}` }));
    }

    const entries = readToolHistory("scan");

    expect(entries).toHaveLength(TOOL_HISTORY_LIMIT);
    expect(entries[0]?.id).toBe(`id-${TOOL_HISTORY_LIMIT + 4}`);
  });

  it("replaces entries sharing a dedupe key instead of duplicating", () => {
    appendToolHistory(
      entry({ id: "a", dedupeKey: "https://example.com", subtitle: "old" })
    );
    const entries = appendToolHistory(
      entry({ id: "b", dedupeKey: "https://example.com", subtitle: "new" })
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]?.subtitle).toBe("new");
  });

  it("keeps tools isolated from each other", () => {
    appendToolHistory(entry({ id: "scan-1", tool: "scan" }));
    appendToolHistory(entry({ id: "verify-1", tool: "verify" }));

    expect(readToolHistory("scan")).toHaveLength(1);
    expect(readToolHistory("verify")).toHaveLength(1);
    expect(readToolHistory("shorten")).toHaveLength(0);
  });

  it("recovers from corrupt stored JSON", () => {
    window.localStorage.setItem(getToolHistoryStorageKey("scan"), "{not json");

    expect(readToolHistory("scan")).toEqual([]);
    expect(appendToolHistory(entry())).toHaveLength(1);
  });

  it("drops malformed entries on read", () => {
    window.localStorage.setItem(
      getToolHistoryStorageKey("scan"),
      JSON.stringify([
        { id: "ok", tool: "scan", at: "2026-07-05", title: "keep" },
        { id: "", tool: "scan", at: "2026-07-05", title: "no id" },
        { id: "wrong-tool", tool: "verify", at: "2026-07-05", title: "x" },
        "not-an-object",
      ])
    );

    const entries = readToolHistory("scan");

    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe("ok");
  });

  it("clears a single tool's history", () => {
    appendToolHistory(entry({ id: "scan-1", tool: "scan" }));
    appendToolHistory(entry({ id: "verify-1", tool: "verify" }));

    clearToolHistory("scan");

    expect(readToolHistory("scan")).toEqual([]);
    expect(readToolHistory("verify")).toHaveLength(1);
  });
});
