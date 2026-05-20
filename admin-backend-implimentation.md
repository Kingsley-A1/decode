# Decode Admin Backend Implimentation

## Purpose

Build a separate, audit-first admin control plane for Decode. Admin access is not customer OAuth and is not a workspace role. It uses dedicated credentials, a dedicated admin session cookie, platform-level audit logs, and read-only visibility before operational mutations.

## Current State Implemented

- [x] Added dedicated Prisma models: `AdminUser`, `AdminSession`, `AdminAuthEvent`, and `PlatformAuditLog`.
- [x] Added CockroachDB migration: `20260519143000_admin_control_plane`.
- [x] Added hashed admin registration-code support through `ADMIN_REGISTRATION_CODE_HASH`.
- [x] Added `scripts/hash-admin-secret.mjs` for generating scrypt hashes for 6-10 digit registration codes.
- [x] Added admin env documentation in `.env.example`.
- [x] Added admin auth services for registration, login, logout, session lookup, owner checks, same-origin checks, rate-limit checks, session token hashing, and request telemetry hashing.
- [x] Added admin auth APIs:
  - `POST /api/admin/auth/register`
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout`
  - `GET /api/admin/auth/session`
- [x] Added read-only admin APIs:
  - `GET /api/admin/overview`
  - `GET /api/admin/audit`
  - `GET /api/admin/users`
  - `GET /api/admin/workspaces`
  - `GET /api/admin/qr-codes`
  - `GET /api/admin/landing-pages`
  - `GET /api/admin/assets`
  - `GET /api/admin/scans`
  - `GET /api/admin/reviews`
  - `GET /api/admin/link-checks`
  - `GET /api/admin/admin-users`
- [x] Added low-risk audited mutation APIs:
  - `PATCH /api/admin/reviews/[id]`
  - `PATCH /api/admin/qr-codes/[id]`
  - `PATCH /api/admin/admin-users/[id]`
  - `POST /api/admin/workspaces/[id]/review`
- [x] Added focused unit tests for admin crypto, schemas, and same-origin protection.

## Backend Roadmap

### Phase 1: Admin Foundation

- [x] Keep admin identity separate from customer `User`.
- [x] Store only password hashes, registration-code hashes, and session-token hashes.
- [x] Make first valid registration an `owner`; later valid-code registrations become `admin`.
- [x] Add platform audit records for admin registration, login, logout, status updates, review moderation, QR visibility updates, and workspace reviews.
- [ ] Run `npx prisma migrate deploy` against staging after backup verification.

### Phase 2: Auth Hardening

- [x] Use `__Host-decode_admin_session` with HttpOnly, SameSite Strict, root path, and Secure in production.
- [x] Enforce same-origin checks for state-changing admin auth and mutation routes.
- [x] Rate-limit failed auth attempts by email and hashed IP within a configurable window.
- [ ] Add optional owner-only admin session revocation endpoint.
- [ ] Add admin password rotation and recovery process after email infrastructure is planned.

### Phase 3: Audit-First Visibility

- [x] Add overview KPIs across users, workspaces, QR codes, landing pages, assets, scans, reviews, link checks, and admin users.
- [x] Add unified audit timeline from platform audit logs, workspace audit logs, and admin auth events.
- [x] Add paginated resource list APIs using explicit Prisma `select` shapes.
- [x] Avoid exposing OAuth tokens, session tokens, R2 keys, raw IP addresses, or raw user-agent strings.
- [ ] Add CSV export for owner admins after rate limits and export auditing are defined.

### Phase 4: Controlled Operations

- [x] Add audited review moderation.
- [x] Add audited QR archive/restore visibility changes.
- [x] Add owner-only admin disable/enable.
- [x] Add audited workspace review notes.
- [ ] Add stricter policy checks before destructive operations such as hard deletion, ownership transfer, or asset purge.

## Quality Gates

- [x] `npm run prisma:generate`
- [x] `npm run prisma:validate`
- [x] `npm run test`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] `npm run smoke:e2e`

`npm run smoke:e2e` was attempted after this slice. Six checks passed and two existing Phase 8 smoke checks failed: one flags the Next.js dev tools button during dev-server layout clipping checks, and one decode utility UI expectation times out while the backend decode API smoke passes.

## Operational Notes

- Generate the registration code hash with:

```bash
node scripts/hash-admin-secret.mjs 123456
```

- Store the output in `ADMIN_REGISTRATION_CODE_HASH`.
- Do not store the raw shared code in source control or database records.
- Rotate the shared registration code by replacing the env hash and redeploying.
- Admin registration should be disabled operationally by removing `ADMIN_REGISTRATION_CODE_HASH` after the expected operator accounts exist.
