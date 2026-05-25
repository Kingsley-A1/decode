import "server-only";

// Decode-branded interstitial for short links that cannot be opened. Returned
// instead of a silent redirect so a scanner sees *why* a link was blocked,
// expired, or is missing. Content is fully static per kind — no user-supplied
// strings are interpolated, so there is no injection surface.

export type ShortLinkInterstitialKind =
  | "not_found"
  | "expired"
  | "flagged"
  | "disabled";

interface InterstitialCopy {
  readonly httpStatus: number;
  readonly heading: string;
  readonly body: string;
  readonly tone: "neutral" | "danger";
}

const INTERSTITIAL_COPY: Readonly<
  Record<ShortLinkInterstitialKind, InterstitialCopy>
> = {
  not_found: {
    httpStatus: 404,
    heading: "Link not found",
    body: "This short link does not exist or has been removed.",
    tone: "neutral",
  },
  expired: {
    httpStatus: 410,
    heading: "Link expired",
    body: "This short link has expired and no longer points anywhere.",
    tone: "neutral",
  },
  flagged: {
    httpStatus: 403,
    heading: "Link blocked for safety",
    body: "Decode flagged this destination as unsafe and will not open it.",
    tone: "danger",
  },
  disabled: {
    httpStatus: 403,
    heading: "Link disabled",
    body: "This short link has been disabled by its owner or an administrator.",
    tone: "danger",
  },
};

export function getShortLinkInterstitialStatus(
  kind: ShortLinkInterstitialKind
): number {
  return INTERSTITIAL_COPY[kind].httpStatus;
}

export function renderShortLinkInterstitial(
  kind: ShortLinkInterstitialKind
): string {
  const copy = INTERSTITIAL_COPY[kind];
  const accent = copy.tone === "danger" ? "#B91C1C" : "#0369A1";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${copy.heading} · Decode</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F8FAFC;
        color: #0F172A;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 24px;
      }
      .card {
        max-width: 28rem;
        width: 100%;
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        text-align: center;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: #E0F2FE;
        color: ${accent};
        font-size: 22px;
        font-weight: 700;
      }
      h1 { margin: 20px 0 8px; font-size: 1.375rem; color: #0F172A; }
      p { margin: 0; color: #475569; }
      .brand {
        margin-top: 24px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94A3B8;
      }
      a { color: ${accent}; font-weight: 600; text-decoration: none; }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="badge" aria-hidden="true">D</span>
      <h1>${copy.heading}</h1>
      <p>${copy.body}</p>
      <p class="brand"><a href="/links">Verify a link with Decode</a></p>
    </main>
  </body>
</html>`;
}
