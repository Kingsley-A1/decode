import { describe, expect, it, vi } from "vitest";
import {
  SHORT_LINK_BASE_PREFIX,
  SHORT_LINK_SLUG_ALPHABET,
  SHORT_LINK_SLUG_MAX_LENGTH,
  SHORT_LINK_SLUG_MIN_LENGTH,
  computeShortLinkLengthPolicy,
  getShortLinkUrl,
  isReservedShortLinkSlug,
  isValidShortLinkSlug,
  mintShortLinkSlug,
  normalizeShortLinkSlug,
  shortLinkSlugContainsBadWord,
} from "@/server/short-links/slugs";

const PUBLIC_BASE = "https://decode.com.ng";
const PUBLIC_PREFIX = `${PUBLIC_BASE}${SHORT_LINK_BASE_PREFIX}`;

describe("computeShortLinkLengthPolicy", () => {
  it("refuses to shorten URLs that are already short", () => {
    const result = computeShortLinkLengthPolicy({
      longUrlLength: 40,
      shortBaseLength: PUBLIC_PREFIX.length,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("url_already_short");
  });

  it("recommends a slug length that satisfies the 3x-shorter promise", () => {
    const longUrlLength = 200;
    const result = computeShortLinkLengthPolicy({
      longUrlLength,
      shortBaseLength: PUBLIC_PREFIX.length,
    });

    expect(result.ok).toBe(true);
    const fullShortLength = PUBLIC_PREFIX.length + result.recommendedSlugLength;
    expect(fullShortLength).toBeLessThanOrEqual(Math.floor(longUrlLength / 3));
    expect(result.recommendedSlugLength).toBeGreaterThanOrEqual(
      SHORT_LINK_SLUG_MIN_LENGTH
    );
    expect(result.recommendedSlugLength).toBeLessThanOrEqual(
      SHORT_LINK_SLUG_MAX_LENGTH
    );
  });

  it("never recommends a slug length below the floor", () => {
    const result = computeShortLinkLengthPolicy({
      longUrlLength: 1000,
      shortBaseLength: PUBLIC_PREFIX.length,
    });

    expect(result.recommendedSlugLength).toBeGreaterThanOrEqual(
      SHORT_LINK_SLUG_MIN_LENGTH
    );
  });
});

describe("isValidShortLinkSlug", () => {
  it("accepts a slug that uses only alphabet characters", () => {
    expect(isValidShortLinkSlug("aB3xK")).toBe(true);
  });

  it("rejects slugs that are too short or too long", () => {
    expect(isValidShortLinkSlug("aB")).toBe(false);
    expect(isValidShortLinkSlug("a".repeat(SHORT_LINK_SLUG_MAX_LENGTH + 1))).toBe(
      false
    );
  });

  it("rejects ambiguous characters and forbidden punctuation", () => {
    expect(isValidShortLinkSlug("Ill00")).toBe(false);
    expect(isValidShortLinkSlug("ab-cd")).toBe(false);
    expect(isValidShortLinkSlug("ab cd")).toBe(false);
  });

  it("rejects reserved slugs", () => {
    expect(isReservedShortLinkSlug("admin")).toBe(true);
    expect(isValidShortLinkSlug("admin")).toBe(false);
  });

  it("rejects slugs that contain a bad-word fragment", () => {
    expect(shortLinkSlugContainsBadWord("aBpornC")).toBe(true);
    expect(isValidShortLinkSlug("aBpornC")).toBe(false);
  });
});

describe("normalizeShortLinkSlug", () => {
  it("trims surrounding whitespace but preserves case", () => {
    expect(normalizeShortLinkSlug("  aB3xK  ")).toBe("aB3xK");
  });
});

describe("getShortLinkUrl", () => {
  it("renders a short URL under the supplied base", () => {
    expect(getShortLinkUrl("aB3xK", PUBLIC_BASE)).toBe(
      `${PUBLIC_PREFIX}aB3xK`
    );
  });
});

describe("mintShortLinkSlug", () => {
  it("uses only alphabet characters and the requested length", async () => {
    const slug = await mintShortLinkSlug({
      length: 7,
      isAvailable: async () => true,
    });

    expect(slug).toHaveLength(7);
    for (const char of slug) {
      expect(SHORT_LINK_SLUG_ALPHABET.includes(char)).toBe(true);
    }
  });

  it("retries on collisions until an available candidate is found", async () => {
    const isAvailable = vi
      .fn<(c: string) => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const slug = await mintShortLinkSlug({
      length: 5,
      isAvailable,
    });

    expect(isAvailable).toHaveBeenCalledTimes(3);
    expect(slug).toHaveLength(5);
  });

  it("escalates length when collisions saturate at the starting length", async () => {
    let calls = 0;
    const slug = await mintShortLinkSlug({
      length: 5,
      maxAttempts: 2,
      isAvailable: async () => {
        calls += 1;
        return calls > 2;
      },
    });

    expect(slug.length).toBeGreaterThan(5);
  });

  it("respects an injected random source", async () => {
    const deterministicBytes = Buffer.from([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
    const slug = await mintShortLinkSlug({
      length: 5,
      isAvailable: async () => true,
      randomBytesImpl: () => deterministicBytes,
    });

    expect(slug).toBe(SHORT_LINK_SLUG_ALPHABET[2]!.repeat(5));
  });
});
