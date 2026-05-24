const PRODUCTION_APP_ORIGIN = "https://decode.com.ng";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function getPublicAppBaseUrl(baseUrl?: string): string {
  const candidate =
    baseUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL;

  if (!candidate) {
    if (isVercelProduction()) {
      throw new Error(
        `Production public app URL must be configured as ${PRODUCTION_APP_ORIGIN}.`
      );
    }

    return "http://localhost:3000";
  }

  const url = new URL(candidate);
  validatePublicAppUrl(url);

  return url.origin;
}

function validatePublicAppUrl(url: URL): void {
  if (!isVercelProduction()) return;

  if (url.origin !== PRODUCTION_APP_ORIGIN) {
    throw new Error(
      `Production public app URL must be ${PRODUCTION_APP_ORIGIN}; received ${url.origin}.`
    );
  }

  if (
    url.protocol !== "https:" ||
    LOCAL_HOSTNAMES.has(url.hostname) ||
    url.hostname === "decode.com.ngh"
  ) {
    throw new Error(
      `Production public app URL must be ${PRODUCTION_APP_ORIGIN}.`
    );
  }
}

function isVercelProduction(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  );
}
