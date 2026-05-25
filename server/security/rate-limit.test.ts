import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/server/security/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = `test-${Math.random()}`;
    const options = { limit: 3, windowMs: 60_000 };
    const start = 1_000;

    expect(checkRateLimit(key, options, start).allowed).toBe(true);
    expect(checkRateLimit(key, options, start).allowed).toBe(true);
    expect(checkRateLimit(key, options, start).allowed).toBe(true);

    const blocked = checkRateLimit(key, options, start);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    const options = { limit: 1, windowMs: 1_000 };
    const start = 5_000;

    expect(checkRateLimit(key, options, start).allowed).toBe(true);
    expect(checkRateLimit(key, options, start).allowed).toBe(false);
    expect(checkRateLimit(key, options, start + 1_001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const options = { limit: 1, windowMs: 60_000 };
    const now = 9_000;

    expect(checkRateLimit("key-a", options, now).allowed).toBe(true);
    expect(checkRateLimit("key-b", options, now).allowed).toBe(true);
    expect(checkRateLimit("key-a", options, now).allowed).toBe(false);
  });
});
