@Deprecated
# Decode Current Focus

Last updated: May 19, 2026

## Current Decision

Backend platformization Phases 1-8 are now implemented as the working foundation: full-stack Next.js, Prisma/CockroachDB schema, Auth.js OAuth, R2 asset flows, static and dynamic QR services, landing pages, link verification, scanner fallback, decode services, observability, smoke tests, and release runbooks.

The next focus is UI platformization. The existing UI still behaves like the original dark/orange prototype, while the backend now supports a professional QR platform. Product quality is currently bottlenecked by the front end: navigation, workflow structure, component consistency, accessibility, and visual system.

## Immediate Priority

Start with `ui-overhaul-plan.md` Phase 1: Design Tokens And App Shell.

This is the highest-leverage next slice because every later screen depends on it. Do not redesign the generator, scanner, dashboard, or verifier independently before the design tokens, top navigation, responsive shell, focus states, and route structure are stable.

## Next Three Vertical Slices

### Slice 1: Design Tokens And App Shell

Deliver the light sky-blue platform shell.

Implementation focus:

- Replace dark/orange app-level styling with the sky-blue light token system.
- Add a responsive top app shell with Generate, Scan, Verify Link, Decode, Dashboard, and Docs.
- Remove the bottom navigation as the primary navigation pattern.
- Add stable page containers, semantic landmarks, visible focus states, and reduced-motion defaults.
- Keep the first screen as the actual QR workflow entry, not a marketing page.

Acceptance criteria:

- Primary routes share the same top app shell.
- The app defaults to the light sky-blue system.
- Navigation works on desktop and mobile.
- Keyboard focus is visible across navigation and core controls.
- No primary route has obvious text overlap or clipped controls at mobile, tablet, or desktop widths.

### Slice 2: Shared Component Library

Create the reusable UI primitives before rebuilding full workflows.

Implementation focus:

- Build token-based Button, IconButton, Input, Textarea, Select, Dialog, Alert, Tabs, Stepper, Badge, Skeleton, FileUpload, ColorSwatch, and EmptyState components.
- Replace one-off styling in the generator, scanner, link verifier, and decoder as those screens are touched.
- Standardize loading, error, empty, disabled, selected, and success states.

Acceptance criteria:

- Core workflow screens can use shared controls without duplicating visual rules.
- Form controls expose labels, hints, errors, disabled state, and required state.
- Buttons and icon buttons meet 44px touch target expectations.
- Components pass basic keyboard and screen-reader checks.

### Slice 3: QR Generator Workflow

Rebuild the generator as a guided professional workflow.

Implementation focus:

- Split QR creation into Content, Design, and Export steps.
- Add static vs dynamic mode selection.
- Add QR type forms for URL, text, email, phone, SMS, Wi-Fi, and vCard first.
- Connect to the existing `/api/qr-codes` and render endpoints.
- Add live preview and scanability guardrail warnings.

Acceptance criteria:

- A user can create and download a static QR through the new workflow.
- Static vs dynamic behavior is clear before generation.
- Required fields validate inline.
- Preview dimensions stay stable while controls change.
- Unsafe color, logo, and quiet-zone choices show clear warnings.

## Backend Support Work Only

Backend work should be limited to release support unless it directly unblocks the UI slices.

Allowed backend support:

- Configure real Sentry/Vercel/GitHub environment secrets.
- Add `SMOKE_DYNAMIC_SLUG` for preview smoke checks.
- Run and verify CockroachDB migrations in the connected environment.
- Add rate limiting where a UI workflow exposes anonymous abuse surfaces.
- Add small response fields needed by the new UI.

Avoid starting new backend product surfaces until the UI shell and generator workflow are usable.

## Quality Bar For The Next Slice

Every UI slice must end with:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Relevant Playwright smoke coverage when a workflow changes
- Manual viewport review for mobile and desktop layout stability

For documentation-only changes, record that no runtime tests were needed.
