# Decode Admin Frontend Implimentation

## Purpose

Create a dedicated Decode admin interface that behaves like an internal control plane, not a customer dashboard. The UI follows an OpenAI-style admin flow: overview first, persistent left navigation, clear environment context, audit timeline, entity drilldowns, and controlled operational actions.

## Current State Implemented

- [x] Split public product UI from admin UI:
  - Root layout is now the bare document shell.
  - Public pages live under the `(app)` route group and keep the existing `AppShell`.
  - Admin pages use `app/admin/*` without public nav, footer, trusted-by strip, or PWA prompts.
- [x] Added dedicated auth pages:
  - `/admin/register`
  - `/admin/login`
- [x] Added admin console shell with left rail navigation, environment badge, admin identity, role display, and sign-out control.
- [x] Added protected admin routes:
  - `/admin/overview`
  - `/admin/audit`
  - `/admin/users`
  - `/admin/workspaces`
  - `/admin/qr-codes`
  - `/admin/landing-pages`
  - `/admin/assets`
  - `/admin/scans`
  - `/admin/reviews`
  - `/admin/system`
  - `/admin/link-checks`
- [x] Added server-rendered admin resource pages with safe summaries and search.
- [x] Added audit timeline UI with source and request-id filters.
- [x] Added skeleton-ready, table-based operational surfaces using existing Decode UI primitives.

## Frontend Roadmap

### Phase 1: Admin Entry And Layout

- [x] Keep `/admin/register` and `/admin/login` outside the public app shell.
- [x] Use dedicated credential forms and no OAuth buttons.
- [x] Redirect authenticated admins from auth pages to `/admin/overview`.
- [x] Redirect unauthenticated console access to `/admin/login`.
- [ ] Add visual active state to the left rail after route stabilization.

### Phase 2: Overview And Audit

- [x] Ship platform KPI overview for users, workspaces, QR codes, dynamic QR, landing pages, assets, scans, reviews, and link checks.
- [x] Show recent audit activity on the overview page.
- [x] Ship `/admin/audit` as the primary trust surface.
- [x] Filter audit by source and request ID.
- [ ] Add actor, entity type, action, and date-range filter controls.

### Phase 3: Entity Visibility

- [x] Add list pages for platform users, workspaces, QR codes, landing pages, assets, scans, reviews, admin users, and link checks.
- [x] Keep sensitive fields out of the UI: no OAuth tokens, no session tokens, no R2 keys, no raw IPs.
- [x] Show stable status, metric, and updated columns for each resource.
- [ ] Add entity detail pages with linked audit history.
- [ ] Add cursor pagination controls that use returned `nextCursor`.

### Phase 4: Controlled Actions

- [x] Backend mutation routes exist for review moderation, QR archive/restore, admin enable/disable, and workspace review notes.
- [ ] Add guarded action dialogs in the UI with required reason fields.
- [ ] Add optimistic-free refresh behavior after mutations.
- [ ] Add owner-only UI affordances for admin account controls.

### Phase 5: Release Polish

- [x] Admin pages use semantic headings, labels, buttons, and server-rendered content.
- [x] Admin forms expose visible labels and input constraints.
- [ ] Add Playwright smoke coverage for `/admin/register`, `/admin/login`, protected `/admin`, overview, audit filters, logout, and mobile overflow.
- [ ] Add axe checks for admin routes.
- [ ] Add Lighthouse routes after an admin auth fixture exists.

Current smoke status: `npm run smoke:e2e` was attempted. Six existing Phase 8 smoke checks passed; two failed outside the new admin routes because the dev server exposes the Next.js Dev Tools button to the clipping detector and the decode utility UI output assertion timed out.

## UX Standard

- Use a calm control-plane layout: dense but readable, restrained borders, no decorative hero sections.
- Treat audit history as the source of truth for operator trust.
- Keep admin copy operational and direct.
- Do not make destructive controls prominent before rollback and support workflows exist.
- Preserve WCAG 2.2 AA expectations: visible focus, labels, semantic navigation, keyboard-accessible controls, and no horizontal overflow.

## Acceptance Checklist

- [x] `/admin/register` supports name, email, password, confirm password, and 6-10 digit code.
- [x] `/admin/login` supports email/password only.
- [x] Admin routes do not display public app navigation.
- [x] Console has overview, audit, resource inventory, and system surfaces.
- [x] Console access is protected by admin session checks.
- [ ] Admin action dialogs are wired to the low-risk mutation APIs.
- [ ] Mobile/tablet screenshots have been manually reviewed.
- [ ] Playwright admin smoke tests pass.
