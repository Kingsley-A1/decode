# Decode UI Cleanup Plan

## Executive Decision

The conventional answer is to make the QR generator cleaner by shortening copy, turning long option grids into horizontal swipe selectors, and keeping the QR preview closer to the controls.

The stronger strategic answer is to treat Decode as a professional QR operating workspace: every screen should answer three questions immediately: what am I making, what changed in the QR, and what is the next safe action? This is not a redesign. Keep the current light sky system, route structure, app shell, QR rendering, and component library. The cleanup is a focused product-quality pass on hierarchy, interaction density, mobile ergonomics, accessibility, and scanability confidence.

## Review Inputs

- Local route reviewed: `/generate` on the existing Next dev server.
- Main files reviewed: `components/QRGenerator.tsx`, `components/ui/Stepper.tsx`, `components/ui/SegmentedControl.tsx`, `components/ui/QRPreviewPanel.tsx`, `components/AppShell.tsx`, `components/NavBar.tsx`, `app/(app)/generate/page.tsx`, `app/globals.css`.
- Existing strategy reviewed: `ui-overhaul-plan.md`, `backend-overhaul-plan.md`, `AGENTS.md`.
- External benchmark: [QR.io](https://qr.io/) and QR.io type pages. QR.io proves the market expectation: static/dynamic QR, many QR types, customization, frames, logos, downloads, dashboards, analytics, and editable dynamic codes. Decode should exceed that by reducing friction, showing the live QR sooner, and making scanability trust explicit.
- Standards baseline: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), [Material Design](https://m3.material.io/), and [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines).

## Current Diagnosis

Decode already has the right product skeleton: top navigation, route separation, a three-step QR workflow, live preview, semantic labels, visible focus styles, and a restrained light visual system. The issue is not brand direction. The issue is workflow density.

Measured local render findings:

- Mobile content step document height is about `2968px` on a `390x844` viewport.
- Mobile design step document height is about `5352px`.
- Mobile stepper takes about `310px` before the user reaches the real task.
- Mobile content preview starts around `1793px` from the top, after the primary form.
- Mobile design preview starts around `2897px` from the top, after most controls and all frame cards.
- The frame picker has 6 cards at about `256px` tall each; the last frame card starts around `1804px` into the design step.
- No horizontal overflow was observed. The problem is vertical friction, not layout breakage.
- Step transitions keep the user's scroll position near the previous CTA. After tapping "Continue", the next step can open while the viewport is still deep in the page, causing the sticky nav to visually cover the new step in full-page captures.

Product implications:

- Users do too much reading before acting.
- Users cannot see the QR while selecting many design options on mobile.
- Frame selection feels like a page section, not a fast choice.
- The stepper explains too much and consumes prime mobile space.
- The page footer and trusted-by section compete with an operational workflow.
- The user can complete the task, but the experience feels more like a well-built form than a high-end creation tool.

## Cleanup Principles

### 1. Preview First, Not Preview Last

The QR is the product. On mobile, users should see a compact live preview before or beside important choices, not only after scrolling past the form. Desktop can keep the right sticky preview.

### 2. Choices Should Be Picked, Not Read

QR type, dot style, corner style, frame, templates, and export format are choice controls. They should use compact visual selectors, short labels, icons/thumbnails, and optional details. Avoid paragraphs inside every option.

### 3. Progressive Disclosure Wins

Most users need: content, color, frame, logo, export. Advanced controls such as quiet zone, error correction, export size, and exact hex values should stay available but not dominate the first pass.

### 4. One Clear Next Action

Every step needs one dominant next action and one secondary back/edit action. On mobile, primary actions should stay reachable in a bottom action bar without hiding content.

### 5. Scanability Is A Trust Signal

Warnings should become a compact "scanability status" system, not just alert boxes. Users should always know whether their design is safe, risky, or blocked.

## Priority Implementation Checklist

### Phase 1 - Mobile Builder Friction Cleanup

Goal: make the current QR generator feel faster without changing the backend or product model.

- [x] Replace the verbose mobile stepper with a compact progress header.
  - Mobile target: max `56px` height.
  - Show `Content`, `Design`, `Export` as compact steps with `aria-current="step"`.
  - Keep the existing descriptive step cards only for tablet/desktop if they still help.
- [x] Add scroll and focus management between steps.
  - When moving from Content to Design or Design to Export, scroll the builder top into view.
  - Programmatically focus the new step heading with `tabIndex={-1}`.
  - Add `scroll-margin-top` so sticky nav never obscures the focused heading.
- [x] Move mobile preview into a compact preview tray near the top of the builder.
  - Show QR thumbnail, mode, type, scanability status, and an "Expand" action.
  - Keep the full `QRPreviewPanel` in the desktop aside.
  - On mobile, avoid making users reach the bottom before seeing the QR result.
- [x] Convert QR type selection from a 2-column description grid to a horizontal choice rail.
  - Use short labels: URL, Text, Email, Phone, SMS, WhatsApp, Wi-Fi, vCard.
  - Put the explanation below the selected option, not repeated inside every card.
  - Keep disabled dynamic-only states accessible with clear messaging.
- [x] Convert frame selection to a horizontal swipe rail.
  - Each frame card should be about `148-180px` wide on mobile.
  - Use `overflow-x-auto`, `scroll-snap-type: x mandatory`, and visible selected state.
  - Keep thumbnail first, then short label. Move "best for" into a subtle tooltip or selected detail row.
  - Target: the full frame picker should take less than `300px` vertical space on mobile.
- [x] Reduce content copy.
  - Remove or collapse repeated paragraphs that explain static/dynamic and design guardrails.
  - Keep direct inline help only where the choice has real consequences.
- [x] Add a mobile sticky action bar inside the builder.
  - Content: `Continue to design`.
  - Design: `Back`, `Continue to export`.
  - Export: `Download PNG`, secondary formats in a menu or rail.
  - Respect safe-area insets and never cover focused inputs.

Acceptance criteria:

- [x] On `390x844`, the content step primary CTA is reachable within about `1.4` viewport heights.
- [x] On `390x844`, a QR preview or preview tray is visible within the first viewport after the page header.
- [x] On `390x844`, the design step no longer requires scrolling through six full-height frame cards.
- [x] Step changes land the user at the new step heading, not at the previous scroll depth.
- [x] `npm run lint`, `npm run typecheck`, and targeted Playwright generator tests pass.

### Phase 2 - Reusable Choice And Action Components

Goal: avoid one-off cleanup and create reusable primitives for the rest of Decode.

- [x] Add `ChoiceRail` to `components/ui`.
  - Props: `value`, `options`, `onChange`, `label`, `size`, `renderPreview`, `getDescription`.
  - Semantics: use a `fieldset`/`legend` or radio-group pattern for mutually exclusive choices.
  - Keyboard: Tab into the group, arrow keys or native radio behavior where practical, Enter/Space selects.
  - Mobile: horizontal snap rail.
  - Desktop: can wrap into compact grid.
- [x] Add `MobilePreviewTray`.
  - Compact QR thumbnail, current payload summary, scanability badge, expand/collapse action.
  - Should not duplicate the full desktop preview markup unnecessarily.
- [x] Add `BuilderActionBar`.
  - Handles mobile sticky actions and desktop inline actions from one API.
  - Includes safe-area padding and focus-safe behavior.
- [x] Add `ProgressStepper` variants.
  - `compact` for mobile.
  - `cards` for desktop.
  - Current step should be conveyed by text, icon, and ARIA, not color alone.
- [x] Add `DisclosureSection` for advanced controls.
  - Default open state can depend on warnings or user changes.
  - Advanced design controls should remain reachable without overwhelming first-time users.

Acceptance criteria:

- [x] QR type, dot style, corner style, frame, and export choices share consistent selection behavior.
- [x] Touch targets remain at least `44x44px`.
- [x] Keyboard operation works without pointer input.
- [x] Axe has no serious or critical WCAG violations on `/generate`.

### Phase 3 - Design Step Professionalization

Goal: make customization feel premium and safer, not longer.

- [x] Add template presets before granular controls.
  - Examples: Clean, Corporate, Event, Menu, Social, Coupon.
  - Presets should set dot style, corner style, color, frame, and error correction together.
  - Keep "Custom" when users manually change a setting.
- [x] Reorder design controls by real user priority.
  - Recommended first pass: Templates, Color, Frame, Logo.
  - Advanced: Dots, Corners, Quiet zone, Error correction, Export size.
- [x] Replace alert-only guardrails with a scanability meter.
  - States: `Ready`, `Needs attention`, `Blocked for publish`.
  - Show reasons in a compact list.
  - Block final publish for objectively unsafe combinations unless an explicit override is part of product policy.
- [x] Improve frame thumbnails.
  - Ensure dark frames do not hide tiny CTA text.
  - Keep thumbnails visually comparable by using stable dimensions.
  - Avoid cards that look selected because of hover or screenshot artifacts.
- [x] Add "Reset design" and later "Save as preset".
  - Reset should restore safe defaults.
  - Save preset can wait for authenticated workspace UX.

Acceptance criteria:

- [x] A user can create a polished framed QR with color and logo without opening advanced controls.
- [x] A risky design produces a clear, actionable scanability reason.
- [x] Frame changes update preview immediately and keep the selected frame visible in the rail.
- [x] Design controls do not cause layout shift in the preview area.

### Phase 4 - Workspace Chrome Cleanup

Goal: make operational pages feel like tools, not landing pages.

- [x] Add an `AppShell` mode for workspace pages.
  - Example: `chrome="workspace"` hides or compresses `TrustedBy` and large footer sections.
  - Keep marketing trust content for public/marketing routes.
- [x] Reduce `/generate` page header height.
  - Current page intro repeats platform readiness language.
  - Use a shorter title block: title, one-line purpose, dashboard action.
- [x] Keep sticky nav from competing with builder controls.
  - Confirm sticky top offsets for focused headings and preview panels.
  - Avoid mid-page sticky visual collisions during transitions.
- [x] Review route-level navigation priority.
  - Current top nav includes `Pages`; this is valid for platform direction.
  - Make sure the primary "New QR" action stays visible without crowding mobile.

Acceptance criteria:

- [x] `/generate` feels like a creation workspace from the first viewport.
- [x] Footer/trust content no longer distracts during active QR creation.
- [x] No fixed or sticky element obscures focused content.

### Phase 5 - Verification And Release Gate

Goal: make the cleanup measurable and safe to ship.

- [x] Update Playwright coverage for the new mobile flow.
  - Assert no horizontal overflow.
  - Assert compact stepper renders on mobile.
  - Assert frame rail is horizontally scrollable and selectable.
  - Assert preview tray is visible on mobile.
  - Assert step transition focuses the next heading.
- [x] Keep existing axe checks and add builder-specific assertions.
  - Check WCAG 2.2 tags through `@axe-core/playwright`.
  - Manually test keyboard-only operation for rails, disclosures, file upload, and export.
- [x] Run visual screenshots at:
  - `390x844`
  - `768x1024`
  - `1366x900`
- [x] Run quality gates:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run smoke:e2e` for generator changes
  - `npm run build`

Acceptance criteria:

- [x] The generator remains functional for static URL QR creation.
- [x] Frame selection, preview update, and export step still pass smoke tests.
- [x] No serious accessibility regressions.
- [x] No mobile horizontal overflow.
- [ ] No clipped button text.

## Specific File-Level Recommendations

### `components/QRGenerator.tsx`

- Split builder UI into smaller components after Phase 1 proves the interaction model:
  - `ContentStep`
  - `DesignStep`
  - `ExportStep`
  - `FramePicker`
  - `MobilePreviewTray`
  - `BuilderActionBar`
- Add refs for step headings and builder container.
- Add a `goToStep(nextStep)` helper that sets state, scrolls, and focuses.
- Keep payload and validation logic where it is until UI cleanup stabilizes. Do not mix this pass with backend contract changes.

### `components/ui/Stepper.tsx`

- Add compact variant.
- Add `aria-current="step"` to the current step item.
- Remove descriptions on mobile.
- Keep color plus icon/text status for complete/current/incomplete.

### `components/ui/SegmentedControl.tsx`

- Keep for simple binary controls like Static/Dynamic.
- Do not force it to become the universal answer for frame cards and visual choices.
- For QR type and frames, introduce `ChoiceRail` instead of overloading this component.

### `components/ui/QRPreviewPanel.tsx`

- Keep desktop full preview.
- Add composition support for compact/mobile preview states.
- Reserve dimensions for loading and rendered QR to avoid layout shift.

### `components/AppShell.tsx`

- Add a route-aware or prop-based workspace chrome mode.
- Do not show trust/footer content by default under active creation workflows.

## Mobile-First Layout Target

Recommended `/generate` mobile order:

1. App nav.
2. Short page header.
3. Compact step progress.
4. Compact preview tray.
5. Active step controls.
6. Sticky builder action bar.
7. Optional full preview/details.

Recommended desktop order:

1. App nav.
2. Short page header with dashboard action.
3. Full-width stepper.
4. Two-pane builder:
   - Left: active controls.
   - Right: sticky preview, payload summary, scanability state.

## Interaction Patterns

### Horizontal Choice Rail

Use for:

- QR type.
- Frame.
- Template preset.
- Export format on mobile.

Do not use for:

- Long forms.
- Multi-select settings.
- Critical confirmations.

Accessibility requirements:

- Every selectable item has an accessible name.
- Current item exposes selected state.
- Keyboard users can reach and change the selected option.
- The rail must not require drag-only interaction.
- The selected option must be visible after state changes.

### Advanced Disclosure

Use for:

- Exact hex inputs if presets are enough for most users.
- Error correction.
- Export size.
- Quiet zone.
- Logo size.

Do not hide:

- Required content fields.
- Primary frame choice.
- Scanability warnings.
- Final export actions.

### Mobile Preview Tray

Use for:

- QR thumbnail.
- Payload summary.
- Static/dynamic badge.
- Scanability state.

Do not use it as:

- A decorative card.
- A replacement for the full preview.
- A sticky element that blocks form fields.

## Content Cleanup Rules

- Replace explanatory paragraphs with direct labels and short selected-state summaries.
- Keep helper text only when it prevents a mistake.
- Use action language: `Enter website URL`, `Choose frame`, `Download PNG`.
- Avoid repeating "QR" inside every nearby label when the context is already QR creation.
- Put detailed education in docs or help popovers, not the primary builder path.

Before:

- "Static QR codes encode final content directly. Dynamic QR codes encode a Decode redirect URL that can be edited after publishing."

After:

- Static: "Fixed after download."
- Dynamic: "Editable and trackable."
- Selected helper: "Dynamic QR codes use a Decode redirect URL so you can change the destination later."

## Knowledge Split

### Must Know By Heart

- Static QR means fixed payload; dynamic QR means editable redirect or landing page.
- Preview must stay close to customization controls.
- Every primary control needs a visible label or accessible name.
- Touch targets need at least `44x44px`.
- Scanability depends on contrast, quiet zone, logo size, error correction, and payload density.
- Step transitions must manage focus and scroll.

### Must Recognize

- A choice grid is not the same thing as a form.
- A carousel/rail must still work by keyboard.
- Too many cards make mobile feel slow even when performance is fine.
- Sticky elements can obscure focused content if scroll margins are not handled.
- Marketing trust sections can hurt operational focus inside a creation workflow.

### Lookup-Only

- Exact WCAG success criterion numbers.
- Browser-specific support details for newer CSS scroll and container features.
- QR code version/data capacity tables.
- Print-size formulas by distance and environment.
- Advanced analytics/dashboard copy once workspace data is real.

## Non-Goals

- Do not redesign the brand palette.
- Do not replace the app shell.
- Do not rebuild backend QR creation in this pass.
- Do not add new QR types before the core creator feels excellent.
- Do not turn the generator into a marketing landing page.
- Do not remove advanced controls; disclose them better.
- Do not trade accessibility for swipe-only interactions.

## Definition Of Done

The cleanup is done when a mobile user can create a polished URL QR code, choose a frame, see the result while making choices, and export without feeling like they are reading a setup manual.

Measurable finish line:

- [ ] Mobile content step is materially shorter than the current `2968px` page.
- [ ] Mobile design step is materially shorter than the current `5352px` page.
- [ ] Frame selection no longer creates a multi-screen vertical wall.
- [ ] Preview is visible early on mobile and persistent on desktop.
- [ ] Step changes reset focus and scroll correctly.
- [ ] No horizontal overflow on primary breakpoints.
- [ ] No serious axe violations.
- [ ] Existing generator workflow tests continue to pass.
