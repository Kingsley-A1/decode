# Decode Agent Operating Standard

## Scope

This file applies to the entire `decode/` repository. Every AI coding agent, automation agent, or human-assisted implementation pass must read this file before changing code, plans, configuration, tests, or documentation in this repository.

Higher-priority system, developer, and user instructions still take precedence. When instructions conflict, follow the highest-priority instruction and report the conflict clearly.

## Product Standard

Decode is being professionalized from a static client-only PWA into a Vercel-grade QR platform. The platform direction is documented in:

- `backend-overhaul-plan.md`
- `ui-overhaul-plan.md`

Read both files before making architecture, backend, frontend, database, authentication, storage, scanning, analytics, or UI changes.

The product benchmark is a professional QR platform inspired by QR.io's model: static QR codes, dynamic editable QR codes, controlled customization, landing pages, scan analytics, link verification, scanning, decoding, and predictable user workflows. Do not reduce the product to a cosmetic QR generator.

## Operating Mode

Work like a senior engineer accountable for production quality.

- Start from the actual repository state, not assumptions.
- Search and read before editing.
- Prefer boring, maintainable solutions over clever shortcuts.
- Keep changes scoped to the user's request.
- Avoid unrelated refactors unless they are necessary to complete the work safely.
- Protect existing user work. Do not revert files you did not intentionally change.
- Report what changed, how it was verified, and what remains.

When the user writes `#XSE`, switch to Excellence, Speed, and Efficiency mode: choose the highest-leverage path, make direct technical decisions, remove low-value work, and optimize for shipping without lowering production standards.

## Required First Pass

Before implementation, perform a quick repository pass:

- Check `git status --short`.
- Inspect the relevant files before editing them.
- Use `rg` or `rg --files` for search.
- Identify whether the change affects frontend, backend, API contracts, database schema, auth, storage, or deployment.
- Read the matching overhaul plan section before touching the implementation.

If the task is a code review, lead with findings ordered by severity and include file/line references.

## Engineering Standard

Decode should be built to SWE-Bench Verified expectations: understand the bug or feature, make the smallest correct production change, preserve existing behavior, add focused tests for risk, and verify with real commands.

Default quality gates:

- `npm run lint`
- `npm run build`
- `npx tsc --noEmit` when a typecheck script is not available
- `npx prisma validate` when Prisma schema exists
- Targeted unit, integration, or Playwright tests when the touched area has tests or high product risk

If a gate cannot be run, state why. Do not claim verification that did not happen.

## Architecture Rules

The near-term architecture is a single Next.js app with clear server-only modules, not premature microservices.

- Use Next.js App Router patterns.
- Keep route handlers thin.
- Put business logic in server/domain modules.
- Validate request input with Zod at API boundaries.
- Return structured success and error responses for APIs.
- Keep client components focused on interaction and presentation.
- Keep protected server utilities out of client-importable paths.
- Avoid introducing global state unless the workflow needs it.
- Prefer explicit types. Do not use `any` unless there is a documented boundary reason.

## Backend Rules

Backend implementation must follow the backend overhaul plan.

- Remove static-export assumptions when building backend features.
- Use CockroachDB with Prisma for persistence.
- Use Auth.js with Google and GitHub OAuth for v1 authentication.
- Use Cloudflare R2 for generated QR exports, uploaded logos, PDFs, images, audio, and landing-page media.
- Use soft deletes for business records where deletion affects user data.
- Use transactions for multi-write flows such as QR creation, dynamic destination changes, and audit logging.
- Use pagination for lists.
- Use `select` in Prisma queries to avoid over-fetching.
- Record audit logs for dynamic QR destination changes, destructive actions, and asset changes.

Never fetch arbitrary user-provided URLs from the server unless SSRF protection, timeouts, protocol restrictions, and private-network blocking are implemented.

## Frontend And Design Rules

Frontend implementation must follow the UI overhaul plan.

Decode's v2 design direction is a light, professional sky-blue system:

- Primary sky: `#0EA5E9`
- Primary sky dark: `#0369A1`
- Primary sky soft: `#E0F2FE`
- Ink: `#0F172A`
- Page background: `#F8FAFC`
- Surface: `#FFFFFF`

Use Apple HIG-style clarity and deference. The UI should feel like a serious workspace, not a decorative demo.

- Replace bottom-navigation thinking with a responsive top app shell.
- Avoid nested cards, decorative blobs, heavy gradients, and novelty motion.
- Use icons for familiar tool actions.
- Use restrained cards only for repeated items, dialogs, and genuinely framed tools.
- Do not create marketing-first landing pages when the user asks for an app/tool experience.
- Reserve stable dimensions for QR previews, scanner frames, controls, and dashboards to prevent layout shift.
- Keep text readable and prevent overflow on mobile and desktop.

## QR Product Rules

Static and dynamic QR codes must be treated as different product behaviors.

- Static QR codes encode final content directly and cannot be edited after distribution.
- Dynamic QR codes encode a Decode redirect URL and can change destination later.
- Dynamic QR changes must be auditable.
- Scan analytics must not store raw IP addresses.
- QR customization must protect scanability.

Customization controls should support rich options through guardrails:

- Foreground and background color
- Gradient where safe
- Dot style
- Corner style
- Frame
- Logo
- Quiet zone
- Margin
- Error correction
- Export size
- PNG, SVG, and PDF output

Warn when contrast is poor, a logo is too large, quiet zone is too small, or gradients reduce scan reliability.

## Accessibility Rules

WCAG 2.2 AA is the default accessibility bar.

- Use semantic HTML.
- Keep one clear `h1` per page.
- Associate labels with every form control.
- Use visible focus states.
- Keep touch targets at least 44px by 44px.
- Make dialogs trap focus and close with Escape.
- Use `aria-live` for async results such as scan result, link verdict, copied state, and QR generated state.
- Respect `prefers-reduced-motion`.
- Do not use color as the only status signal.
- Verify keyboard-only operation for changed workflows.

## Performance Rules

Performance is part of the product, not a later cleanup.

Targets:

- LCP <= 2.5 seconds on primary routes.
- INP <= 200 ms on interactive workflows.
- CLS <= 0.05 on generator, scanner, dashboard, and verifier.

Implementation rules:

- Keep the app shell lean.
- Lazy-load scanner, charting, QR rendering internals, and file-heavy components.
- Prefer server rendering for stable content.
- Use skeletons with fixed dimensions.
- Avoid layout shifts in preview panels and scan results.
- Do not ship heavy libraries to the initial route unless required for the first interaction.

## Security Rules

Decode handles URLs, redirects, uploads, and user-generated landing pages. Treat these as abuse surfaces.

- Validate and normalize URLs.
- Block private-network and localhost targets in link verification.
- Sanitize user-generated display content.
- Enforce upload size and content-type limits.
- Use workspace-scoped R2 object keys.
- Never trust client-side validation as the only validation.
- Keep secrets in environment variables.
- Do not log secrets, OAuth tokens, raw IP addresses, or private URLs.

## Documentation Rules

Documentation should be operational, not decorative.

- Update `backend-overhaul-plan.md` or `ui-overhaul-plan.md` when implementation decisions change the agreed direction.
- Keep README changes factual and current.
- Document environment variables in `.env.example`.
- Document new scripts in `package.json` or README when added.
- Prefer checklists and acceptance criteria for implementation plans.

## Git And File Hygiene

- Do not run destructive git commands unless explicitly requested.
- Do not use `git reset --hard`, `git checkout --`, or bulk deletion to solve local changes.
- Avoid formatting unrelated files.
- Use `apply_patch` for manual edits.
- Keep generated build artifacts out of commits unless the repo intentionally tracks them.
- If the worktree is dirty before starting, work around unrelated changes and report only relevant ones.

## Handoff Report

Every completed task should report:

- Files changed.
- What was implemented.
- Verification commands run and their result.
- Known limitations or follow-up work.

Do not end with vague "let me know" language. Provide the next concrete engineering step when useful.
