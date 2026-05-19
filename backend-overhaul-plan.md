# Decode Backend Overhaul Plan

## Executive Decision

The conventional answer is to add a few API routes around the current client-only QR tools. The stronger strategic answer is to convert Decode into a full-stack QR platform with durable accounts, editable dynamic QR codes, object storage, analytics, link verification, and a stable backend contract that can support a professional UI without rewriting the platform again.

Decode will remain a single Next.js application for the next implementation cycle, but it must stop behaving like a static GitHub Pages app. Remove `output: "export"`, deploy through Vercel, and use the App Router backend surface for route handlers, server actions, authentication, and server-rendered product pages. The production backend stack is CockroachDB with Prisma, Cloudflare R2 for file storage, Auth.js with Google and GitHub OAuth, Zod for runtime validation, API-first design, and structured observability from day one.

## Current Backend State

The current app is a static-export Next.js PWA. QR generation, QR scanning, suspicious link checks, URL shortening, and cipher tools all run in the browser. This keeps the MVP simple, but it prevents professional platform behavior: no accounts, no saved QR codes, no dynamic redirect layer, no scan analytics, no durable asset storage, no backend validation, no central rate limits, and no trustworthy link verification boundary.

The immediate backend goal is not to create microservices. The right v1 architecture is a modular monolith inside Next.js: server-only domain modules, typed route handlers, Prisma repositories, and clean package boundaries that can later be extracted if usage demands it.

## Current Focus After Phase 8

Backend Phases 1-8 are now implemented as the platform foundation. The next primary focus is not another backend feature phase; it is the UI platformization work documented in `ui-overhaul-plan.md` and summarized in `docs/current-focus.md`.

Backend work should now be treated as support work for the UI rebuild and release process. The immediate backend support checklist is:

- Configure production and preview observability variables: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, and `SENTRY_RELEASE`.
- Configure `SMOKE_DYNAMIC_SLUG` in GitHub/Vercel so preview smoke checks can exercise a real dynamic QR redirect.
- Verify CockroachDB migrations against the connected environment using the release runbook before production promotion.
- Add rate limiting before exposing anonymous high-volume paths broadly through the redesigned UI.
- Keep API changes small and UI-driven until the new app shell, component system, and generator workflow are usable.

The strategic reason is simple: the backend now supports a professional platform, but the user-facing product still looks and behaves like the prototype. Product quality is currently constrained by navigation, workflow clarity, component consistency, accessibility, and visual polish.

## Architecture Standard

### Runtime And Deployment

- Remove `output: "export"` from `next.config.ts`; static export cannot support the route handlers, auth callbacks, redirects, signed uploads, and database writes required for Decode v2.
- Deploy the app to Vercel with preview deployments for pull requests and production deployment from `main`.
- Keep public marketing and documentation pages static or cached where possible.
- Use dynamic route handlers only for auth, QR creation, QR rendering, asset signing, redirects, scan logging, link verification, and decode operations.
- Keep heavy client libraries out of first-load bundles. QR rendering, file handling, and scanner modules must be lazy-loaded or server-backed.

### Backend Module Layout

Use the existing single-app structure first, then introduce clear server folders before considering a monorepo.

```text
decode/
  app/
    api/
      assets/presign/route.ts
      decode/route.ts
      links/verify/route.ts
      qr-codes/route.ts
      qr-codes/[id]/render/route.ts
      scans/image/route.ts
    r/[slug]/route.ts
  auth.ts
  prisma/
    schema.prisma
    migrations/
  server/
    auth/
    db/
    qr/
    links/
    assets/
    analytics/
    audit/
    validation/
  lib/
    crypto.ts
    utils.ts
```

Public route handlers should be thin. They validate input, call a server service, and return a typed response. Business logic belongs in `server/*`, not in React components or route handlers.

### Infrastructure Choices

- Database: CockroachDB using Prisma's `cockroachdb` provider.
- ORM: Prisma Client with strict TypeScript, explicit `select` usage, pagination, compound indexes, and transaction boundaries for multi-write flows.
- Auth: Auth.js with Google and GitHub OAuth only for v1. Do not add password auth until account recovery, email verification, abuse controls, and support workflows are planned.
- Storage: Cloudflare R2 through the S3-compatible API. Store generated exports, uploaded logos, PDFs, image galleries, MP3 files, and landing-page media.
- Validation: Zod schemas at every API boundary.
- Observability: request IDs, structured logs, Sentry for exceptions, Vercel Analytics and Speed Insights for frontend and route performance.
- Rate limiting: route-level limits for anonymous creation, link verification, scan image uploads, presigned upload creation, and redirect abuse.

## Data Model

The schema should support static QR codes, dynamic QR codes, user workspaces, landing pages, assets, scan events, cached link checks, and audit trails.

### Core Models

- `User`: Auth.js user record with name, email, image, timestamps, default workspace relation, and soft-delete support.
- `Account`: Auth.js OAuth provider account for Google and GitHub.
- `Session`: Auth.js database session when using the Prisma adapter.
- `Workspace`: ownership boundary for saved QR codes, analytics, billing later, and team features later.
- `WorkspaceMember`: user-workspace relation with `owner`, `admin`, and `member` roles.
- `QRCode`: primary QR entity. Stores workspace, owner, type, mode (`static` or `dynamic`), title, slug, payload, destination URL, design configuration, status, and timestamps.
- `QRCodeAsset`: uploaded or generated asset linked to a QR code or landing page. Stores R2 key, content type, file size, purpose, and checksum when available.
- `LandingPage`: editable dynamic destination content for QR types such as profile, business, menu, coupon, event, PDF, images, audio, video, multiple links, and feedback.
- `ScanEvent`: append-only scan analytics record linked to a QR code. Stores timestamp, user agent summary, device class, referrer, country/region when available, and anonymized IP hash.
- `LinkCheck`: cached link verification result with normalized URL, verdict, confidence, reason list, checked timestamp, and expiry timestamp.
- `AuditLog`: append-only record for create, update, delete, publish, unpublish, asset upload, and destination-change actions.

### Prisma Standards

- Use UUID/CUID-style identifiers, not autoincrementing integers, because CockroachDB is distributed.
- Add `createdAt`, `updatedAt`, and nullable `deletedAt` to business records.
- Add compound indexes for dashboard queries: `workspaceId + updatedAt`, `qrCodeId + scannedAt`, `normalizedUrl + expiresAt`.
- Store flexible QR design and landing-page content in JSON only where the shape is intentionally user-defined. Keep relational fields for queryable state such as mode, type, status, slug, and owner.
- Use transactions for QR creation with initial asset records, dynamic QR updates with audit logs, and landing-page publication.

## API Contract

Every API response should follow one of two shapes:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  requestId: string;
};
```

### QR Codes

`POST /api/qr-codes`

Creates a static or dynamic QR record. Anonymous users may create temporary static QR codes within strict rate limits. Authenticated users can save static and dynamic codes to a workspace.

Required behavior:

- Validate QR type, mode, payload, destination URL, title, slug, and design configuration.
- Enforce reserved slugs and slug uniqueness for dynamic codes.
- Normalize URL payloads before persistence.
- Create an audit log for authenticated saved codes.
- Return the created QR code summary and next action links.

`POST /api/qr-codes/[id]/render`

Renders a QR code export as PNG, SVG, or PDF.

Required behavior:

- Verify access to private QR codes.
- Use server-side rendering for final exports so output is predictable.
- Store generated exports in R2 when the QR code is saved.
- Return either a signed download URL or a streamed file response.
- Enforce scanability guardrails before final export.

`GET /r/[slug]`

Dynamic redirect endpoint.

Required behavior:

- Resolve the QR code by slug.
- Reject archived, deleted, or unpublished codes.
- Record a scan event asynchronously or with a low-latency write path.
- Redirect to the active destination URL or render the linked landing page.
- Avoid blocking the redirect on nonessential analytics enrichment.

### Assets

`POST /api/assets/presign`

Creates an R2 signed upload target for logos, PDFs, images, audio, and generated exports.

Required behavior:

- Require authentication for saved assets.
- Validate content type, purpose, file size, and workspace ownership.
- Generate deterministic key prefixes such as `workspaces/{workspaceId}/qr/{qrCodeId}/logos/{assetId}`.
- Return upload URL, method, headers, max size, and final asset key.
- Create or update `QRCodeAsset` after upload confirmation.

### Link Verification

`POST /api/links/verify`

Runs server-side link analysis and returns a verdict.

Required behavior:

- Normalize input URLs.
- Accept only `http` and `https`.
- Block private IPs, localhost, link-local ranges, metadata service addresses, and malformed hosts.
- Detect risky TLDs, punycode, suspicious keywords, excessive subdomains, long paths, brand spoof patterns, nonstandard ports, raw IP hosts, and encoded control characters.
- Cache results in `LinkCheck` to reduce repeated computation and external provider calls later.
- Return `safe`, `caution`, or `suspicious` with confidence and reason codes.

### Scanning And Decoding

`POST /api/scans/image`

Decodes an uploaded image containing a QR code.

Required behavior:

- Enforce file size and content type.
- Use a server-compatible QR decoder.
- Return decoded text, detected content type, normalized URL when applicable, and optional link verification summary.
- Keep camera scanning client-side for instant feedback, but use this route as the compatibility fallback.

`POST /api/decode`

Runs supported text transformations: Base64, URL encoding, ROT13, Caesar, Morse, binary, hex, and reverse.

Required behavior:

- Validate algorithm and direction.
- Enforce input length limits.
- Return structured errors for invalid encoded input instead of empty strings.
- Keep deterministic algorithms shared with the client where safe.

## Security And Abuse Controls

Decode will handle URLs, redirects, uploads, user-generated landing pages, and scan telemetry. These are abuse-prone surfaces.

- Validate every request with Zod before touching Prisma or R2.
- Add rate limits for anonymous QR generation, link checks, image scans, redirects per slug, and asset signing.
- Treat link verification as an SSRF boundary. Do not fetch arbitrary URLs in v1 unless private-network blocking and timeout controls are implemented.
- Sanitize all landing-page rich text and user-provided display content.
- Use signed R2 uploads for private or editable assets. Public assets must be served from controlled public prefixes only.
- Never store raw IP addresses in scan analytics. Store anonymized hashes and coarse location only when legally and technically acceptable.
- Add audit logs for destination changes because dynamic QR codes can become phishing vectors if accounts are compromised.
- Use secure cookie defaults, CSRF-safe auth flows, and least-privilege environment variables.

## Performance Standard

The backend must support a fast QR workflow and near-instant redirects.

- Redirect route target: p95 under 150 ms before external network latency.
- QR creation route target: p95 under 500 ms for metadata creation.
- QR render target: p95 under 2 seconds for standard PNG/SVG generation.
- Link verification route target: p95 under 800 ms without external reputation providers.
- Use `select` in Prisma queries and never fetch full JSON blobs for dashboard list views.
- Cache link verification results and generated QR exports.
- Avoid blocking dynamic redirects on analytics enrichment.
- Use pagination for QR lists, asset lists, scan events, and audit logs.

## Vertical Slice Implementation Plan

Each phase must ship a complete, testable slice. Do not build hidden infrastructure for weeks without exposing a working product path.

### Phase 1: Platform Foundation

Implementation:

- Remove static export mode and GitHub Pages assumptions.
- Add Vercel-oriented build configuration.
- Add `.env.example` with `DATABASE_URL`, `AUTH_SECRET`, Google OAuth, GitHub OAuth, R2 credentials, Sentry, and app URL values.
- Install and configure Prisma for CockroachDB.
- Add Auth.js with Google and GitHub providers.
- Add server-only Prisma client initialization.
- Add shared API response helpers and request ID generation.
- Add initial CI gates for lint, typecheck, build, and Prisma validation.

Acceptance criteria:

- `npm run build` passes.
- `npm run lint` passes.
- `npx prisma validate` passes.
- Google and GitHub OAuth callback routes exist and are deployable.
- The app can run without static export.
- Protected server utilities cannot be imported by client components.

Implementation status on May 18, 2026:

- Completed the Phase 1 platform foundation.
- Removed static export, production `basePath`, `assetPrefix`, GitHub Pages image assumptions, and `/decode` PWA scope assumptions from runtime configuration.
- Added Vercel configuration through `vercel.json` and replaced the GitHub Pages workflow with CI quality gates.
- Added `.env.example` for app URL, Auth.js, Google OAuth, GitHub OAuth, CockroachDB, Cloudflare R2, and Sentry values.
- Added an ignored local `.env` containing only a non-secret dummy `DATABASE_URL` so `npx prisma validate` works in this workspace without production credentials.
- Installed and configured Prisma `6.19.3` with CockroachDB provider and Auth.js-compatible `User`, `Account`, `Session`, and `VerificationToken` models.
- Added server-only Prisma initialization at `server/db/prisma.ts`.
- Added Auth.js/NextAuth route support with Google and GitHub providers at `app/api/auth/[...nextauth]/route.ts`.
- Added a root `auth.ts` helper for server-side session access.
- Added shared API response helpers, request ID generation, and Zod validation error formatting in `server/api/response.ts`.
- Upgraded Next.js to `16.2.6` and added an npm `postcss` override so production and development dependency audits report zero vulnerabilities.

### Phase 2: Data Model And Workspace Ownership

Implementation:

- Create Prisma models for users, accounts, sessions, workspaces, workspace members, QR codes, assets, landing pages, scan events, link checks, and audit logs.
- Create a default workspace after first sign-in.
- Add repository functions for workspace lookup, QR ownership checks, and audit logging.
- Add dashboard-safe query shapes.

Acceptance criteria:

- A new OAuth user receives a default workspace.
- QR code queries are workspace-scoped.
- Soft-deleted records do not appear in normal dashboard lists.
- Audit log writes are covered by integration tests or mocked service tests.

Implementation status on May 18, 2026:

- Completed the Phase 2 data model and workspace ownership foundation.
- Expanded `prisma/schema.prisma` from Auth.js tables into the platform data model: workspaces, workspace members, QR codes, QR assets, landing pages, scan events, link checks, and audit logs.
- Added a generated CockroachDB migration at `prisma/migrations/20260518161000_phase_2_workspace_ownership/migration.sql`.
- Added `defaultWorkspaceId` and workspace relations to `User` so each OAuth user can receive a default workspace.
- Added an Auth.js `createUser` event that creates a personal workspace, owner membership, user default workspace assignment, and workspace creation audit log in one Prisma transaction.
- Added server-only workspace repository functions for default workspace lookup, workspace list queries, and membership-based access checks.
- Added server-only QR repository functions for workspace-scoped QR lookup, QR ownership checks, and dashboard-safe QR lists that exclude soft-deleted records.
- Added server-only dashboard summary query shapes for QR totals, dynamic QR totals, scan totals, and recent QR code rows without over-fetching JSON payloads.
- Added audit constants and repository functions for audit log creation and entity-scoped audit listing.
- Added Vitest with a mocked audit repository test that verifies audit log writes include workspace scope, actor, action, entity, and metadata.
- Updated CI to run lint, typecheck, tests, Prisma validation, and build.

### Phase 3: Static QR Creation And Rendering

Implementation:

- Add `POST /api/qr-codes`.
- Add QR payload builders for URL, text, email, phone, SMS, Wi-Fi, and vCard.
- Add QR design validation for colors, margin, logo size, dot style, corner style, error correction, and export size.
- Add `POST /api/qr-codes/[id]/render`.
- Store generated exports in R2 for saved QR codes.

Acceptance criteria:

- Each supported static QR type generates a valid payload.
- PNG, JPG PDF and SVG export paths work.
- Invalid color contrast, missing quiet zone, or excessive logo size returns a user-safe warning.
- Saved exports can be downloaded from R2 through a signed URL.

Implementation status on May 18, 2026:

- Completed the Phase 3 static QR creation and rendering backend slice.
- Added `POST /api/qr-codes` with Zod validation, request IDs, structured API responses, transient anonymous payload generation, and authenticated saved QR creation.
- Added payload builders for URL, text, email, phone, SMS, Wi-Fi, and vCard QR codes in `server/qr/payload.ts`.
- Added QR design schema and guardrails for color contrast, quiet-zone margin, logo size, and logo/error-correction combinations.
- Added `POST /api/qr-codes/[id]/render` with explicit Node runtime for Prisma, Sharp, PDFKit, and R2 signing.
- Added server-side QR rendering for PNG, JPG, SVG, and PDF using `qrcode`, `sharp`, and `pdfkit`.
- Added Cloudflare R2-compatible storage helpers using the AWS S3 SDK and signed download URL generation.
- Added QR asset persistence for rendered exports with SHA-256 checksum, content type, file size, bucket, key, and optional public URL.
- Added audit logging for saved QR creation and rendered export asset uploads.
- Added unit tests covering all supported payload builders, scanability warnings, and all four render formats.

### Phase 4: Dynamic QR Redirects And Analytics

Implementation:

- Add dynamic QR mode with reserved slug enforcement.
- Add `GET /r/[slug]`.
- Add scan event logging.
- Add destination update logic with audit logs.
- Add dashboard summary queries for total scans, recent scans, top QR codes, device class, and referrer.

Acceptance criteria:

- A dynamic QR can change destination without changing the QR image.
- Redirects continue working after destination changes.
- Every successful dynamic scan creates a `ScanEvent`.
- Dashboard analytics load with paginated queries.
- Destination changes create audit log entries.

Implementation status on May 18, 2026:

- Completed the Phase 4 dynamic QR redirects and analytics backend slice.
- Extended `POST /api/qr-codes` to support saved dynamic URL QR codes with stable `/r/{slug}` redirect payloads.
- Added reserved slug validation, slug normalization, uniqueness checks, and user-safe conflict responses for dynamic QR creation.
- Added `GET /r/[slug]` to resolve published dynamic QR codes, write scan telemetry, increment scan counts, and redirect to the active destination.
- Added privacy-preserving scan telemetry classification for device class, browser, operating system, referrer, coarse Vercel location headers, salted IP hash, and salted user-agent hash.
- Added `PATCH /api/qr-codes/[id]` for authenticated dynamic destination changes without changing the encoded QR redirect URL.
- Added audit logging for dynamic QR destination changes with previous URL, next URL, and slug metadata.
- Added dashboard analytics queries for total scans, recent scans, top QR codes, scans by device class, and scans by referrer with bounded pagination.
- Added `GET /api/dashboard/summary` for authenticated dashboard analytics loading with workspace access checks and recent-scan pagination.
- Added unit tests for dynamic slug rules, stable dynamic QR payload behavior, destination update audit logging, and privacy-preserving scan telemetry.

### Phase 5: Landing Pages And R2 Assets

Implementation:

- Add landing-page records for profile, business, multiple links, menu, coupon, event, feedback, PDF, images, video link, and audio link.
- Add R2 signed upload flow.
- Add asset confirmation and deletion paths.
- Add server-rendered public landing pages linked from dynamic QR codes.

Acceptance criteria:

- Landing pages can be edited after publication.
- Uploaded files are size-limited, typed, and stored under workspace-scoped prefixes.
- Public landing pages do not expose private R2 keys.
- Dynamic QR redirects can route to a landing page instead of an external URL.

Implementation status on May 18, 2026:

- Completed the Phase 5 landing pages and R2 assets backend slice.
- Added typed landing-page content contracts for profile, business, multiple links, menu, coupon, event, feedback, PDF, images, video link, and audio link pages.
- Added `POST /api/landing-pages` for creating landing pages linked to dynamic QR codes.
- Added `PATCH /api/landing-pages/[id]` so landing pages can be edited after publication.
- Added publication-aware landing-page status handling with audit logs for create, update, publish, and unpublish actions.
- Added R2 presigned upload support at `POST /api/assets/presign` with file type limits, size limits, and workspace-scoped object keys.
- Added support for workspace-scoped unassigned landing-page uploads so media-heavy pages can upload assets before the landing-page record exists, then attach referenced asset IDs during create or update.
- Added `POST /api/assets/[id]/confirm` to verify uploaded R2 objects before marking assets ready.
- Added `DELETE /api/assets/[id]` for authenticated soft deletion and R2 object deletion.
- Added public asset proxying through `GET /api/assets/[id]` so public landing pages reference Decode asset URLs instead of R2 keys.
- Updated `GET /r/[slug]` so published landing pages take precedence over external dynamic destinations while preserving scan analytics.
- Added server-rendered public landing-page HTML with escaped user content, stable sky-blue styling, and asset references routed through the asset proxy.
- Added tests for landing-page content validation, asset ID extraction, safe public rendering, upload policy limits, and workspace-scoped asset keys.

### Phase 6: Link Verification

Implementation:

- Move current local suspicious-link heuristics into `server/links`.
- Add SSRF-safe URL normalization and host validation.
- Add cached `POST /api/links/verify`.
- Add unit tests for safe, suspicious, malformed, punycode, IP, risky TLD, long path, brand spoof, excessive subdomain, and nonstandard port cases.

Acceptance criteria:

- The browser no longer owns the source of truth for safety verdicts.
- Link verdicts include reason codes, confidence, normalized URL, and cache metadata.
- Private-network and localhost URLs never trigger outbound fetches.
- Test coverage exists for every risk category.

Implementation status on May 18, 2026:

- Completed the Phase 6 link verification backend slice.
- Moved suspicious-link rules out of the browser and into `server/links`.
- Added SSRF-safe URL normalization that accepts only HTTP and HTTPS, removes fragments, strips embedded credentials from the normalized URL, and never performs outbound fetches.
- Added host validation for malformed URLs, localhost, private/reserved IP ranges, raw IP hosts, punycode domains, risky TLDs, excessive subdomains, brand-spoof patterns, long paths, excessive path depth, encoded control characters, suspicious keywords, and nonstandard ports.
- Added cached `POST /api/links/verify` backed by `LinkCheck` records with verdict, confidence, reason codes, normalized URL, checked timestamp, expiry timestamp, and cache-hit metadata.
- Updated the link checker UI to call `POST /api/links/verify` instead of calculating verdicts client-side.
- Updated user-facing copy that previously described link checks as local heuristics.
- Added tests for safe links, suspicious links, malformed URLs, punycode, raw/private IPs, localhost, risky TLDs, long paths, brand spoofing, excessive subdomains, nonstandard ports, encoded control characters, and cache behavior.

### Phase 7: Scanner And Decode Services

Implementation:

- Keep camera scanning lazy-loaded on the client for speed.
- Add server image decode fallback route.
- Standardize decode/cipher behavior behind `POST /api/decode`.
- Return explicit validation errors for bad input.

Acceptance criteria:

- Camera scanning still works on supported devices.
- Image upload scanning works through the server fallback.
- Decode tools return deterministic responses through API and UI.
- Heavy scanner code is not part of the initial app shell bundle.

Implementation status on May 18, 2026:

- Completed the Phase 7 scanner and decode services backend slice.
- Added `POST /api/scans/image` for server-side QR image upload decoding with PNG, JPG, and WebP support, an 8 MB file-size limit, bounded input pixels, and explicit validation errors.
- Added server-compatible QR image decoding with Sharp image normalization and `jsqr` pixel decoding.
- Added optional server link-verification summaries for scanned QR image results that contain URL-shaped content.
- Added `POST /api/decode` for deterministic server-side Base64, URL encoding, ROT13, Caesar, Morse, binary, hex, and reverse transforms.
- Added explicit decode errors for invalid Base64, URL encoded input, Morse tokens, binary groups, and hex input instead of silent empty strings.
- Updated the cipher UI to call `POST /api/decode` for output generation.
- Updated image upload scanning to use the server fallback route.
- Kept camera scanning client-side but lazy-loaded: the scanner component is dynamically imported from the home page and `html5-qrcode` is dynamically imported only when camera scanning starts.
- Added unit tests for server decode transforms, invalid decode input, uploaded QR image decoding, URL detection, text QR detection, and image upload validation.

### Phase 8: Hardening, Monitoring, And Release Readiness

Implementation:

- Add Sentry error boundaries and route handler exception capture.
- Add Vercel Analytics and Speed Insights.
- Add structured request logging.
- Add Playwright smoke tests for create QR, dynamic redirect, link verification, scan fallback, and dashboard.
- Add Lighthouse CI or equivalent checks for performance and accessibility.
- Add backup and migration runbook for CockroachDB.

Acceptance criteria:

- Core Web Vitals targets are documented and measured: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.05 on primary routes.
- Production errors include request IDs.
- Preview deployments run automated smoke checks.
- The team has a rollback path for failed deployments and failed migrations.

Implementation status on May 19, 2026:

- Completed the Phase 8 hardening, monitoring, and release-readiness slice.
- Added Sentry for Next.js with server, edge, and client instrumentation files.
- Wrapped Next.js configuration with Sentry build integration and source-map upload support when `SENTRY_AUTH_TOKEN` is configured.
- Added App Router request-error capture through `instrumentation.ts`.
- Added a global error boundary that captures React runtime failures in Sentry.
- Added Vercel Analytics and Speed Insights to the root layout for production page and Core Web Vitals measurement.
- Added structured JSON API response logging with request IDs, status, success state, and error codes.
- Added `x-request-id` headers to structured API responses, dynamic QR landing-page responses, and dynamic QR redirects.
- Added Sentry capture for server 5xx API responses with request ID, status, and API error code tags.
- Added Playwright smoke tests for the primary app shell, anonymous static QR creation, link verification, server image scan fallback, dashboard authentication guard, and an optional configured dynamic QR redirect fixture.
- Added Lighthouse CI budgets for performance, accessibility, LCP, CLS, and Total Blocking Time as the lab proxy for INP.
- Added GitHub CI gates for Playwright smoke checks and Lighthouse CI after the production build.
- Added a `deployment_status` preview smoke workflow that can run against Vercel preview URLs.
- Added `docs/runbooks/release-readiness.md` with Core Web Vitals targets, Sentry/Vercel observability checks, CockroachDB backup expectations, Prisma migration procedure, deployment rollback, and failed migration recovery.

## Testing Strategy

### Unit Tests

- QR payload builders.
- QR customization validation.
- Link verification heuristics.
- Decoder algorithms.
- API response helpers.
- Prisma repository functions with mocked Prisma client.

### Integration Tests

- Auth session availability.
- QR create and render route handlers.
- Dynamic redirect and scan event creation.
- Asset presign route.
- Link verification cache path.
- Server image scan fallback.

### End-to-End Tests

- Create a static URL QR code and download it.
- Create a dynamic QR code, scan/open it, update destination, and confirm redirect changes.
- Upload a logo and generate a branded QR code.
- Verify a suspicious link and inspect reasons.
- Use scanner image upload and copy the decoded result.
- Navigate the dashboard and inspect scan analytics.

### Accessibility And Performance Gates

- Lighthouse accessibility target: 95+ on primary routes.
- Keyboard-only path for authentication, QR creation, link verification, and dashboard navigation.
- 200% browser zoom without content loss.
- Reduced-motion support for animated UI states.
- Bundle analysis after scanner and QR libraries are lazy-loaded.

## Operational Knowledge Map

### Must Know By Heart

- Static QR codes encode final content directly and cannot be edited after distribution.
- Dynamic QR codes encode a Decode redirect URL and can change destination later.
- Every dynamic redirect is a security and trust boundary.
- User-generated URLs and uploads must be validated server-side.
- CockroachDB needs distributed-safe IDs and indexed access patterns.
- R2 object keys must be workspace-scoped and never built from raw user filenames.

### Must Recognize

- SSRF risks from URL verification.
- Scan analytics privacy risks.
- N+1 Prisma query patterns.
- Client bundle bloat from QR and scanner libraries.
- Accessibility regressions in custom steppers, dialogs, menus, and upload controls.
- Phishing abuse through compromised dynamic QR accounts.

### Lookup Only

- Exact Auth.js provider option names.
- Cloudflare R2 S3 operation details.
- Prisma CockroachDB native type edge cases.
- Sentry and Vercel observability setup syntax.
- QR rendering library-specific export APIs.

## References

- QR.io dynamic QR model: https://qr.io/dynamic
- QR.io static QR types: https://qr.io/static
- Next.js route handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Prisma CockroachDB connector: https://docs.prisma.io/docs/v6/orm/overview/databases/cockroachdb
- Cloudflare R2 S3 API: https://developers.cloudflare.com/r2/api/s3/api/
- Auth.js: https://authjs.dev/
- WCAG 2.2: https://www.w3.org/TR/wcag/
