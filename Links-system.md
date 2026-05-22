# Decode Links System — Vertical Slice Plan

> Scope: Professionalise two adjacent surfaces — **Link Verification** and **Link Shortening** — end to end on the live Decode platform (`decode.com.ng`). This document is the source of truth for both. Read it before changing any code in `app/(app)/verify`, `app/api/links/**`, `server/links/**`, `app/r/[slug]`, or the (to be added) `app/s/[slug]` and `server/short-links/**` modules.

Authored as a senior engineer accountable for production quality. Aligned with [CLAUDE.MD](CLAUDE.MD), [backend-overhaul-plan.md](backend-overhaul-plan.md), and [ui-overhaul-plan.md](ui-overhaul-plan.md). Conflicts with those documents must be resolved in their favour and reported.

---

## 1. Goals

### 1.1 Link Verification (real, evidence-backed)

Replace the cosmetic verdict pipeline with a verdict that is **defensible per reason**. Every reason a link is flagged must come with structured evidence the user can inspect — not a single opaque "90% accuracy" number with no story behind it.

Concretely:

- Verdict (`safe | caution | suspicious | malicious`) must be derived from a transparent set of signals, each of which is independently observable in the UI.
- The `confidence` field stops being a flat constant. It becomes a function of (number of corroborating signals, source quality, freshness, network reachability).
- The system must call at least one **external intelligence source** (Google Safe Browsing v4 Lookup) and at least one **network probe** (SSRF-protected HEAD with redirect-chain capture and TLS metadata) before declaring SAFE with high confidence.
- The UI must show *why* — host, redirect chain, certificate issuer, threat-feed verdict, heuristic reasons — not just a colour and a percentage.

### 1.2 Link Shortening (end to end, owned by Decode)

Implement a real first-party shortener: a long URL goes into Decode's database and gets a short URL that resolves through Decode's own redirect surface — never `is.gd`, never a SHA-1 placeholder, never a client-only widget.

Concretely:

- Output short URL must be **≥ 3× shorter** than the input URL (measured per request and asserted in tests).
- Short URLs live at `decode.com.ng/s/{code}` and resolve via a route handler that records a privacy-preserving scan event, identical in shape to the dynamic-QR scan pipeline.
- Authenticated users own their short links (workspace-scoped, soft-deletable, auditable). Anonymous users may create short links under rate limits, with abuse controls.
- Short links go through the same verification pipeline as the verifier UI before they are issued. A link the verifier would flag `malicious` cannot be silently shortened.

### 1.3 Cross-cutting

- One server module owns URL normalization, evidence aggregation, and verdict scoring. The shortener consumes it; the verifier consumes it; the dynamic-QR creation flow consumes it. No duplicated heuristics.
- Backwards compatibility with the live system at `decode.com.ng`: existing `LinkCheck` rows, existing `POST /api/links/verify` contract shape, existing dynamic-QR `/r/[slug]` redirect surface must keep working through every phase.

## 2. Non-goals

- We are not building a full URL-reputation product. We do not maintain our own crawler or our own threat feed. We integrate.
- We are not building per-user analytics dashboards for short links in this plan — only the data spine. Dashboards are a follow-on once the spine is shipped.
- We are not replacing dynamic QR `/r/[slug]`. Short links are a separate concern with their own table and slug namespace.
- We are not adding paid-tier features (custom domains, vanity codes, password-protected links). The schema must leave room for them; the UI must not promise them.

## 3. Current State (Honest Assessment)

### 3.1 Verifier rot

| Concern | Where | Symptom |
| --- | --- | --- |
| Flat confidence | [server/links/analysis.ts:349](server/links/analysis.ts#L349) | `if (verdict === SAFE) return 90;` — every safe verdict returns 90% regardless of evidence. |
| Misleading flag | [server/links/analysis.ts:330](server/links/analysis.ts#L330) | `ssrfProtected: true` is hardcoded in the response although no server-side fetch is performed; the claim of "SSRF protected" has nothing to protect against. |
| No external signal | [server/links/service.ts](server/links/service.ts) | Verifier never consults Google Safe Browsing, PhishTank, DNS, TLS, or HTTP status. |
| Reasons are inferences, not evidence | [server/links/analysis.ts:54-60](server/links/analysis.ts#L54-L60) | `BRAND_LOOKALIKE_PATTERNS` is a hand-curated substring list; produces false positives on legitimate paths like `apple-secure-store.example.com` and misses real homograph attacks. |
| UI claims "Server-backed" | [components/SuspiciousLinkChecker.tsx:160](components/SuspiciousLinkChecker.tsx#L160) | The card heading says *"Server-backed link verification"* and the result card shows *"SSRF protected. Checked …"* — neither statement is true today. |

### 3.2 Shortener rot

| Concern | Where | Symptom |
| --- | --- | --- |
| Third-party dependency on `is.gd` | [components/URLShortener.tsx:22-32](components/URLShortener.tsx#L22-L32) | Called directly from the browser; not under Decode's control; subject to ToS, throttling, and outage. |
| Fallback URL has no route | [components/URLShortener.tsx:48-60](components/URLShortener.tsx#L48-L60) | Fallback produces `https://decode.local/s/{hex}` — there is no route at `/s/[slug]` and the host is wrong. |
| No persistence | (none) | A short link generated today does not exist tomorrow on a different device; no audit trail; no analytics. |
| No verification gate | [components/URLShortener.tsx](components/URLShortener.tsx) | A malicious URL submitted to the shortener is forwarded to `is.gd` without being run through `verifyLink`. |

## 4. Target Architecture

```
                   ┌──────────────────────────────────────────────────────┐
                   │              server/links (shared core)              │
                   │ - normalizeLink (url, IDN, query strip rules)        │
                   │ - heuristic analyzer (already exists, refactored)    │
                   │ - probe runner (SSRF-protected HEAD, TLS, redirect)  │
                   │ - threat-intel client (Safe Browsing)                │
                   │ - evidence aggregator + verdict scorer               │
                   │ - LinkCheck cache (existing table, evolved)          │
                   └──────────────────────────────────────────────────────┘
                                ▲                                  ▲
                                │                                  │
                ┌───────────────┴──────────────┐    ┌──────────────┴────────────────┐
                │  /api/links/verify (POST)    │    │  /api/short-links (POST/GET)  │
                │  /app/(app)/verify           │    │  /app/(app)/shorten            │
                │  SuspiciousLinkChecker       │    │  ShortLinkConsole              │
                └──────────────────────────────┘    └──────────────────────────────┘
                                                                   │
                                                                   ▼
                                                       /app/s/[slug] redirect route
                                                       (mirrors /r/[slug] pattern)
```

Key principles:

- **One verdict pipeline.** Both surfaces call `verifyLink(...)`. Verdict is computed identically. There is no second analyzer hiding in the shortener.
- **Network calls are gated.** Every outbound HTTP probe goes through an SSRF wrapper (`server/net/safeFetch.ts`, to be added) that enforces protocol, port, DNS-resolved IP, and size/time limits.
- **Evidence is a first-class shape.** Each reason carries `code`, `severity`, `source` (`heuristic | probe | safe_browsing | tls | dns | cache`), `observedAt`, and a `data` payload the UI can render generically. Confidence is computed *from* the evidence set, not stapled on.
- **Caching is per-source, not per-verdict.** Heuristic results never expire (deterministic); probe results expire in 24h; Safe Browsing results expire per Google's TTL hints; threat-feed dataset is refreshed on a separate cron.

## 5. Evidence Model (the heart of the rewrite)

This is the contract that fixes "no evidence". It supersedes the current `LinkReason` shape.

```ts
// server/links/evidence.ts (new)

export type EvidenceSource =
  | "heuristic"     // pure analysis of the URL string itself
  | "dns"           // DNS resolution, MX, A/AAAA records
  | "probe"         // SSRF-protected HEAD/GET against the URL
  | "tls"           // TLS handshake metadata for the resolved host
  | "safe_browsing" // Google Safe Browsing v4 Lookup verdict
  | "threat_feed"   // local datasets (e.g. PhishTank snapshot)
  | "cache";        // re-served from LinkCheck cache

export type EvidenceSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface Evidence {
  readonly code: string;                 // stable, machine-readable
  readonly source: EvidenceSource;
  readonly severity: EvidenceSeverity;
  readonly message: string;              // user-facing one-liner
  readonly observedAt: string;           // ISO timestamp
  readonly data?: Readonly<Record<string, string | number | boolean>>;
  // ^ examples: { http_status: 200 }, { redirect_count: 3 },
  //   { tls_issuer: "Let's Encrypt" }, { gsb_threat: "MALWARE" }
}

export interface VerificationResult {
  readonly verdict: "safe" | "caution" | "suspicious" | "malicious";
  readonly confidence: number;           // 0..100, derived from evidence
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly evidence: readonly Evidence[];
  readonly probe: ProbeSummary | null;   // null if probe was skipped
  readonly checkedAt: string;
  readonly cache: { hit: boolean; expiresAt: string | null };
}
```

The old `reasons` array stays in the response for one release, populated by mapping `evidence.filter(e => e.source === "heuristic")` so the live UI does not break during rollout.

## 6. Phased Plan

Each phase is a **vertical slice**: schema change → server module → API route → UI surface → tests → quality gates. No phase merges without all five.

Quality gates per phase (CLAUDE.MD §Engineering Standard):
- `npm run lint`
- `npx tsc --noEmit`
- `npx prisma validate` (when the phase touches schema)
- `npm run build`
- Targeted unit/integration tests for the slice

Phases A–E ship the verifier. Phases F–I ship the shortener. Phase J is cross-cutting hardening that must land before public announcement.

---

### Phase A — Foundations: shared modules & schema scaffolding

**Goal:** prepare the ground without changing any user-visible behaviour.

#### Schema (Prisma)

Extend `LinkCheck` so cached records can carry the new evidence shape *additively*:

```prisma
model LinkCheck {
  id              String   @id @default(cuid())
  normalizedUrl   String   @unique
  verdict         String
  confidence      Int
  reasons         Json     // kept for backward compat; mirrors evidence subset
  evidence        Json?    // new — full Evidence[] payload
  probeSummary    Json?    // new — ProbeSummary or null
  safeBrowsingTtl DateTime?
  checkedAt       DateTime @default(now())
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([expiresAt])
  @@index([verdict, checkedAt])
  @@index([normalizedUrl, expiresAt])
}
```

Add new tables, dormant in Phase A, used from Phase F onward:

```prisma
model ShortLink {
  id              String   @id @default(cuid())
  workspaceId     String?  // null = anonymous link
  ownerId         String?  // null = anonymous link
  slug            String   @unique
  destinationUrl  String
  normalizedUrl   String   // canonical form used for verifyLink cache key
  status          String   @default("active") // active | disabled | flagged | deleted
  verdictAtCreate String   // verdict at creation; never overwritten
  lastVerdict     String?  // verdict from most recent re-check
  lastVerifiedAt  DateTime?
  scanCount       Int      @default(0)
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  workspace       Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  owner           User?      @relation("ShortLinkOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  scans           ShortLinkScan[]

  @@index([workspaceId, deletedAt, updatedAt])
  @@index([ownerId, updatedAt])
  @@index([status, expiresAt])
  @@index([normalizedUrl])
}

model ShortLinkScan {
  id              String   @id @default(cuid())
  shortLinkId     String
  scannedAt       DateTime @default(now())
  deviceClass     String?
  browser         String?
  operatingSystem String?
  referrer        String?
  country         String?
  region          String?
  ipHash          String?
  userAgentHash   String?
  shortLink       ShortLink @relation(fields: [shortLinkId], references: [id], onDelete: Cascade)

  @@index([shortLinkId, scannedAt])
  @@index([scannedAt])
}
```

Reserved-slug rules for shorteners mirror `server/qr/slugs.ts`. The reserved-slug list adds `s` to block shadowing `/s/{slug}`.

#### Server modules to add

- `server/net/safeFetch.ts` — SSRF wrapper: parse URL, resolve A/AAAA via Node DNS, reject private/reserved IP ranges (already coded in `analysis.ts` — extract to `server/net/ipPolicy.ts` and share), enforce protocol allowlist (`http`, `https`), enforce port allowlist (`80`, `443`), enforce method allowlist (`HEAD`, `GET`), timeout 4s, response body cap 64 KiB.
- `server/links/evidence.ts` — types from §5 and `mergeEvidence(...)`.
- `server/links/score.ts` — pure function `scoreEvidence(evidence) -> { verdict, confidence }`. Weight table is data, not code; lives in `server/links/scoring-weights.ts` for review.
- `server/short-links/slugs.ts` — base62 minter, reserved-slug check, **length policy: shortest slug that yields `len(short) <= floor(len(input)/3)`** (see §7.1). 

#### Verification gates for Phase A

- `npx prisma validate` clean.
- New modules covered by unit tests (`scoreEvidence`, `safeFetch` against a local mock).
- No new API routes; no UI change. Behaviour at `decode.com.ng` is unchanged.

---

### Phase B — Verifier slice 1: evidence-backed verdict from existing heuristics

**Goal:** make the verdict honest *before* adding any network call. Same heuristic signals as today, but reported as evidence with proper confidence math.

#### Server

- Refactor `server/links/analysis.ts`: each `getReason(...)` returns an `Evidence` instead of `LinkReason`, with `source: "heuristic"`, an `observedAt`, and a structured `data` payload (e.g. `{ matched_pattern: "paypa1" }`).
- Delete the hard-coded `if (verdict === SAFE) return 90;` branch in `getConfidence`. Replace with `scoreEvidence`:
  - SAFE with **zero** evidence and **no probe yet** -> verdict `safe`, confidence **40** (we know nothing — say so).
  - SAFE with corroborating probe and Safe Browsing -> confidence escalates only when those sources land in Phase C/D.
  - CAUTION / SUSPICIOUS / MALICIOUS: confidence = `min(95, base + Σ severity weights)`.
- Remove `ssrfProtected: true` hard-code. The field is now derived from whether a probe actually ran (`probe !== null`). For Phase B, `probe` is always `null` — so the response no longer lies.

#### API

- `POST /api/links/verify` keeps its shape but additionally returns `evidence`, `probe`, `checkedAt`. Existing `reasons` continues to be populated (mapped from heuristic evidence) so [SuspiciousLinkChecker](components/SuspiciousLinkChecker.tsx) keeps working unchanged until Phase E.

#### UI

- No change in Phase B. The legacy UI continues to consume `reasons` and `confidence`; the new fields are present but ignored.

#### Tests

- Snapshot tests asserting the same URL inputs produce the same `verdict` they did before (`server/links/service.test.ts` already covers this — extend assertions to cover `evidence[]` ordering and `confidence` ranges).
- New test: SAFE with no evidence and no probe returns confidence ≤ 50.

#### Verification gates

Standard set. Plus a manual smoke against `/verify` to confirm the live UI still renders.

---

### Phase C — Verifier slice 2: real network probe

**Goal:** SSRF-protected HEAD against the destination, capturing redirect chain, final URL, status, content-type, and TLS metadata. This is the "real" verification the user is asking for.

#### Server

- `server/links/probe.ts` exports `probeUrl(normalizedUrl, opts)` returning `ProbeSummary`:

  ```ts
  interface ProbeSummary {
    readonly initialUrl: string;
    readonly finalUrl: string;
    readonly redirectChain: ReadonlyArray<{ url: string; status: number }>;
    readonly httpStatus: number | null;
    readonly contentType: string | null;
    readonly tls: { issuer: string; subject: string; validTo: string } | null;
    readonly durationMs: number;
    readonly truncated: boolean;
    readonly error: string | null; // populated on timeout/SSRF reject/connection refused
  }
  ```

- The probe runs via `safeFetch` (Phase A). Redirect handling is **manual** (`redirect: "manual"`) so each hop is re-validated against the IP policy before being followed. Hard cap: 5 hops, 4-second total budget.
- New evidence codes added (non-exhaustive): `probe_unreachable`, `probe_5xx`, `probe_4xx`, `redirect_to_private_network`, `redirect_to_unrelated_brand`, `redirect_to_url_shortener`, `tls_self_signed`, `tls_expired`, `tls_issuer_unknown`, `tls_hostname_mismatch`, `content_type_executable`.

#### Verdict math (updated)

- A `probe_unreachable` evidence triggers `caution` (not `suspicious`) — a domain might just be down.
- A `redirect_to_private_network` triggers `malicious` immediately. This is an SSRF-style abuse signal.
- A clean probe (200, HTTPS, valid TLS, no surprise redirects) raises a SAFE verdict's confidence from 40 toward 75. The final +20 will come from Safe Browsing in Phase D.

#### API

- `POST /api/links/verify` accepts an optional `{ skipProbe?: boolean }` flag for callers who only want heuristics (e.g. dynamic-QR creation must be fast; we may defer the probe to a background job).
- New `GET /api/links/verify/:cacheKey` for cached-only reads (used by admin console).

#### UI

- Still untouched until Phase E. The probe result lands in the JSON; the existing UI ignores it.

#### Tests

- Unit: redirect chain rebuilt correctly, hop count enforced, private-network mid-chain blocked, TLS metadata extracted from a stub.
- Integration: probe against a known-good URL (`https://example.com`) — gated to CI environments with outbound network or stubbed via MSW.

#### Verification gates

Standard. Plus a `prisma migrate dev` for the new `probeSummary` column.

---

### Phase D — Verifier slice 3: external threat intelligence (Google Safe Browsing v4)

**Goal:** corroborate (or refute) heuristic signals with an industry-standard feed. This is what lets us legitimately label something `malicious` with high confidence and what lets a clean URL legitimately reach 95% SAFE.

#### Configuration

- New env var: `GOOGLE_SAFE_BROWSING_API_KEY`. Documented in `.env.example`.
- New env var: `SAFE_BROWSING_BACKOFF_MS` (default `60000`) — used by the client when rate-limited.

#### Server

- `server/links/safeBrowsing.ts` exports `lookupSafeBrowsing(urls: string[])`. Wraps Google Safe Browsing v4 Lookup API. Batches up to 500 URLs per request (Google's limit). Caches per Google's `cacheDuration` hint into a new `SafeBrowsingHit` table or as evidence in `LinkCheck.evidence` keyed by `code: "safe_browsing_hit"`.
- New evidence codes: `safe_browsing_malware`, `safe_browsing_social_engineering`, `safe_browsing_unwanted_software`, `safe_browsing_potentially_harmful`, `safe_browsing_clean` (low-severity positive evidence, contributes confidence to SAFE).
- A Safe Browsing hit short-circuits to `malicious`, confidence 95.
- A Safe Browsing clean response contributes +15 confidence to a SAFE verdict.

#### Failure mode

- If the Safe Browsing client returns an error, the verifier returns the verdict it has without it and adds a `safe_browsing_unavailable` info-severity evidence. We do not block on the third party.

#### API

No new routes. The existing `verifyLink` service grows a new internal step. Public contract is stable.

#### Tests

- Unit tests with stubbed Safe Browsing client for each threatType.
- Failure mode: client throws → verdict still returned, evidence includes `safe_browsing_unavailable`.

#### Verification gates

Standard. Plus: deploy to preview with the env var, run a manual check against a Google-provided test phishing URL (`http://testsafebrowsing.appspot.com/s/malware.html`), confirm `malicious` verdict.

---

### Phase E — Verifier slice 4: UI overhaul, kill the "90% with no evidence"

**Goal:** the user sees evidence, not a vague percentage. This is the slice the user explicitly asked for.

#### UI changes ([components/SuspiciousLinkChecker.tsx](components/SuspiciousLinkChecker.tsx))

- Replace the single "Confidence" tile with a grouped **Evidence panel**:
  - Section: *Heuristic* — items from `evidence[source=heuristic]`, severity badge, expandable details.
  - Section: *Reachability* — final URL, HTTP status, redirect chain (rendered as a vertical list), probe duration. Source: `probe` summary.
  - Section: *TLS* — issuer, subject, validity dates. Source: `evidence[source=tls]` + `probe.tls`.
  - Section: *Threat intelligence* — Safe Browsing verdict (clean / threat type with link to Google's classification docs). Source: `evidence[source=safe_browsing]`.
- Confidence is shown alongside a one-line attribution: *"Based on N signals across M sources."* No bare percentage without that sentence.
- Verdict pill colours: `safe` sky-700, `caution` amber-600, `suspicious` orange-700, `malicious` red-700 (new tier).
- "Open with caution" button is replaced with policy-driven action:
  - `safe` → "Open verified link".
  - `caution` → "Open with caution" + dialog.
  - `suspicious` → "Open anyway" inside dialog; UI surfaces the top three evidence items in the dialog.
  - `malicious` → no open button; explicit copy *"Decode will not open this link"*; only "Copy URL" available.

#### Accessibility

- Each evidence section is a `<section>` with an `aria-labelledby` heading. The verdict pill uses `aria-live="polite"` so screen readers announce changes.
- Severity is not signalled by colour alone (CLAUDE.MD §Accessibility Rules) — every badge carries an icon and a label.

#### Tests

- Component tests for each verdict tier rendering the correct action set.
- Playwright smoke: paste a known clean URL, assert evidence sections render and "Open verified link" appears; paste a Safe Browsing test URL, assert "Decode will not open this link" appears.

#### Verification gates

Standard. Plus visual review against the sky-blue v2 tokens defined in CLAUDE.MD §Frontend And Design Rules.

---

### Phase F — Shortener slice 1: redirect spine

**Goal:** a short URL that *only Decode controls* resolves to its destination, records a scan, and goes nowhere via `is.gd`.

#### Schema

`ShortLink` and `ShortLinkScan` tables from Phase A are now exercised. Reserved-slug list updated.

#### Server modules

- `server/short-links/slugs.ts`:
  - Alphabet: `0-9 A-Z a-z` minus `0OIl1` to avoid ambiguity (57 chars).
  - Length policy:
    - Compute `target = floor(len(longUrl) / 3) - len("https://decode.com.ng/s/")`.
    - Start at `max(5, target)` characters. If `target < 5`, the URL is already too short to compress 3× — return `URL_ALREADY_SHORT` error.
    - On collision, retry; if still colliding after 5 attempts, escalate slug length by 1.
  - The slug minter uses `crypto.randomBytes` and rejects words in a small bad-word blocklist.
- `server/short-links/service.ts`:
  - `createShortLink({ url, ownerId?, workspaceId? })`:
    1. `verifyLink(url)` — uses the Phase B–D pipeline.
    2. If verdict is `malicious`, throw `SHORT_LINK_BLOCKED` with the evidence summary.
    3. If verdict is `suspicious`, throw `SHORT_LINK_REQUIRES_OVERRIDE` unless the caller passes `{ acknowledgedSuspicious: true }` *and* is authenticated.
    4. Mint slug, insert row, return `{ slug, shortUrl, verdict, evidenceSummary }`.
  - `resolveShortLink(slug)` — fetches the row, returns null if soft-deleted, disabled, expired, or flagged.

#### Route handler

`app/s/[slug]/route.ts` mirrors [app/r/[slug]/route.ts](app/r/[slug]/route.ts):

- `GET /s/:slug` resolves the slug, records a `ShortLinkScan` with the same telemetry shape as `ScanEvent`, increments `scanCount` (atomic), and 302s to `destinationUrl`.
- For status `flagged` or `disabled`, return a Decode-branded interstitial page with the verdict reason — not a silent redirect.

#### Verification gates

Standard. Plus a Playwright smoke that creates a short link via the API and follows the redirect.

---

### Phase G — Shortener slice 2: API contract

**Goal:** real REST endpoints that the dashboard and the verifier both consume.

#### Routes

- `POST /api/short-links` — create. Body validated by `createShortLinkRequestSchema` (Zod). Anonymous creation behind rate limit (Phase J). Returns the full `ShortLink` row plus the verifier's `VerificationResult` snapshot.
- `GET /api/short-links` — list, paginated, workspace-scoped, ordered by `updatedAt desc`. Uses `select` (CLAUDE.MD §Backend Rules — no over-fetching).
- `GET /api/short-links/:id` — read one. Includes recent scans (limit 50).
- `PATCH /api/short-links/:id` — owner can update `destinationUrl` (re-runs verifyLink) and `status` (enable/disable). Audit log written.
- `DELETE /api/short-links/:id` — soft-delete; audit log written.
- `POST /api/short-links/:id/re-verify` — runs `verifyLink` again and updates `lastVerdict` / `lastVerifiedAt`.

All routes use the existing `apiSuccess` / `apiError` / `apiValidationError` helpers from `server/api/response.ts` for shape consistency.

#### Audit

Every mutation writes to `AuditLog` with `entityType: "short_link"`, `entityId: shortLink.id`, `action: created | destination_changed | status_changed | deleted | re_verified` (CLAUDE.MD §Backend Rules requires audit for destructive actions and destination changes — short-link destination changes are explicitly auditable for the same reason dynamic-QR destinations are).

#### Verification gates

Standard. Plus targeted integration tests for the create + verify-blocks-malicious path.

---

### Phase H — Shortener slice 3: UI

**Goal:** retire the [components/URLShortener.tsx](components/URLShortener.tsx) `is.gd` widget. Replace with a Decode-native console.

#### New route

`app/(app)/shorten/page.tsx` (or repurpose an existing route if the team prefers).

#### New component

`components/short-links/ShortLinkConsole.tsx`:

- Form: long URL, optional `expiresAt`, optional title (for the owner's own list — not shown to scanners).
- On submit, calls `POST /api/short-links`. Shows the verifier's evidence summary inline (Phase E components reused — `EvidencePanel` is exported from `components/links/EvidencePanel.tsx`).
- Result block: short URL with copy button, "Open" button, QR-code preview (uses the existing QR renderer), and the verdict pill.
- Below: the user's short-link list (paginated). Each row shows slug, destination host, verdict pill, scan count, last verified.

#### Compression guarantee in the UI

- Show the literal *N× shorter* compression next to the short URL ("`example.com/s/aB3xK` — **4.2× shorter than your original**"). Computed from `len(longUrl) / len(shortUrl)`.
- If the input is already short, the UI explains *"This URL is already short — Decode will not shorten it."* and offers to copy the original.

#### Retirement of the old widget

- `components/URLShortener.tsx` is replaced with a thin compatibility shim that mounts `ShortLinkConsole` so any page that imports it keeps working. In the next release after H lands, the file is deleted (tracked as a follow-up).

#### Verification gates

Standard. Plus Playwright smoke: open `/shorten`, paste a URL, copy the short link, open it in a new tab, confirm redirect.

---

### Phase I — Shortener slice 4: re-verification, expiry, abuse controls

**Goal:** short links don't become a phishing weapon weeks after they were minted.

- Add a daily Vercel Cron (`vercel.json`) that calls an internal admin endpoint to re-verify short links that have not been verified in the last 7 days, prioritising those with the most recent scans. Updates `lastVerdict`. A verdict regression to `malicious` flips `status` to `flagged` and writes an audit log.
- Expose flagged short links in the admin console (extend `app/admin/(console)/link-checks/page.tsx` or add a sibling `short-links` page) so an admin can review and decide to disable or restore.
- Abuse controls:
  - Anonymous: 5 short links / IP-hash / hour. Tracked in a Redis-backed limiter (or an `AbuseEvent` table if Redis is not yet wired — already discussed in `backend-overhaul-plan.md` §Rate limiting).
  - Per-host shortening cap: no more than 200 short links pointing at the same destination host per workspace in 24h.
- User-facing report-abuse link on the redirect interstitial.

#### Verification gates

Standard. Plus a manual run of the cron in preview and verification that a regressed link flips to `flagged`.

---

### Phase J — Cross-cutting: rate limits, observability, admin

**Goal:** make the system operable. None of A–I matter if we cannot see it work in production.

- **Rate limits** (CLAUDE.MD §Security Rules): `POST /api/links/verify` and `POST /api/short-links` both behind the same limiter middleware. Anonymous: 30/min. Authenticated: 300/min/workspace.
- **Observability**: every verify call, every probe, every Safe Browsing lookup logged via `server/observability/logging.ts` with `event: "link.verify" | "link.probe" | "link.safe_browsing" | "short_link.create" | "short_link.resolve"`. Include `request_id`, `verdict`, `confidence`, `evidence_count`, `cache_hit`, `duration_ms`. **Never log raw URLs that contain query strings with credentials** — log the host + a SHA-256 of the normalized URL.
- **Admin console**: extend `app/admin/(console)/link-checks/page.tsx` to filter by verdict and source, expose the evidence payload as expandable JSON. Add `app/admin/(console)/short-links/page.tsx` for the new resource.
- **Metrics**: counters for verdict distribution (safe/caution/suspicious/malicious), Safe Browsing availability, probe failure rate, short-link creation rate, short-link block rate. Exported to whatever the team is using for metrics (Sentry custom metrics if nothing else is in place — `sentry.server.config.ts` already exists).
- **Documentation**: this file is updated as decisions are made. `.env.example` documents `GOOGLE_SAFE_BROWSING_API_KEY` and `SAFE_BROWSING_BACKOFF_MS`. `README.md` adds a Links section.

---

## 7. Engineering Decisions Worth Pinning

### 7.1 What does "3× shorter" mean exactly?

`len(shortUrl) <= len(longUrl) / 3` measured by character count after both URLs are written in the form a user can copy (i.e. including `https://decode.com.ng/s/`). If the input cannot satisfy this, we refuse to shorten and tell the user why. We do not silently produce a "short" URL that is longer than 1/3 of the input — that is exactly the cosmetic behaviour the user wants us to leave behind.

For `decode.com.ng/s/` the prefix is 24 characters, so the *minimum* input length we can compress to even a single-character slug is 25 × 3 = 75 characters. With our 5-character minimum slug, the practical minimum input length is 87 characters. Below that, we politely decline. This is reflected in the `URL_ALREADY_SHORT` error and surfaced as a friendly message in the UI.

### 7.2 Why a separate `/s/` route instead of reusing `/r/` for short links?

Dynamic QR codes have product semantics (workspace-owned, attachable to a landing page, scan analytics tied to the QR design). Short links are a strictly text-input redirect with a different ownership model (allows anonymous). Mixing the two would either bloat the QR table with anonymous text-only rows or restrict anonymous shortening to authenticated-only — both wrong. Separate tables, separate route, shared verifier core. The slug namespaces are kept distinct (`/r/{slug}` vs `/s/{slug}`).

### 7.3 Why is `confidence` no longer a fixed number for SAFE?

Because lying to users is worse than admitting uncertainty. A URL we never touched with the network deserves a low SAFE confidence. A URL that passed heuristics + probe + Safe Browsing deserves a high SAFE confidence. The number must move with the evidence; otherwise it is decoration.

### 7.4 Why Google Safe Browsing and not VirusTotal or PhishTank first?

Google Safe Browsing v4 Lookup has the lowest integration friction (single API key, batched lookups, generous free tier, deterministic threat types), the highest signal quality for end-user phishing, and is the industry default. VirusTotal is a strong second source but is rate-limited and the public API requires per-request handling that is heavier than what this phase warrants. PhishTank is a useful dataset but ships as a periodic dump rather than a lookup API — fine for a later phase that batches the dataset into a `PhishTankEntry` table refreshed by cron, not for the first slice.

### 7.5 Why do we re-run the verifier on every shortener mutation?

Because a short link is a redirect we *publish*. A destination change without a fresh verdict is exactly the dynamic-QR phishing scenario the backend-overhaul-plan §6 already warns about. Re-running `verifyLink` on every destination change costs one cached read if the URL is already known and a single probe + Safe Browsing call if not. That is cheap and the audit log captures the verdict, so we can defend the decision after the fact.

### 7.6 Compatibility with the live site

- `POST /api/links/verify` response keeps `verdict`, `confidence`, `normalizedUrl`, `host`, `reasons`, `ssrfProtected`, `cache` for one major version. New fields are additive.
- Existing `LinkCheck` rows are read with `evidence ?? []` until they expire. No data migration required.
- The current `SuspiciousLinkChecker` continues to render through Phases B–D unchanged; only Phase E swaps it out. The route at `/verify` is never down.
- The current `URLShortener` widget is replaced by a shim in Phase H, never deleted in the same release.

## 8. Acceptance Criteria (system-wide)

The links system is considered "professionalised" when **all** of the following are true on production:

1. `POST /api/links/verify` against a fresh URL produces an `evidence` array with at least one item per available source (heuristic + probe + safe_browsing) when those sources are reachable.
2. A SAFE verdict's confidence varies with the evidence set — there exists at least one production trace where the same URL had different confidence before and after a probe ran.
3. A URL listed in Google Safe Browsing's test feed (`testsafebrowsing.appspot.com`) returns `malicious` with `evidence[].source === "safe_browsing"` and the UI shows the "Decode will not open this link" copy.
4. `POST /api/short-links` with a URL of length ≥ 87 returns a short URL whose length is ≤ `floor(input_length / 3)`. This is asserted in CI.
5. `POST /api/short-links` with a URL the verifier flags `malicious` returns `409 SHORT_LINK_BLOCKED` and writes no row.
6. `GET /s/{slug}` for a known-good short link 302s to the destination and writes a `ShortLinkScan` row whose `ipHash` is non-null and whose raw IP is not stored anywhere (CLAUDE.MD §QR Product Rules).
7. The admin console exposes filterable lists for both `LinkCheck` and `ShortLink` and surfaces the full `evidence` payload.
8. `npm run lint`, `npx tsc --noEmit`, `npx prisma validate`, `npm run build`, and the Playwright smoke suite all pass.

## 9. Sequencing & Estimates (rough, for planning only)

| Phase | Scope | Estimate |
| --- | --- | --- |
| A | Foundations: schema migration, shared modules, no behaviour change | 1–1.5 days |
| B | Evidence-backed verdict from existing heuristics | 1 day |
| C | SSRF-protected probe + redirect chain + TLS metadata | 2 days |
| D | Google Safe Browsing integration | 1 day |
| E | Verifier UI overhaul | 1.5 days |
| F | Shortener redirect spine + slug minter | 1.5 days |
| G | Shortener API contract + audit | 1 day |
| H | Shortener UI + retire `is.gd` widget | 1.5 days |
| I | Re-verification cron + abuse controls | 1 day |
| J | Rate limits, observability, admin polish | 1 day |

Estimates assume one engineer, fully focused, with familiarity with the codebase. They are diagnostic, not commitments.

## 10. Risks

- **Safe Browsing rate limit.** Free tier is generous but not infinite. Mitigation: aggressive caching keyed by normalized URL with Google's `cacheDuration` honoured; fallback to evidence-without-SB when limited.
- **Probe latency.** A 4-second probe budget plus an SB lookup can push the verify call above the 200ms INP target (CLAUDE.MD §Performance Rules) when the UI awaits it synchronously. Mitigation: probe is allowed to be skipped via `{ skipProbe: true }`; the UI calls verify twice — first without probe (instant), then with probe (background) — and merges results via `aria-live` updates. Documented in Phase E.
- **Slug collisions at scale.** Base57 5-char slugs give ~600M combinations. Mitigation: collision retry with length escalation; usage telemetry triggers a default-length bump well before saturation.
- **Anonymous abuse.** Short-link shortening is a classic phishing-as-a-service vector. Mitigation: hard verify-before-create gate; per-IP-hash rate limits; per-destination caps; admin-driven flagging; daily re-verify cron.
- **Live-site compatibility.** Mitigated by the additive-only API changes through Phases B–D and the compatibility shim in Phase H. Every phase ships behind feature parity, not behind a feature flag toggle — the contract is the flag.

---

*This plan is owned. If a decision in it stops being right, update this file in the same PR that changes the decision.*
