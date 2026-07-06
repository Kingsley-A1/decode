# Decode UI Overhaul Plan

## Executive Decision

The conventional answer is to repaint the current dark/orange interface with sky blue. The stronger strategic answer is to redesign Decode as a professional QR platform with a controlled design system, predictable product workflows, clear hierarchy, accessibility guarantees, and performance standards that match a Vercel-grade SaaS tool.

Decode should take product inspiration from QR.io's QR creation model: static and dynamic QR choices, many QR content types, rich customization, editable landing pages, and scan analytics. The goal is not to copy QR.io visually. The goal is to professionalize the experience so a user can generate, scan, verify, decode, save, customize, and analyze QR codes without guessing what happens next.

## Current UI Diagnosis

The current interface is a mobile-shell PWA with dark surfaces, orange accents, bottom navigation, dense cards, and multiple browser-heavy tools grouped into a single tabbed home screen. It works as a prototype, but it does not behave like a platform. The UI gives users too many controls without enough workflow structure, uses visual treatment that feels closer to a demo than a professional workspace, and depends on client-side heavy components that can affect perceived performance.

The redesign must move Decode from "tool collection" to "operating platform." The first screen should be the usable QR creation surface, not a marketing page. Navigation must be predictable, customization must be powerful but bounded, and every advanced option must protect QR scanability.

## Current Focus

The immediate focus is Phase 1: Design Tokens And App Shell. Backend platformization is now far enough along that the UI is the bottleneck. Do not start by polishing individual cards or isolated tool panels; first replace the product frame that every route depends on.

The next implementation pass should deliver:

- A light sky-blue token system applied at the app level.
- A responsive top navigation shell for Generate, Scan, Verify Link, Decode, Dashboard, and Docs.
- Removal of bottom navigation as the primary product navigation.
- Stable page containers with `header`, `nav`, and `main` landmarks.
- Visible focus states, 44px touch targets, and reduced-motion defaults.
- Route-level separation for `/generate`, `/scan`, `/verify`, `/decode`, and `/dashboard`, even if some routes initially reuse existing functionality.

Acceptance criteria for the next pass:

- Primary routes use one shared app shell.
- The app no longer reads as a dark/orange prototype on first load.
- Desktop and mobile navigation are predictable and keyboard-accessible.
- No primary route has obvious clipped text, overlapping controls, or unstable shell layout.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass after the slice.

The second pass should be Phase 2: Shared Component Library. The third pass should be Phase 3: QR Generator Workflow. This order matters because rebuilding the generator before the shell and components are stable will create another set of one-off UI patterns.

## Design Principles

### Clarity Before Decoration

Use Apple HIG-style deference: the interface should make content, previews, and actions feel primary. Avoid decorative gradients, floating visual effects, nested cards, heavy shadows, oversized hero sections, and novelty motion. QR generation is an operational workflow; users need confidence, not spectacle.

### Controlled Customization

Decode should support near-endless customization through presets, constraints, and progressive disclosure. Users can change colors, dots, corners, frames, logos, margins, backgrounds, gradients, and export sizes, but the system must warn against low contrast, oversized logos, broken quiet zones, and unsafe color combinations.

### Predictable Workflow

QR creation should follow a consistent three-step model:

1. Choose QR type and enter content.
2. Customize visual design with live preview and scanability guardrails.
3. Download, save, publish, or track the QR code.

This structure applies to static and dynamic QR codes. Dynamic QR codes add destination editing, landing-page configuration, and analytics.

### Accessibility Is A Release Gate

Decode should target WCAG 2.2 AA. Every control needs a semantic element, visible label or accessible name, visible focus state, keyboard path, 44px minimum touch target, and contrast-safe color treatment. Custom widgets such as steppers, tabs, color pickers, dialogs, upload controls, and menus require explicit accessibility testing.

### Performance Shapes The Design

The app shell should load fast and stay stable. Scanner libraries, QR rendering libraries, analytics charts, and export tools should be lazy-loaded or server-backed. Visual layouts must reserve space for previews, loading states, scan results, and generated assets so the UI does not jump during workflow changes.

## Visual System

### Brand Palette

Decode v2 uses a light, professional sky-blue system. Sky blue is the signature color, but the UI must not become one-note. Neutrals carry most surfaces and text; status colors communicate risk, success, and warning.

```text
Primary sky:        #0EA5E9
Primary sky dark:   #0369A1
Primary sky soft:   #E0F2FE
Primary sky pale:   #F0F9FF
Ink:                #0F172A
Muted text:         #475569
Subtle text:        #64748B
Page background:    #F8FAFC
Surface:            #FFFFFF
Surface raised:     #F1F5F9
Border:             #CBD5E1
Border subtle:      #E2E8F0
Success:            #059669
Success soft:       #D1FAE5
Warning:            #D97706
Warning soft:       #FEF3C7
Danger:             #E11D48
Danger soft:        #FFE4E6
Violet accent:      #7C3AED
```

Usage rules:

- Primary buttons, active navigation, selected steps, focus accents, and page `h1` titles use sky.
- Neutral surfaces and borders should dominate the UI.
- Success, warning, and danger colors must always include text or icons; color alone cannot communicate state.
- Gradients are allowed only for QR design previews or user-generated QR styling, not as the main page background.
- Dark mode can exist later, but v1 should default to a polished light theme.

### Typography

Use the existing Geist font or a system-like sans stack. The type scale should be calm and workspace-oriented.

```text
Display: 40/48, semibold, page-level only
H1:      32/40, semibold
H2:      24/32, semibold
H3:      20/28, semibold
Body:    16/24, regular
Small:   14/20, regular or medium
Caption: 12/16, medium
Mono:    code, payload previews, decoded results
```

Do not scale text with viewport width. Use responsive layout changes instead of fluid font sizes. Letter spacing should remain normal.

### Page Headers

Every route (except product documentation) uses one shared header pattern via `PageShell`: an `h1` in the sky-dark accent color, and an optional single-line tagline of eight words or fewer directly beneath it. Do not stack additional kicker/eyebrow labels above the title or multi-sentence descriptions below it — navigation already establishes context, so the header only needs to name the page and state its purpose in one line. Body and section headings elsewhere on the page stay ink/neutral; the accent title is reserved for the one `h1` per page.

### Spacing And Shape

- Use a 4px spacing grid.
- Use 8px radius for most controls and repeated items.
- Use 12px radius only for larger panels and dialogs.
- Avoid pill-heavy UI unless the component is a status badge or segmented control.
- Avoid cards inside cards. Use full-width bands, split panes, side panels, and grouped form sections instead.
- Reserve fixed or responsive dimensions for QR previews, scanners, toolbars, and tiles to prevent layout shift.

## Information Architecture

### App Shell

Replace the bottom navigation with a responsive top navigation app shell.

Primary navigation:

- Generate
- Scan
- Verify Link
- Decode
- Dashboard
- Docs

Right-side actions:

- New QR
- Workspace switcher later
- Profile menu
- Sign in / sign out

Mobile behavior:

- Use a top bar with logo, primary action, and menu button.
- Navigation opens in an accessible sheet/dialog with focus management.
- Primary workflows keep sticky bottom action bars only where they help form completion.

Desktop behavior:

- Use a full-width top bar.
- Main content uses a constrained workspace width.
- QR builder uses a two-pane layout: controls on the left, live preview and actions on the right.

### Route Structure

```text
/                       QR generator entry
/generate               Static and dynamic QR builder
/scan                   Camera and image QR scanner
/verify                 Link verification
/decode                 Decoder and cipher tools
/dashboard              Saved QR codes and account summary
/dashboard/qr/[id]      QR detail, edit, analytics, assets
/dashboard/qr/[id]/edit QR content and design editing
/docs                   Product documentation
/r/[slug]               Dynamic QR redirect or landing-page render
```

The UI should stop grouping every tool into one tabbed home screen. Each product capability deserves a stable route, shareable URL, and focused layout.

## QR Generator Experience

### Step 1: Content

Users choose between `Static` and `Dynamic`, then choose a QR type.

Static v1 QR types:

- Website URL
- Plain text
- Email
- Phone call
- SMS
- WhatsApp
- Wi-Fi
- vCard

Dynamic v1 QR types:

- Website URL
- Profile page
- Business page
- Multiple links
- Menu
- PDF
- Images
- Event
- Coupon
- Feedback

Behavior:

- Show the simplest form for the selected QR type.
- Use inline validation with useful messages.
- Normalize URLs visibly after validation.
- Explain static vs dynamic in plain language: static is fixed forever; dynamic can be edited and tracked.
- Keep advanced fields hidden until the base content is valid.

Acceptance criteria:

- A user can identify the difference between static and dynamic before generating.
- Required fields are labeled and validated.
- Keyboard users can complete the content step without pointer input.
- The continue action is disabled until minimum valid content exists.

### Step 2: Design

The design step controls the QR appearance while preserving scanability.

Customization groups:

- Template presets: clean, rounded, corporate, event, menu, social, coupon.
- Color: foreground, background, gradient, preset swatches, custom hex.
- Dots: square, rounded, dots, classy, extra-rounded.
- Corners: square, rounded, dot.
- Frame: none, scan me, branded label, CTA frame, compact frame.
- Logo: upload, size, background pad, remove.
- Layout: quiet zone, margin, export size.
- Error correction: low, medium, quartile, high.

Guardrails:

- Foreground/background contrast warning.
- Logo too large warning.
- Quiet zone too small warning.
- Transparent background export warning.
- Gradient scanability warning when colors are too close.
- Error correction recommendation when logo is enabled.

Behavior:

- The live preview updates immediately for lightweight changes.
- Final export uses server-rendered output when saved or downloaded.
- Guardrail warnings do not block early exploration, but they block final "publish" unless overridden with an explicit confirmation.
- Provide a "Reset design" action and a "Save as preset" action for authenticated users.

Acceptance criteria:

- A QR preview is visible throughout the design step.
- Controls have labels, descriptions where needed, and visible focus states.
- Color controls expose both swatches and exact hex input.
- The system warns before producing a QR code likely to fail scanning.

### Step 3: Export, Save, Publish

The final step turns the QR code into a usable artifact.

Actions:

- Download PNG.
- Download SVG.
- Download PDF.
- Save to dashboard.
- Publish dynamic QR.
- Copy dynamic short URL.
- Open landing page or redirect target.

Behavior:

- Anonymous users can download static QR codes with limits.
- Authenticated users can save QR codes, assets, design presets, and dynamic destinations.
- Dynamic QR codes show editable destination and analytics availability.
- Export actions should show file format, dimensions, and whether the export is static or dynamic.

Acceptance criteria:

- Export actions are clear and format-specific.
- Saved QR codes appear in the dashboard.
- Dynamic QR codes provide a stable redirect URL.
- The final step clearly communicates whether the QR is editable after download.

## Scanner Experience

The scanner should feel operational and reliable, not experimental.

Layout:

- Camera pane with stable square scan area.
- Secondary upload area for image files.
- Permission state with clear recovery instructions.
- Result panel with decoded content, content type, link safety status, copy, open, share, and rescan actions.

Behavior:

- Lazy-load camera scanner code only on `/scan`.
- Keep sound and vibration optional.
- If camera scanning fails, offer image upload fallback.
- If decoded content is a URL, run link verification before showing the open action as primary.
- Never auto-open scanned links.

Acceptance criteria:

- The scanner works with keyboard-accessible upload controls.
- Permission errors explain the next action.
- Scan results are announced to assistive technology through an appropriate status region.
- Link results display safety state, reasons, and a cautious open flow.

## Link Verification Experience

Link verification should be trustworthy and transparent.

Layout:

- Single input with clear label and paste affordance.
- Primary "Verify link" action.
- Verdict panel with status badge, normalized URL, confidence, reason list, and recommended next action.
- History for authenticated users later.

Verdicts:

- Safe: no obvious red flags found.
- Caution: unusual signals exist but not enough for a strong warning.
- Suspicious: high-risk pattern found.

Behavior:

- Verification runs server-side.
- Private-network, malformed, or unsupported protocol inputs produce direct validation errors.
- Suspicious links require confirmation before opening.
- Reason codes should be human-readable without exaggerating certainty.

Acceptance criteria:

- The UI does not claim a link is guaranteed safe.
- Risk reasons are visible and accessible.
- Users can copy, recheck, clear, and open with confirmation.
- Empty, malformed, and blocked URLs have clear errors.

## Decode And Cipher Tools

Decode tools should be repositioned as utility features inside the platform, not the main brand promise.

Supported tools:

- Base64 encode/decode
- URL encode/decode
- ROT13
- Caesar cipher
- Morse
- Binary
- Hex
- Reverse

Behavior:

- Use a two-pane input/output layout on desktop and stacked layout on mobile.
- Provide algorithm selector, direction toggle, input, output, copy, swap, clear.
- Invalid encoded input should show an error instead of silently returning empty output.
- Keep monospaced output for readability.

Acceptance criteria:

- Every algorithm has deterministic input/output behavior.
- Copy and swap actions are keyboard-accessible.
- Invalid input errors are visible and announced.
- Long output wraps without breaking layout.

## Dashboard Experience

The dashboard is the platform proof point. It should make saved QR codes, dynamic editing, and analytics feel useful.

Primary areas:

- Overview metrics: total QR codes, total scans, dynamic codes, recent scans.
- QR code list with search, filters, status, type, scan count, updated date, and actions.
- QR detail page with preview, destination/content, design settings, assets, analytics, and audit history.
- Empty states that guide users to create their first QR code.

Behavior:

- Use tables for dense management views on desktop.
- Use compact list rows on mobile.
- Keep destructive actions behind confirmation dialogs.
- Show dynamic QR destination history or audit events for trust.

Acceptance criteria:

- Users can find, edit, download, archive, and inspect a saved QR code.
- Dynamic QR analytics are visible without overwhelming the page.
- Empty states provide one clear next action.
- Dashboard list performance remains stable with pagination.

## Component System

Build shared components before redesigning every page.

Required components:

- App shell
- Top navigation
- Mobile navigation sheet
- Button
- Icon button
- Input
- Textarea
- Select
- Segmented control
- Tabs
- Stepper
- Slider
- Color swatch
- Color input
- File upload
- Dialog
- Toast
- Alert
- Badge
- Empty state
- QR preview panel
- Stat tile
- Data table
- Pagination
- Skeleton

Component rules:

- Prefer native HTML controls before ARIA-heavy custom widgets.
- Buttons use icons where the action is familiar, with tooltip or accessible label where needed.
- Every loading state must preserve layout dimensions.
- Every form control must support label, hint, error, disabled, and required states.
- Components should use design tokens, not one-off Tailwind colors.

## Accessibility Standard

Decode should be audited against WCAG 2.2 AA before release.

Requirements:

- Semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- One clear `h1` per page.
- Labels associated with every input.
- Error text connected with `aria-describedby`.
- `aria-live` for async status changes such as generated QR, scan result, link verdict, and copied state.
- Focus trap and escape behavior for dialogs and mobile menu.
- Visible focus ring that meets contrast.
- Touch targets at least 44px by 44px.
- No keyboard traps.
- Text resizes to 200% without loss of function.
- Motion respects `prefers-reduced-motion`.
- Color is never the only status indicator.

Audit checklist:

- Keyboard-only navigation.
- Screen reader pass with NVDA or VoiceOver.
- Browser zoom at 200%.
- Lighthouse accessibility.
- Axe automated scan.
- Manual review of custom widgets.

## Performance Standard

The UI must be designed around fast loading and stable interactions.

Targets:

- LCP <= 2.5 seconds on primary routes.
- INP <= 200 ms on interactive workflows.
- CLS <= 0.05 for generator, scanner, dashboard, and link verifier.
- Lighthouse performance 90+ after production deployment.

Implementation rules:

- Keep the app shell server-rendered.
- Lazy-load scanner, charts, QR rendering internals, and file-heavy controls.
- Use route-level code splitting.
- Use skeletons with fixed dimensions.
- Avoid layout-shifting previews.
- Use server-rendered final QR exports.
- Use optimized image delivery for uploaded assets.
- Avoid continuous animations and decorative motion.

## Vertical Slice Implementation Plan

### Phase 1: Design Tokens And App Shell

Implementation:

- Replace dark/orange CSS variables with sky-blue light-theme tokens.
- Create shared layout primitives and top navigation.
- Remove the bottom navigation from the primary app shell.
- Establish responsive content widths and page templates.
- Add accessible focus styles and reduced-motion handling.

Acceptance criteria:

- Primary routes use the same app shell.
- The app defaults to the sky-blue light design language.
- Navigation works on desktop and mobile.
- Keyboard focus is visible across all navigation and core controls.
- No text overlaps at mobile, tablet, or desktop widths.

### Phase 2: Shared Component Library

Implementation:

- Build core components for buttons, inputs, selects, dialogs, alerts, tabs, steppers, sliders, file upload, color controls, badges, empty states, and skeletons.
- Replace one-off styling in current tools with shared components.
- Define loading, empty, error, disabled, and success states.

Acceptance criteria:

- Generator, scanner, link verifier, and decoder use shared controls.
- Components expose accessible names and descriptions.
- Touch targets meet the 44px standard.
- Visual states are consistent and token-based.

### Phase 3: QR Generator Workflow

Implementation:

- Split the generator into content, design, and export steps.
- Add static/dynamic mode selector.
- Add QR type forms for URL, text, email, phone, SMS, WhatsApp, Wi-Fi, and vCard.
- Add live preview and design controls.
- Add scanability guardrail warnings.

Acceptance criteria:

- Users can complete the full static QR workflow.
- QR type forms validate required fields.
- Preview remains stable while controls change.
- Guardrail warnings appear for unsafe design choices.
- Download actions clearly identify PNG, SVG, and PDF.

### Phase 4: Dynamic QR UI And Dashboard

Implementation:

- Add dashboard overview.
- Add saved QR list.
- Add QR detail/edit page structure.
- Add dynamic destination editing UI.
- Add analytics panels for scans over time, device class, referrers, and recent scans.

Acceptance criteria:

- Users can distinguish static and dynamic QR codes in the dashboard.
- A dynamic QR destination can be edited through a clear form.
- Analytics panels have loading, empty, and populated states.
- Destructive actions require confirmation.

### Phase 5: Landing Page Builder

Implementation:

- Add landing-page templates for profile, business, multiple links, menu, coupon, event, feedback, PDF, images, video link, and audio link.
- Add media upload UI connected to the R2 asset flow.
- Add preview mode for mobile landing pages.

Acceptance criteria:

- Users can edit landing-page content after publication.
- Upload controls validate file type and size before upload.
- Landing-page preview fits mobile and desktop without layout breakage.
- Public landing pages have accessible headings, links, and media labels.

### Phase 6: Scanner And Link Verification Redesign

Implementation:

- Redesign `/scan` with camera, upload fallback, permission states, and result panel.
- Redesign `/verify` with server-backed verdicts, reason codes, confidence, and cautious open flow.
- Link scanner results to verification when decoded content is a URL.

Acceptance criteria:

- Camera and image upload flows both work from the UI.
- Scan results can be copied, shared, cleared, and safely opened.
- Link verdicts show status, reasons, and normalized URL.
- Suspicious links require confirmation before opening.

### Phase 7: Decode Utility Redesign

Implementation:

- Redesign `/decode` as a focused utility surface.
- Add two-pane desktop layout and stacked mobile layout.
- Add API-backed validation for supported algorithms.

Acceptance criteria:

- All supported algorithms work through the new UI.
- Invalid encoded input displays a clear error.
- Long text does not break the layout.
- Copy, swap, clear, and direction controls are keyboard-accessible.

### Phase 8: Quality Gate And Release Polish

Implementation:

- Run Lighthouse and axe checks on primary routes.
- Add Playwright smoke tests for generator, scanner, verifier, decoder, and dashboard.
- Review mobile screenshots at common breakpoints.
- Add final empty states, error boundaries, and skeleton states.

Acceptance criteria:

- Lighthouse accessibility is 95+ on primary routes.
- Core Web Vitals targets are met in production measurement.
- Playwright smoke tests pass.
- No critical UI text overlaps, clipped buttons, or unstable preview regions remain.

## Operational Knowledge Map

### Must Know By Heart

- Static QR means fixed content; dynamic QR means editable redirect or landing page.
- Customization must never sacrifice scanability without warning.
- The QR preview is the anchor of the generator workflow.
- Light sky-blue is the default brand system.
- Every major workflow must be keyboard-accessible.
- Heavy QR, scanner, chart, and upload code should not ship in the initial app shell.

### Must Recognize

- Low contrast QR designs.
- Quiet-zone violations.
- Oversized logos.
- Nested card clutter.
- Button text overflow.
- Mobile navigation focus issues.
- Scanner permission failure states.
- False certainty in link safety language.

### Lookup Only

- Exact WCAG 2.2 criterion numbers.
- Apple HIG and Google Material wording.
- QR rendering library-specific option names.
- Browser camera API edge cases.
- Charting library accessibility APIs.
- Lighthouse CI setup details.

## References

- QR.io dynamic QR model: https://qr.io/dynamic
- QR.io static QR types: https://qr.io/static
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- WCAG 2.2: https://www.w3.org/TR/wcag/
- Next.js route handlers: https://nextjs.org/docs/app/getting-started/route-handlers
