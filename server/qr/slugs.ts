import { getPublicAppBaseUrl } from "@/server/config/public-url";
import { generateRandomSlug } from "@/server/slugs/random";

export const DYNAMIC_SLUG_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/;

// Lowercase because `/r/[slug]` resolution lowercases inbound slugs (the
// short-link alphabet is mixed-case and cannot be reused here). Ambiguous
// characters (0/o, 1/l/i) are excluded so slugs stay easy to read aloud.
export const DYNAMIC_SLUG_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

// 8 characters over a 31-character alphabet is a ~8.5e11 keyspace — ample
// headroom for random minting — and keeps the encoded payload
// (`https://decode.com.ng/r/<slug>` = 33 chars) inside QR version 4 at
// error-correction level H, one version smaller than the old `qr-<12 hex>`
// form.
export const GENERATED_DYNAMIC_SLUG_LENGTH = 8;

const RESERVED_DYNAMIC_SLUGS = new Set([
  "_next",
  "about",
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "cipher",
  "contact",
  "dashboard",
  "decode",
  "documentation",
  "docs",
  "favicon.ico",
  "generate",
  "health",
  "login",
  "logout",
  "manifest.json",
  "pricing",
  "r",
  "review",
  "s",
  "scan",
  "settings",
  "static",
  "sw.js",
  "verify",
]);

export function normalizeDynamicSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function isReservedDynamicSlug(value: string): boolean {
  return RESERVED_DYNAMIC_SLUGS.has(normalizeDynamicSlug(value));
}

export function isValidDynamicSlug(value: string): boolean {
  const slug = normalizeDynamicSlug(value);

  return DYNAMIC_SLUG_PATTERN.test(slug) && !isReservedDynamicSlug(slug);
}

export function createGeneratedDynamicSlug(
  length = GENERATED_DYNAMIC_SLUG_LENGTH
): string {
  // Reserved words are all longer or shorter than generated slugs in
  // practice, but re-roll defensively; the caller's create loop also retries
  // on the (astronomically unlikely) uniqueness collision.
  for (;;) {
    const slug = generateRandomSlug({
      alphabet: DYNAMIC_SLUG_ALPHABET,
      length,
    });

    if (isValidDynamicSlug(slug)) return slug;
  }
}

export function getDynamicQRCodeRedirectUrl(
  slug: string,
  baseUrl?: string
): string {
  return new URL(
    `/r/${normalizeDynamicSlug(slug)}`,
    getPublicAppBaseUrl(baseUrl)
  ).toString();
}
