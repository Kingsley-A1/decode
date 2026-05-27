# Scan One Tap Action

Checked: 2026-05-26

## Product Direction

The `/scan` route should open directly into a ready camera scanner when the browser permits it. The page should not behave like a generic upload utility; it should feel like a fast action surface for people who need to scan, verify, and act on a QR code in one flow.

The default action is camera-first on mobile and laptop devices with a camera. If permission is missing, blocked, or unsupported, the page should immediately show the upload fallback without making the user hunt for it.

## One Tap Flow

The first viewport should contain one primary control: `Scan QR`. On tap, Decode requests camera permission, opens the rear camera when available, and starts scanning in the same viewport. Returning users who previously granted camera access can auto-start scanning after a short visible loading state, but the route should still keep a manual stop button.

Successful scans should move through three states without a page reload:

1. Decode QR content.
2. Verify URL safety when the content is a URL.
3. Offer the correct action: open link, copy text, call number, join Wi-Fi, save contact, or attach result to a Decode workflow.

The scan result should persist in a small recent-scans tray for the current session so a user can compare or recover the last scan after closing a dialog.

## Differentiation

Most QR scanners stop at "read the code." Decode should stand out by treating scanning as a decision workflow.

The product advantage should be:

- Instant safety verdict for links using `/api/links/verify`.
- Clear destination preview before opening external URLs.
- One-tap actions based on QR type, not raw text only.
- Scan history for the session with copy and reopen actions.
- Dynamic QR recognition for Decode-owned `/r/{slug}` links, showing destination, status, and analytics access when the signed-in user owns the code.
- Business context when scanning Decode landing-page QR codes, such as attached page title and last updated time.

## Analytics Needed

Track scanner performance and user trust signals without storing private QR payloads by default.

Events:

```txt
scan_opened
scan_permission_requested
scan_permission_granted
scan_permission_denied
scan_camera_started
scan_camera_failed
scan_upload_started
scan_success
scan_verify_started
scan_verify_success
scan_verify_warning
scan_action_opened
scan_action_copied
scan_action_saved
```

Metrics:

- Time from tap to camera ready.
- Time from camera ready to first successful scan.
- Camera permission grant rate.
- Upload fallback usage rate.
- Scan decode failure rate by device/browser.
- Link warning rate.
- External open-through rate after warning.

Payload privacy:

- Do not store raw scanned content unless the user explicitly saves it.
- Store content type, normalized host for URLs, risk category, browser, device class, and timing.
- Hash raw payloads only when deduplication is needed.

## Implementation Notes

Use a proven scanner library rather than hand-rolling camera frame parsing. The scanner component should own camera lifecycle, cleanup streams on unmount, and expose decoded content to the Decode verification pipeline.

Recommended route behavior:

```txt
/scan
  idle -> requesting-permission -> scanning -> verifying -> result
       -> fallback-upload when camera is unavailable
```

The scan UI should reserve a stable square camera frame so controls do not jump when permission or result states change. The main action button should meet a 44px touch target, and the camera stop button should remain visible after scanning starts.

## Production Checklist

- [ ] Camera-first mobile flow with rear-camera preference.
- [ ] Upload fallback for blocked camera access.
- [ ] URL safety verification before opening scanned links.
- [ ] QR type-specific actions.
- [ ] Session recent-scans tray.
- [ ] Permission, latency, success, and warning analytics.
- [ ] No raw scan payload storage by default.
- [ ] Playwright coverage for upload fallback and result states.
- [ ] Manual mobile checks on Chrome Android and Safari iOS.

