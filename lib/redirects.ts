export const returnToParam = "returnTo";

const fallbackRedirectPath = "/me";

export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback = fallbackRedirectPath
): string {
  if (!value) return fallback;

  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue.startsWith("//")) return fallback;
  if (!trimmedValue.startsWith("/")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(trimmedValue)) return fallback;

  try {
    const parsed = new URL(trimmedValue, "https://decode.local");
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (!path.startsWith("/") || path.startsWith("//")) return fallback;
    if (path.startsWith("/api/auth/")) return fallback;

    return path;
  } catch {
    return fallback;
  }
}

export function getCurrentRelativeUrl({
  pathname,
  search,
}: {
  readonly pathname: string;
  readonly search?: string | URLSearchParams | ReadonlyURLSearchParamsLike | null;
}): string {
  const query = typeof search === "string" ? search : search?.toString() ?? "";
  return sanitizeReturnTo(query ? `${pathname}?${query}` : pathname, pathname);
}

export function getReturnToFromSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike | null | undefined,
  fallback = fallbackRedirectPath
): string {
  return sanitizeReturnTo(searchParams?.get(returnToParam), fallback);
}

export function withReturnTo(targetPath: string, returnTo: string): string {
  return addSearchParams(targetPath, {
    [returnToParam]: sanitizeReturnTo(returnTo),
  });
}

export function addSearchParams(
  targetPath: string,
  params: Record<string, string | null | undefined>
): string {
  const safeTarget = sanitizeReturnTo(targetPath, fallbackRedirectPath);
  const [pathWithSearch, hash = ""] = safeTarget.split("#", 2);
  const [pathname, query = ""] = pathWithSearch.split("?", 2);
  const searchParams = new URLSearchParams(query);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  }

  const nextQuery = searchParams.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

interface ReadonlyURLSearchParamsLike {
  get(name: string): string | null;
  toString(): string;
}
