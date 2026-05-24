import { getPublicAppBaseUrl } from "@/server/config/public-url";

export const DYNAMIC_SLUG_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/;

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

export function getDynamicQRCodeRedirectUrl(
  slug: string,
  baseUrl?: string
): string {
  return new URL(
    `/r/${normalizeDynamicSlug(slug)}`,
    getPublicAppBaseUrl(baseUrl)
  ).toString();
}
