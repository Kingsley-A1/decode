@Deprecated
# QR Generation UI — Code Review

**Scope:** `app/(app)/generate/page.tsx`, `components/QRGenerator.tsx` (3,599 lines), `hooks/useQRCode.ts`

> **Status: Resolved.** All findings below have been addressed. `components/QRGenerator.tsx`
> was split into a focused `components/qr-generator/` module set (logic, step views, an
> orchestration hook, and a thin container) with unit tests, and the correctness/UX fixes
> (#1–#8) were implemented. The inverted-contrast guardrail (#3) was also mirrored in the
> server's `getQRDesignWarnings` for cross-layer parity. This document is retained as the
> original point-in-time review.

The builder is well-structured for a single file: a clean 3-step flow (Content → Design → Export),
good focus management on step changes, `aria-live` status regions, sensible payload/preview memoization,
and a thoughtful auth-draft persistence path. The findings below are ordered by severity.

---

## High / Correctness

### 1. Most of the "scanability" guardrail logic is dead code
`getScanability` (lines 3097–3179) gates publishing on margin, error-correction level, and logo size — but
**the UI exposes no control for any of them**, so those branches can never fire.

- `design.margin` is `16` at init (line 755) and every preset hard-codes `margin: 16` (414–475). There is no
  margin input anywhere in `DesignStep`. The checks `design.margin < 2` (blocked, 3131) and `< 4` (warning, 3134)
  are unreachable.
- `design.errorCorrectionLevel` is `"Q"` at init and in every preset. No control sets it. The
  "use quartile or high correction with a logo" warning (3145–3150) is unreachable.
- `design.logoSizeRatio` is only ever `0` or exactly `defaultLogoSizeRatio` (`0.26`, set by `applyLogoSafeDesign`,
  1049–1057). So `> 0.3` (blocked, 3138) and `> 0.26` *strictly* (warning, 3141) are both unreachable.

Net effect: only the color/contrast checks can ever trigger. The other ~40 lines give a false sense of a
guardrail system that isn't actually guarding anything.

**Worse, the copy advertises controls that don't exist.** The meter can tell users
"Use margin 4 or higher" or "Use quartile or high error correction" — with no UI to act on the advice.

**Fix (pick one):**
- Wire up the missing controls (margin slider, error-correction select, logo-size slider) in the Advanced
  Design disclosure — they already exist in `DesignState`, `getApiDesign`, and the renderer, so this is mostly UI; **or**
- Drop `margin` / `errorCorrectionLevel` / `logoSizeRatio` from editable state, make them constants, and delete the
  dead branches + their copy.

### 2. `persistAuthDraft` can throw an unhandled `QuotaExceededError`
`persistAuthDraft` (988–1008) JSON-stringifies the full draft — **including `logoUrl`, which is a base64 data URL**
for uploaded logos — into `localStorage` with no `try/catch`. An uploaded logo can easily be several MB; data-URL
encoding inflates it ~33%, and `localStorage` is typically capped around 5 MB. When it overflows, `setItem` throws.

It's called on the unauthenticated branches of the export flow — `handleDownloadSelected` (1172),
`handlePublishDynamic` (1284), `handleSaveStatic` (1364) — so the throw surfaces as an uncaught exception right at
the "sign in to continue" moment, breaking the flow instead of showing the sign-in panel.

**Fix:** wrap the `setItem` in `try/catch`; on failure, still show the auth prompt but degrade gracefully (e.g.
persist the draft without `logoUrl`, or surface a "couldn't save your draft locally" note). Compare with
`readQRGeneratorAuthDraft` (3351), which *is* defensively wrapped.

### 3. No inverted-contrast guard
`getContrastRatio` (3539) uses the absolute WCAG ratio, which is symmetric — it doesn't care which color is darker.
A **light foreground on a dark background** passes the contrast check but produces an inverted QR that many scanners
(and most print/scan pipelines) read unreliably. This is arguably the single most common real-world scanability
failure and the meter currently misses it.

**Fix:** in `getScanability`, also flag (warning, not block) when `getRelativeLuminance(foreground) >
getRelativeLuminance(background)` — i.e. dots lighter than the canvas.

Related: the thresholds are lenient for QR specifically — blocked only below `2:1` and warning below `3:1` (3119,
3124). QR codes want near-black-on-white; consider raising the warning threshold.

---

## Medium / UX & robustness

### 4. `mailto` encodes spaces as `+`
`buildPayload` builds the email payload with `URLSearchParams` (3036–3040), which encodes spaces as `+`. In
`mailto:` subject/body, several mail clients render `+` literally ("Spring+Sale"). Use `encodeURIComponent` and/or
replace `+` with `%20` for the query string.

### 5. SMS/WhatsApp message text isn't delimiter-safe
`SMSTO:${phone}:${message}` (3050) interpolates the raw message. A `:` or newline in the message corrupts the
payload structure. WhatsApp's text *is* `encodeURIComponent`-escaped (3057), but SMS is not — inconsistent.
Encode/escape the SMS message too.

### 6. Static vs. dynamic download filenames diverge
Static PNG/SVG downloads use `decode-qr-${Date.now()}` (useQRCode.ts 131) and ignore the user's title, while the
static PDF path *does* pass `form.title` (1137) and the dynamic server download uses `form.title` (1237). Same
builder, three different naming conventions. Prefer the title-based name consistently.

### 7. `savedQRCodeId` persists across content/type changes
After a static save, `savedQRCodeId` stays set; the "Saved to workspace → View saved QR code" success alert
(2547–2556) keeps pointing at the old record even after the user changes the type or content to build a different
code. Reset `savedQRCodeId` / `publishStatus` on `type`/`mode`/content change (similar to the stale-publish effect
at 968–973).

### 8. Fragile logo-size fallback in the renderer
`useQRCode` uses `imageSize: options.logoSize || 0.4` (line 86). If a logo URL is ever present with
`logoSizeRatio === 0`, the QR silently renders a 40%-size logo that would cover required modules. Today
`applyLogoSafeDesign` prevents that combination, but the coupling is implicit. Make the fallback explicit/smaller, or
derive `logoSize` so it can't exceed the scanability cap.

---

## Low / Maintainability

### 9. One 3,599-line module
`QRGenerator.tsx` holds the container, `ContentStep`, `ContentFields`, `DesignStep`, `ExportStep`, `FramePicker`,
`QRFrame`, all the option tables, and ~25 pure helpers. Splitting into a `components/qr-generator/` folder
(`steps/`, `QRFrame.tsx`, `payload.ts`, `scanability.ts`, `validation.ts`, `constants.ts`) would cut cognitive load
substantially and make the pure logic individually testable.

### 10. No unit tests for substantial pure logic
`validateContent`, `buildPayload`, `normalizeHttpUrl` / `getHttpUrlValidationError`, `getScanability`,
`getContrastRatio`, and the `escapeWifiValue` / `escapeVCardValue` helpers are deterministic, edge-case-heavy, and
currently untested (only `tests/smoke/release.spec.ts` touches the generate route). These are high-value, cheap
Vitest targets — e.g. URL normalization variants, vCard/Wi-Fi escaping, contrast math. Adding them would also
backstop any refactor from #9.

### 11. Editable state the UI can't reach
Tied to #1: `DesignState` carries `margin`, `errorCorrectionLevel`, and (effectively) a fixed `logoSizeRatio` that
the UI never lets the user change. Either surface controls or demote them to constants so the state shape matches
what's actually editable.

---

## What's good (keep)
- Step transition focus management and scroll reset (957–966) — accessible and deliberate.
- Payload/preview separation with `previewValue` letting dynamic codes preview before publish (863–875).
- `dynamicPublishSignature` staleness detection so a published QR is correctly marked "Preview only" after edits
  (816–824, 968–973, 3491–3510) — nice touch, and it deliberately avoids hashing the full logo data URL.
- `logoSelectionRequestRef` guards against out-of-order async logo loads (1063, 1100–1103).
- Robust draft rehydration with per-field type guards (3351–3414).
- vCard and Wi-Fi value escaping (3568–3574) are present and correct.

---

## Suggested priority
1. **#2** (unhandled quota throw) — smallest fix, prevents a hard break in the auth flow.
2. **#1 / #11** — decide: wire the controls or delete the dead guardrails + misleading copy.
3. **#3** — inverted-contrast check; meaningful real-world scan reliability win.
4. **#4–#7** — payload-encoding and state-reset polish.
5. **#9 / #10** — structural cleanup + tests, ideally together.
