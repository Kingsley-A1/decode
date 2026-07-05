import "server-only";

import { randomBytes } from "node:crypto";
import { getPublicAppBaseUrl } from "@/server/config/public-url";
import { generateRandomSlug } from "@/server/slugs/random";

// Short-link slug minting. The exported constants and helpers are the
// canonical home for slug rules so the API layer and any future bulk
// importer share one definition. Phase A keeps this dormant — no API
// route yet — but tests run end to end against the minter.
//
// Length policy enforces the "3x shorter" product promise:
//   len(short URL) <= floor(len(long URL) / 3)
// measured against the full publishable form (including
// `https://decode.com.ng/s/`). If the input cannot satisfy that, the
// shortener refuses rather than producing a placeholder.

/** Visually unambiguous alphabet: 0-9 a-z A-Z minus 0, O, I, 1, l. */
export const SHORT_LINK_SLUG_ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const SHORT_LINK_BASE_PREFIX = "/s/";
export const SHORT_LINK_SLUG_MIN_LENGTH = 5;
export const SHORT_LINK_SLUG_MAX_LENGTH = 12;
export const SHORT_LINK_DEFAULT_MAX_ATTEMPTS = 5;

const SHORT_LINK_RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "about",
  "admin",
  "api",
  "app",
  "auth",
  "create",
  "dashboard",
  "delete",
  "edit",
  "favicon.ico",
  "health",
  "help",
  "login",
  "logout",
  "manifest.json",
  "new",
  "robots.txt",
  "settings",
  "sitemap.xml",
  "static",
  "support",
  "sw.js",
  "terms",
  "privacy",
]);

const SHORT_LINK_BAD_WORD_FRAGMENTS: readonly string[] = [
  "fuck",
  "shit",
  "porn",
  "rape",
  "nazi",
  "hentai",
];

export interface ShortLinkLengthPolicyInput {
  readonly longUrlLength: number;
  readonly shortBaseLength: number;
}

export interface ShortLinkLengthPolicyResult {
  readonly ok: boolean;
  readonly recommendedSlugLength: number;
  readonly maxSlugLength: number;
  readonly reason?: "url_already_short";
}

/** Computes the longest acceptable slug under the 3x-shorter promise and a
 *  recommended starting length. `shortBaseLength` must include the scheme,
 *  host and `/s/` (e.g. len of `https://decode.com.ng/s/`). */
export function computeShortLinkLengthPolicy(
  input: ShortLinkLengthPolicyInput
): ShortLinkLengthPolicyResult {
  const target = Math.floor(input.longUrlLength / 3);
  const maxSlugLength = target - input.shortBaseLength;

  if (maxSlugLength < SHORT_LINK_SLUG_MIN_LENGTH) {
    return {
      ok: false,
      recommendedSlugLength: SHORT_LINK_SLUG_MIN_LENGTH,
      maxSlugLength,
      reason: "url_already_short",
    };
  }

  const capped = Math.min(maxSlugLength, SHORT_LINK_SLUG_MAX_LENGTH);
  // Prefer a comfortable starting length but never below the floor or
  // above the 3x-shorter ceiling.
  const recommended = Math.min(Math.max(SHORT_LINK_SLUG_MIN_LENGTH, 6), capped);

  return {
    ok: true,
    recommendedSlugLength: recommended,
    maxSlugLength,
  };
}

export function normalizeShortLinkSlug(value: string): string {
  return value.trim();
}

export function isReservedShortLinkSlug(value: string): boolean {
  return SHORT_LINK_RESERVED_SLUGS.has(value.toLowerCase());
}

export function shortLinkSlugContainsBadWord(value: string): boolean {
  const lower = value.toLowerCase();

  return SHORT_LINK_BAD_WORD_FRAGMENTS.some((fragment) =>
    lower.includes(fragment)
  );
}

export function isValidShortLinkSlug(value: string): boolean {
  const slug = normalizeShortLinkSlug(value);

  if (
    slug.length < SHORT_LINK_SLUG_MIN_LENGTH ||
    slug.length > SHORT_LINK_SLUG_MAX_LENGTH
  ) {
    return false;
  }
  if (isReservedShortLinkSlug(slug)) return false;
  if (shortLinkSlugContainsBadWord(slug)) return false;

  for (const char of slug) {
    if (!SHORT_LINK_SLUG_ALPHABET.includes(char)) return false;
  }

  return true;
}

export interface MintShortLinkSlugOptions {
  readonly length: number;
  readonly isAvailable: (candidate: string) => Promise<boolean>;
  readonly maxAttempts?: number;
  /** Hard ceiling on the escalated slug length. Callers that must honour the
   *  3x-shorter promise pass the length-policy `maxSlugLength` here so a
   *  collision never produces a slug longer than the promise allows. */
  readonly maxLength?: number;
  readonly randomBytesImpl?: (size: number) => Buffer;
}

/** Mints a slug of the requested length, escalating length by +1 each
 *  time `maxAttempts` collisions are observed at the current length, up to
 *  `maxLength` (default: the absolute slug-length cap). */
export async function mintShortLinkSlug(
  options: MintShortLinkSlugOptions
): Promise<string> {
  const maxAttempts =
    options.maxAttempts ?? SHORT_LINK_DEFAULT_MAX_ATTEMPTS;
  const rb = options.randomBytesImpl ?? randomBytes;
  const ceiling = Math.min(
    SHORT_LINK_SLUG_MAX_LENGTH,
    options.maxLength ?? SHORT_LINK_SLUG_MAX_LENGTH
  );
  let length = clampSlugLength(options.length);

  while (length <= ceiling) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = generateSlug(length, rb);
      if (!isValidShortLinkSlug(candidate)) continue;
      if (await options.isAvailable(candidate)) return candidate;
    }
    length += 1;
  }

  throw new Error(
    `Could not mint a short-link slug after escalating to length ${ceiling}.`
  );
}

/** Produces the published short URL for a slug, using NEXT_PUBLIC_APP_URL
 *  (or its fallbacks) as the base. Mirrors `getDynamicQRCodeRedirectUrl`. */
export function getShortLinkUrl(slug: string, baseUrl?: string): string {
  return new URL(
    `${SHORT_LINK_BASE_PREFIX}${normalizeShortLinkSlug(slug)}`,
    getPublicAppBaseUrl(baseUrl)
  ).toString();
}

function clampSlugLength(length: number): number {
  if (!Number.isFinite(length)) return SHORT_LINK_SLUG_MIN_LENGTH;
  if (length < SHORT_LINK_SLUG_MIN_LENGTH) return SHORT_LINK_SLUG_MIN_LENGTH;
  if (length > SHORT_LINK_SLUG_MAX_LENGTH) return SHORT_LINK_SLUG_MAX_LENGTH;

  return Math.floor(length);
}

function generateSlug(
  length: number,
  rb: (size: number) => Buffer
): string {
  return generateRandomSlug({
    alphabet: SHORT_LINK_SLUG_ALPHABET,
    length,
    randomBytesImpl: rb,
  });
}
