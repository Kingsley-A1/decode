import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import QRCode from "qrcode";

const primaryRoutes = [
  { path: "/generate", heading: "Generate QR codes" },
  { path: "/scan", heading: "Scan QR codes" },
  { path: "/links", heading: "Links" },
  { path: "/decode", heading: "Decode utility" },
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/landing-pages", heading: "Landing pages" },
  { path: "/privacy", heading: "Privacy Policy" },
  { path: "/terms", heading: "Terms of Service" },
] as const;

const screenshotViewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 900 },
] as const;

type DecodeRoundTripCase = {
  readonly algorithm: string;
  readonly input: string;
  readonly encoded: string;
  readonly shift?: number;
};

const decodeRoundTripCases: readonly DecodeRoundTripCase[] = [
  {
    algorithm: "caesar",
    input: "Decode Platform",
    encoded: "Ghfrgh Sodwirup",
    shift: 3,
  },
  {
    algorithm: "base64",
    input: "Decode Platform",
    encoded: "RGVjb2RlIFBsYXRmb3Jt",
  },
  { algorithm: "rot13", input: "hello", encoded: "uryyb" },
  { algorithm: "reverse", input: "decode", encoded: "edoced" },
  {
    algorithm: "morse",
    input: "SOS 2026",
    encoded: "... --- ... / ..--- ----- ..--- -....",
  },
  {
    algorithm: "binary",
    input: "Hi",
    encoded: "01001000 01101001",
  },
  { algorithm: "hex", input: "Hi", encoded: "4869" },
  {
    algorithm: "url",
    input: "Decode Platform",
    encoded: "Decode%20Platform",
  },
] as const;

test.describe("phase 8 release quality gate", () => {
  test("primary routes pass axe and layout overflow checks", async ({ page }) => {
    test.setTimeout(150_000);

    for (const route of primaryRoutes) {
      await test.step(route.path, async () => {
        await page.goto(route.path);
        await expect(
          page.getByRole("heading", { name: route.heading, level: 1 })
        ).toBeVisible();
        await waitForRouteHydration(page);
        await expectNoDocumentOverflow(page);
        await expectNoClippedInteractiveText(page);
        await expectNoSeriousAxeViolations(page);
      });
    }
  });

  test("api docs route documents the integration surface", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/api", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Decode API documentation", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("/api/qr-codes", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("/api/assets/presign", { exact: true })).toBeVisible();
    await expect(page.getByText("https://decode.com.ng").first()).toBeVisible();
    await waitForRouteHydration(page);
    const staticExample = page
      .locator("article", { hasText: "Create a static QR payload" })
      .first();
    await expect(staticExample.getByRole("tab", { name: "JS" })).toBeVisible();
    await staticExample.getByRole("tab", { name: "TS" }).click();
    await expect(staticExample.getByText("DecodeApiResponse")).toBeVisible();
    await staticExample.getByRole("tab", { name: "PY" }).click();
    await expect(staticExample.getByText("import requests")).toBeVisible();
    await staticExample.getByRole("button", { name: "Edit request" }).click();
    await staticExample.getByRole("textbox", { name: "Editable request body JSON" }).fill(
      JSON.stringify(
        {
          mode: "static",
          save: false,
          type: "url",
          title: "Partner test",
          content: { url: "https://partner.example/catalog" },
          design: {
            foregroundColor: "#0F172A",
            backgroundColor: "#FFFFFF",
            frameColor: "#2563EB",
            frameStyle: "classic",
          },
        },
        null,
        2
      )
    );
    await staticExample.getByRole("button", { name: "Close editor" }).click();
    await expect(staticExample.getByRole("button", { name: "Copy code" })).toBeVisible();
    await expect(staticExample.getByRole("button", { name: "Run request" })).toBeVisible();
    await staticExample.getByRole("button", { name: "Run request" }).click();
    await expect(staticExample.getByText(/^20[01]$/)).toBeVisible({
      timeout: 30_000,
    });
    await staticExample.getByRole("button", { name: "Close run result" }).click();
    await expect(
      staticExample.getByRole("button", { name: "Close run result" })
    ).toHaveCount(0);
    await expectNoDocumentOverflow(page);
    await expectNoSeriousAxeViolations(page);
  });

  test("common breakpoints render without horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);

    for (const viewport of screenshotViewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const route of primaryRoutes) {
        await test.step(`${route.path} at ${viewport.name}`, async () => {
          await page.goto(route.path);
          await expect(
            page.getByRole("heading", { name: route.heading, level: 1 })
          ).toBeVisible();
          await waitForRouteHydration(page);
          await expectNoDocumentOverflow(page);
          await page.screenshot({
            fullPage: true,
            path: testInfo.outputPath(
              `${slugify(route.path)}-${viewport.name}.png`
            ),
          });
        });
      }
    }
  });

  test("landing page template gallery searches and loads presets", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    let publishPayload: unknown;

    await page.route("**/api/auth/session**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Phase 8 User",
            email: "phase8@decode.test",
          },
          expires: "2026-12-31T23:59:59.000Z",
        }),
      });
    });
    await page.route("**/api/landing-pages", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      publishPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            landingPage: {
              id: "lp_phase8_smoke",
              status: "published",
            },
          },
          requestId: "req_phase8_publish",
        }),
      });
    });
    await page.route("**/api/qr-codes**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            workspaceId: "workspace_phase8_smoke",
            qrCodes: [
              {
                id: "qr_phase8_dynamic",
                workspaceId: "workspace_phase8_smoke",
                ownerId: "user_phase8_smoke",
                title: "Phase 8 dynamic QR",
                type: "url",
                mode: "dynamic",
                status: "draft",
                slug: "phase-8-dynamic",
                destinationUrl: null,
                scanCount: 0,
                publishedAt: null,
                archivedAt: null,
                createdAt: "2026-05-22T00:00:00.000Z",
                updatedAt: "2026-05-22T00:00:00.000Z",
                landingPage: null,
              },
            ],
            nextCursor: null,
          },
          requestId: "req_phase8_qr_codes",
        }),
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/landing-pages");
    await expect(
      page.getByRole("heading", { name: "Landing pages", level: 1 })
    ).toBeVisible();
    await waitForRouteHydration(page);

    const search = page.getByLabel("Search templates");
    const searchCases = [
      { term: "school", expected: "School admissions" },
      { term: "restaurant", expected: "Restaurant menu" },
      { term: "hotel", expected: "Hotel welcome" },
      { term: "coupon", expected: "Promo coupon" },
      { term: "event", expected: "Event registration" },
      { term: "pdf", expected: "PDF document" },
      { term: "portfolio", expected: "Portfolio" },
      { term: "digital cv", expected: "Digital CV" },
      { term: "delivery", expected: "Delivery links" },
      { term: "concierge", expected: "Hotel concierge" },
      { term: "office", expected: "Office service directory" },
    ] as const;

    for (const item of searchCases) {
      await search.fill(item.term);
      await expect(
        page.getByRole("button", {
          name: new RegExp(`^${escapeRegExp(item.expected)} template thumbnail`),
        })
      ).toBeVisible();
      await expectNoDocumentOverflow(page);
    }

    await search.fill("room directory");
    await expect(
      page.getByRole("button", {
        name: /^Room directory template thumbnail/,
      })
    ).toBeVisible();

    await search.fill("school");
    await page
      .getByRole("button", { name: /^School admissions template thumbnail/ })
      .click();
    await page
      .getByRole("button", { name: "Use School admissions template" })
      .click();
    await expect(page.getByLabel("Business name")).toHaveValue("Oakfield Academy");
    await expect(
      page.getByRole("heading", { name: "Build and attach page", level: 2 })
    ).toBeFocused();
    await expect(page.getByText("School admissions template loaded.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mobile preview", level: 2 })
    ).toBeVisible();
    await expect(page.getByText("Required fields").first()).toBeVisible();
    await expect(page.getByText("Required assets").first()).toBeVisible();
    await expect(page.getByText("Logo (optional)").first()).toBeVisible();

    await page.getByLabel("Business name").fill("Edited Academy");
    await search.fill("hotel");
    await page
      .getByRole("button", { name: "Use Hotel welcome template" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Keep your edited content?" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByLabel("Business name")).toHaveValue("Edited Academy");

    await page
      .getByRole("button", { name: "Use Hotel welcome template" })
      .click();
    await page.getByRole("button", { name: "Keep shared fields" }).click();
    await expect(page.getByLabel("Business name")).toHaveValue("Edited Academy");
    await expect(
      page.getByText("Hotel welcome template loaded with shared fields preserved.")
    ).toBeVisible();

    await page.getByLabel("Business name").fill("Changed Hotel");
    await page
      .getByRole("button", { name: "Use Hotel welcome template" })
      .click();
    await page.getByRole("button", { name: "Replace defaults" }).click();
    await expect(page.getByLabel("Business name")).toHaveValue("Harbor View Hotel");

    await page.getByLabel("Dynamic QR code").selectOption("qr_phase8_dynamic");
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(
      page.getByText("Landing page published and remains editable.")
    ).toBeVisible();
    expect(publishPayload).toMatchObject({
      qrCodeId: "qr_phase8_dynamic",
      status: "published",
      templateKey: "hotel-welcome",
      title: "Hotel welcome",
      type: "business",
    });
    await expectNoDocumentOverflow(page);
    await expectNoClippedInteractiveText(page);
  });

  test("QR detail page uses live data and archives through the API", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    let archivePayload: unknown;
    await page.route("**/api/qr-codes/qr_live_detail/archive", async (route) => {
      archivePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            qrCode: {
              id: "qr_live_detail",
              title: "Live Campaign QR",
              type: "url",
              mode: "dynamic",
              status: "archived",
              slug: "live-detail",
              destinationUrl: "https://kingtech.com.ng/live",
              redirectUrl: "https://decode.com.ng/r/live-detail",
              payloadValue: "https://decode.com.ng/r/live-detail",
              designConfig: {
                foregroundColor: "#111827",
                backgroundColor: "#FFFFFF",
                margin: 16,
                logoSizeRatio: 0,
                dotStyle: "rounded",
                cornerStyle: "square",
                errorCorrectionLevel: "Q",
                size: 1024,
              },
              scanCount: 8,
              publishedAt: "2026-05-21T08:00:00.000Z",
              archivedAt: "2026-05-24T09:00:00.000Z",
              createdAt: "2026-05-21T07:55:00.000Z",
              updatedAt: "2026-05-24T09:00:00.000Z",
            },
          },
          requestId: "req_archive_live_detail",
        }),
      });
    });
    await page.route("**/api/qr-codes/qr_live_detail", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            qrCode: {
              id: "qr_live_detail",
              title: "Live Campaign QR",
              type: "url",
              mode: "dynamic",
              status: "published",
              slug: "live-detail",
              destinationUrl: "https://kingtech.com.ng/live",
              redirectUrl: "https://decode.com.ng/r/live-detail",
              payloadValue: "https://decode.com.ng/r/live-detail",
              designConfig: {
                foregroundColor: "#111827",
                backgroundColor: "#FFFFFF",
                margin: 16,
                logoSizeRatio: 0,
                dotStyle: "rounded",
                cornerStyle: "square",
                errorCorrectionLevel: "Q",
                size: 1024,
              },
              scanCount: 8,
              publishedAt: "2026-05-21T08:00:00.000Z",
              archivedAt: null,
              createdAt: "2026-05-21T07:55:00.000Z",
              updatedAt: "2026-05-23T12:00:00.000Z",
            },
            analytics: {
              totalQRCodes: 1,
              dynamicQRCodes: 1,
              totalScans: 8,
              scanTrend: [
                { label: "May 22", scans: 2 },
                { label: "May 23", scans: 6 },
              ],
              scansByDeviceClass: [
                { deviceClass: "Mobile", count: 6 },
                { deviceClass: "Desktop", count: 2 },
              ],
              scansByReferrer: [{ referrer: "Direct", count: 5 }],
              recentScans: [
                {
                  id: "scan_live_detail_1",
                  qrCodeId: "qr_live_detail",
                  scannedAt: "2026-05-24T08:00:00.000Z",
                  deviceClass: "Mobile",
                  referrer: "Direct",
                  region: "Lagos",
                  country: "NG",
                  qrCode: { title: "Live Campaign QR" },
                },
              ],
            },
          },
          requestId: "req_live_detail",
        }),
      });
    });

    const detailResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/qr-codes/qr_live_detail") &&
        response.request().method() === "GET"
    );
    await page.goto("/dashboard/qr/qr_live_detail", {
      waitUntil: "domcontentloaded",
    });
    await detailResponse;
    await expect(
      page.getByRole("heading", { name: "Saved QR code", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Live Campaign QR").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("https://kingtech.com.ng/live").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Cafe Menu Redirect");
    await expect(page.getByText("Mobile").first()).toBeVisible();
    await expect(page.getByText("Desktop").first()).toBeVisible();
    await expect(page.getByText("Direct").first()).toBeVisible();
    await expect(page.getByText("Lagos, NG").first()).toBeVisible();

    await page.getByRole("button", { name: "Archive" }).click();
    await expect(
      page.getByRole("dialog", { name: "Archive QR code?" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Archive QR" }).click();
    await expect(page.getByText("Archived").first()).toBeVisible();
    expect(archivePayload).toMatchObject({});
  });

  test("generator completes the static QR workflow and updates frames", async ({
    page,
  }) => {
    await page.goto("/generate");
    await expect(
      page.getByRole("heading", { name: "Generate QR codes", level: 1 })
    ).toBeVisible();

    const behaviorGroup = page.getByRole("group", { name: "QR behavior" });
    await expect(
      behaviorGroup.getByRole("button", { name: /static/i })
    ).toHaveAttribute("aria-pressed", "true");
    await behaviorGroup.getByRole("button", { name: /dynamic/i }).click();
    await expect(page.getByLabel("Dynamic slug")).toHaveCount(0);
    await expect(page.getByLabel("Destination URL")).toBeVisible();
    await behaviorGroup.getByRole("button", { name: /static/i }).click();
    await expect(page.getByLabel("QR preview")).toBeVisible();
    const initialPreviewBox = await page.getByLabel("QR preview").boundingBox();

    const continueToDesign = page.getByRole("button", {
      name: "Continue to design",
    });
    await page.getByLabel("Website URL").fill("https//decode.com.ng/phase-8");
    await expect(
      page.getByText("Add a colon after the protocol")
    ).toBeVisible();
    await expect(continueToDesign).toBeDisabled();
    await page.getByLabel("Website URL").fill("https://decode.com.ng/phase-8");
    await continueToDesign.click();
    await expect(
      page.getByRole("heading", { name: "2. Design and guardrails" })
    ).toBeVisible();

    await expect(
      page.getByRole("tab", { name: "Template preset" })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("radiogroup", { name: "Template preset" })
    ).toBeVisible();

    const eventPreset = page.getByRole("radio", { name: "Event" });
    await eventPreset.click();
    await expect(eventPreset).toHaveAttribute("aria-checked", "true");
    await page.getByRole("tab", { name: "QR frame" }).click();
    await expect(
      page.getByRole("radio", { name: "Select Ticket frame" })
    ).toHaveAttribute("aria-checked", "true");
    await expectQrCanvasToUseNeutralModules(page);

    await page.getByRole("tab", { name: "Logo" }).click();
    const logoBuffer = createSolidLogoSvgBuffer("#EF4444");
    await page.locator("#qr-logo-upload").setInputFiles({
      name: "decode-logo.svg",
      mimeType: "image/svg+xml",
      buffer: logoBuffer,
    });
    await expectQrPreviewCenterToBeColor(page, {
      red: 200,
      maxGreen: 120,
      maxBlue: 120,
    });

    await page.getByRole("tab", { name: "QR frame" }).click();
    const scanMeFrame = page.getByRole("radio", {
      name: "Select Scan me frame",
    });
    await scanMeFrame.click();
    await expect(scanMeFrame).toHaveAttribute("aria-checked", "true");
    const scanabilityMeter = page.getByLabel("Scanability meter");
    await expect(
      scanabilityMeter.getByText("Ready").first()
    ).toBeVisible();

    const framedPreviewBox = await page.getByLabel("QR preview").boundingBox();
    expect(framedPreviewBox?.width).toBeGreaterThan(250);
    expect(initialPreviewBox?.width).toBeGreaterThan(250);
    expect(
      Math.abs((framedPreviewBox?.width ?? 0) - (initialPreviewBox?.width ?? 0))
    ).toBeLessThanOrEqual(80);

    await page.getByRole("tab", { name: "Color" }).click();
    await page.getByLabel("Background color hex", { exact: true }).fill("#0F172A");
    await expect(
      scanabilityMeter.getByText("Blocked for publish").first()
    ).toBeVisible();

    await page.getByRole("button", { name: "Reset design" }).click();
    await page.getByRole("tab", { name: "Template preset" }).click();
    await expect(page.getByRole("radio", { name: "Clean" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await expect(scanabilityMeter.getByText("Ready").first()).toBeVisible();

    await page.getByRole("button", { name: "Continue to export" }).click();
    await expect(
      page.getByRole("heading", { name: "3. Export and publish" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Go to Design step" }).click();
    await expect(
      page.getByRole("heading", { name: "2. Design and guardrails" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue to export" }).click();
    await expect(
      page.getByRole("heading", { name: "3. Export and publish" })
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: "PNG" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "SVG" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "PDF" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download PNG" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy payload" })
    ).toBeEnabled();
  });

  test("dynamic generator waits for the server payload before export", async ({
    context,
    page,
  }) => {
    test.setTimeout(90_000);

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    let publishPayload: unknown;
    let renderPayload: unknown;
    await page.route("**/api/auth/session**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Dynamic QR User",
            email: "dynamic-qr@decode.test",
          },
          expires: "2026-12-31T23:59:59.000Z",
        }),
      });
    });
    await page.route("**/api/qr-codes/*/render", async (route) => {
      renderPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            asset: { id: "asset_live_smoke" },
            downloadUrl: "/mock-downloads/live-smoke.png",
            warnings: [],
          },
          requestId: "req_dynamic_render_smoke",
        }),
      });
    });
    await page.route("**/mock-downloads/live-smoke.png", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from("decode-dynamic-qr-smoke"),
      });
    });
    await page.route("**/api/qr-codes", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      publishPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            qrCode: {
              id: "qr_live_smoke",
              slug: "live-smoke",
              redirectUrl: "http://127.0.0.1:3100/r/live-smoke",
              destinationUrl: "https://kingtech.com.ng/",
            },
            payload: {
              value: "http://127.0.0.1:3100/r/live-smoke",
              destinationUrl: "https://kingtech.com.ng/",
            },
          },
          requestId: "req_dynamic_publish_smoke",
        }),
      });
    });

    await page.goto("/generate");
    await expect(
      page.getByRole("heading", { name: "Generate QR codes", level: 1 })
    ).toBeVisible();
    await expect(page.getByLabel("Open profile")).toBeVisible();

    await page
      .getByRole("group", { name: "QR behavior" })
      .getByRole("button", { name: /dynamic/i })
      .click();
    await page.getByLabel("Destination URL").fill("https://kingtech.com.ng/");
    await expect(page.getByLabel("QR preview").locator("canvas").first()).toBeVisible();
    await page.getByRole("button", { name: "Continue to design" }).click();
    await expect(
      page.getByRole("heading", { name: "2. Design and guardrails" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue to export" }).click();

    const builderPanel = page.getByTestId("qr-builder-panel");
    await expect(
      builderPanel.getByText(
        "Publish to assign public link -> https://kingtech.com.ng/"
      )
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("assigned-after-publish");
    await expect(page.locator("body")).not.toContainText("decode.com.ngh");
    await expect(page.getByRole("button", { name: "Copy payload" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    await expect(page.getByLabel("QR preview").locator("canvas").first()).toBeVisible();
    await expect(
      page.getByLabel("QR preview").getByTestId("qr-payload-placeholder")
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Publish dynamic QR" }).click();
    await expect(
      builderPanel.getByText(
        "Published dynamic QR: http://127.0.0.1:3100/r/live-smoke"
      )
    ).toBeVisible();
    await expect(
      builderPanel.getByText(
        "http://127.0.0.1:3100/r/live-smoke -> https://kingtech.com.ng/"
      )
    ).toBeVisible();
    expect(publishPayload).toMatchObject({
      mode: "dynamic",
      type: "url",
      content: { url: "https://kingtech.com.ng/" },
    });
    await expect(page.getByLabel("QR preview").locator("canvas").first()).toBeVisible();
    await expect(
      page.getByLabel("QR preview").getByTestId("qr-payload-placeholder")
    ).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Copy payload" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    await page.getByRole("button", { name: "Copy payload" }).click();
    await expect(
      page.getByRole("button", { name: "Copied payload" })
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("http://127.0.0.1:3100/r/live-smoke");

    const renderResponse = page.waitForResponse(
      "**/api/qr-codes/qr_live_smoke/render"
    );
    await page.getByRole("button", { name: "Download PNG" }).click();
    await renderResponse;
    await expect(
      page.getByRole("heading", { name: "Sign in to finish export" })
    ).toHaveCount(0);
    expect(renderPayload).toMatchObject({ format: "png" });
  });

  test("generator mobile cleanup keeps preview, progress, and frame choice fast", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/generate");
    await expect(
      page.getByRole("heading", { name: "Generate QR codes", level: 1 })
    ).toBeVisible();
    await waitForRouteHydration(page);

    const progressBox = await page
      .locator('[aria-label="QR creation progress"]')
      .boundingBox();
    const previewTray = page.getByTestId("mobile-preview-tray");
    const previewBox = await previewTray.boundingBox();
    const continueButton = page.getByRole("button", {
      name: "Continue to design",
    });
    const continueBox = await continueButton.boundingBox();

    expect(progressBox?.height).toBeLessThanOrEqual(58);
    await expect(previewTray).toBeVisible();
    expect(
      (previewBox?.y ?? 0) + (previewBox?.height ?? 0)
    ).toBeLessThanOrEqual(844);
    expect(continueBox?.y).toBeLessThanOrEqual(844 * 1.4);

    await page.getByLabel("Website URL").fill("https://decode.com.ng/phase-1");
    await expect(continueButton).toBeEnabled();
    await continueButton.scrollIntoViewIfNeeded();
    await continueButton.click();

    const designHeading = page.getByRole("heading", {
      name: "2. Design and guardrails",
    });
    await expect(designHeading).toBeVisible({ timeout: 15_000 });
    await expect(designHeading).toBeFocused();

    await page.getByRole("tab", { name: "QR frame" }).click();
    const framePickerBox = await page.getByTestId("frame-picker").boundingBox();
    const railMetrics = await page
      .getByTestId("frame-picker-rail")
      .evaluate((node) => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));

    expect(framePickerBox?.height).toBeLessThanOrEqual(300);
    expect(railMetrics.scrollWidth).toBeGreaterThan(railMetrics.clientWidth);

    const noFrame = page.getByRole("radio", {
      name: "Select No frame frame",
    });
    const scanMeFrame = page.getByRole("radio", {
      name: "Select Scan me frame",
    });
    await noFrame.focus();
    await page.keyboard.press("ArrowRight");
    await expect(scanMeFrame).toHaveAttribute("aria-checked", "true");
    await expectNoDocumentOverflow(page);
  });

  test("generator builder supports keyboard-only controls and WCAG checks", async ({
    page,
  }) => {
    await page.goto("/generate");
    await expect(
      page.getByRole("heading", { name: "Generate QR codes", level: 1 })
    ).toBeVisible();
    await waitForRouteHydration(page);
    await expectNoSeriousAxeViolations(page);

    await page.getByLabel("Website URL").fill("https://decode.com.ng/phase-5");
    await page.getByRole("button", { name: "Continue to design" }).focus();
    await page.keyboard.press("Enter");

    const designHeading = page.getByRole("heading", {
      name: "2. Design and guardrails",
    });
    await expect(designHeading).toBeFocused();

    const cleanPreset = page.getByRole("radio", { name: "Clean" });
    const corporatePreset = page.getByRole("radio", { name: "Corporate" });
    await cleanPreset.focus();
    await page.keyboard.press("ArrowRight");
    await expect(corporatePreset).toHaveAttribute("aria-checked", "true");

    await page.getByRole("tab", { name: "QR frame" }).click();
    const noFrame = page.getByRole("radio", {
      name: "Select No frame frame",
    });
    const scanMeFrame = page.getByRole("radio", {
      name: "Select Scan me frame",
    });
    await noFrame.focus();
    await page.keyboard.press("ArrowRight");
    await expect(scanMeFrame).toHaveAttribute("aria-checked", "true");

    const advancedSummary = page.locator("summary", {
      hasText: "Advanced design controls",
    });
    await advancedSummary.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("radiogroup", { name: "Dot style" })
    ).toBeVisible();

    const dotStyleGroup = page.getByRole("radiogroup", {
      name: "Dot style",
    });
    await dotStyleGroup.getByRole("radio", { name: "Square", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      dotStyleGroup.getByRole("radio", { name: "Rounded", exact: true })
    ).toHaveAttribute("aria-checked", "true");

    await page.getByRole("tab", { name: "Logo" }).click();
    const logoBuffer = createSolidLogoSvgBuffer("#EF4444");
    const logoInput = page.locator("#qr-logo-upload");
    await logoInput.focus();
    await expect(logoInput).toBeFocused();
    await logoInput.setInputFiles({
      name: "decode-release-logo.svg",
      mimeType: "image/svg+xml",
      buffer: logoBuffer,
    });
    await expect(page.getByLabel("Error correction")).toHaveCount(0);
    await expect(
      page.getByLabel("Scanability meter").getByText("Ready").first()
    ).toBeVisible();

    await page.getByRole("button", { name: "Continue to export" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "3. Export and publish" })
    ).toBeFocused();

    const exportFormatGroup = page.getByRole("radiogroup", {
      name: "Export format",
    });
    await exportFormatGroup.getByRole("radio", { name: "PNG" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      exportFormatGroup.getByRole("radio", { name: "SVG" })
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("button", { name: "Download SVG" })
    ).toBeVisible();

    await expectNoDocumentOverflow(page);
    await expectNoSeriousAxeViolations(page);
  });

  test("scanner upload fallback decodes QR images and links to links", async ({
    page,
  }) => {
    const qrText = "https://decode.com.ng/verify-smoke";
    const buffer = await QRCode.toBuffer(qrText, {
      type: "png",
      width: 320,
      margin: 2,
    });

    await page.goto("/scan");
    await expect(
      page.getByRole("heading", { name: "Scan QR codes", level: 1 })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Start camera" })).toBeVisible();
    await page.getByLabel("Upload QR image").setInputFiles({
      name: "decode-smoke.png",
      mimeType: "image/png",
      buffer,
    });

    await expect(page.getByText(qrText)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Copy result" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Clear result" })).toBeEnabled();
    await expect(
      page.locator("#main-content").getByRole("link", { name: "Links" })
    ).toHaveAttribute("href", new RegExp(`/links\\?url=${encodeURIComponent(qrText)}`));
  });

  test("links page stays disabled while the links system is rebuilt", async ({
    page,
  }) => {
    await page.goto("/links");
    await expect(
      page.getByRole("heading", { name: "Links", level: 1 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Link verification is being upgraded.",
        level: 2,
      })
    ).toBeVisible();
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("decode utility validates UI controls and API algorithms", async ({
    page,
    request,
  }) => {
    await page.goto("/decode");
    await expect(
      page.getByRole("heading", { name: "Decode utility", level: 1 })
    ).toBeVisible();

    await page.getByLabel("Input text").fill("Decode Platform");
    await page.getByRole("button", { name: "Run transform" }).click();
    await expect(page.getByLabel("Output text")).toHaveValue(
      "RGVjb2RlIFBsYXRmb3Jt",
      { timeout: 15_000 }
    );
    await expect(
      page.getByRole("button", { name: "Swap input and output" })
    ).toBeEnabled();
    await expect(page.getByRole("button", { name: "Copy" })).toBeEnabled();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByLabel("Input text")).toHaveValue("");

    for (const entry of decodeRoundTripCases) {
      const encodeResponse = await request.post("/api/decode", {
        data: {
          algorithm: entry.algorithm,
          direction: "encode",
          input: entry.input,
          shift: entry.shift ?? 3,
        },
      });
      const encodeBody = await encodeResponse.json();

      expect(encodeResponse.ok()).toBe(true);
      expect(encodeResponse.headers()["x-request-id"]).toBeTruthy();
      expect(encodeBody.ok).toBe(true);
      expect(encodeBody.data.output).toBe(entry.encoded);

      const decodeResponse = await request.post("/api/decode", {
        data: {
          algorithm: entry.algorithm,
          direction: "decode",
          input: entry.encoded,
          shift: entry.shift ?? 3,
        },
      });
      const decodeBody = await decodeResponse.json();

      expect(decodeResponse.ok()).toBe(true);
      expect(decodeResponse.headers()["x-request-id"]).toBeTruthy();
      expect(decodeBody.ok).toBe(true);
      expect(decodeBody.data.output).toBe(entry.input);
    }

    const invalidResponse = await request.post("/api/decode", {
      data: {
        algorithm: "binary",
        direction: "decode",
        input: "not-binary",
      },
    });
    const invalidBody = await invalidResponse.json();

    expect(invalidResponse.status()).toBe(400);
    expect(invalidBody.ok).toBe(false);
    expect(invalidBody.error.code).toBe("INVALID_DECODE_INPUT");
  });

  test("dashboard keeps production data honest with empty state CTAs", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Dashboard", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Workspace command center")).toBeVisible();
    await expect(page.getByText("No workspace activity yet")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Dashboard notice")).toHaveCount(0);

    const savedCard = page.locator("a", { hasText: "Saved QR codes" }).first();
    const scanCard = page.locator("a", { hasText: "Scan events" }).first();
    const savedBox = await savedCard.boundingBox();
    const scanBox = await scanCard.boundingBox();

    expect(savedBox).not.toBeNull();
    expect(scanBox).not.toBeNull();
    expect(Math.abs((savedBox?.y ?? 0) - (scanBox?.y ?? 0))).toBeLessThan(12);
    expect((scanBox?.x ?? 0)).toBeGreaterThan(savedBox?.x ?? 0);
    await expect(savedCard).toHaveAttribute("href", "/generate");
    await expect(scanCard).toHaveAttribute("href", "/scan");
  });

  test("backend smoke APIs stay release-ready", async ({ request }) => {
    const createResponse = await request.post("/api/qr-codes", {
      data: {
        type: "url",
        mode: "static",
        save: false,
        content: {
          url: "https://decode.com.ng/decode-smoke",
        },
      },
    });
    const createBody = await createResponse.json();

    expect(createResponse.ok()).toBe(true);
    expect(createResponse.headers()["x-request-id"]).toBeTruthy();
    expect(createBody.ok).toBe(true);
    expect(createBody.data.payload.value).toBe(
      "https://decode.com.ng/decode-smoke"
    );

    const verifyResponse = await request.post("/api/links/verify", {
      data: {
        url: "http://[::1",
      },
    });
    const verifyBody = await verifyResponse.json();

    expect(verifyResponse.ok()).toBe(true);
    expect(verifyResponse.headers()["x-request-id"]).toBeTruthy();
    expect(verifyBody.ok).toBe(true);
    expect(verifyBody.data.verdict).toBe("suspicious");
    expect(verifyBody.data.normalizedUrl).toBeNull();

    const imageBuffer = await QRCode.toBuffer("Decode smoke image", {
      type: "png",
      width: 320,
    });
    const scanResponse = await request.post("/api/scans/image", {
      multipart: {
        file: {
          name: "decode-smoke.png",
          mimeType: "image/png",
          buffer: imageBuffer,
        },
      },
    });
    const scanBody = await scanResponse.json();

    expect(scanResponse.ok()).toBe(true);
    expect(scanResponse.headers()["x-request-id"]).toBeTruthy();
    expect(scanBody.ok).toBe(true);
    expect(scanBody.data.text).toBe("Decode smoke image");

    const dashboardResponse = await request.get("/api/dashboard/summary");
    const dashboardBody = await dashboardResponse.json();

    expect(dashboardResponse.status()).toBe(401);
    expect(dashboardResponse.headers()["x-request-id"]).toBeTruthy();
    expect(dashboardBody.ok).toBe(false);
    expect(dashboardBody.error.code).toBe("UNAUTHENTICATED");
  });
});

async function waitForRouteHydration(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
}

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blockingViolations = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? "")
  );

  expect(
    blockingViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(" ")).slice(0, 5),
    }))
  ).toEqual([]);
}

async function expectNoDocumentOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const body = document.body;

    return {
      documentOverflow:
        documentElement.scrollWidth - documentElement.clientWidth,
      bodyOverflow: body.scrollWidth - body.clientWidth,
    };
  });

  expect(Math.max(metrics.documentOverflow, metrics.bodyOverflow)).toBeLessThanOrEqual(2);
}

async function expectNoClippedInteractiveText(page: Page) {
  const clippedControls = await page.locator("a, button").evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);

        if (
          rect.width < 1 ||
          rect.height < 1 ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          node.classList.contains("sr-only")
        ) {
          return false;
        }

        const label = node.getAttribute("aria-label") ?? node.textContent ?? "";
        if (/Next\.js Dev Tools/i.test(label)) {
          return false;
        }

        return (
          node.scrollWidth > Math.ceil(node.clientWidth) + 2 ||
          node.scrollHeight > Math.ceil(node.clientHeight) + 2
        );
      })
      .map((node) => {
        const label = node.getAttribute("aria-label") ?? node.textContent ?? "";

        return label.trim().replace(/\s+/g, " ").slice(0, 80);
      })
  );

  expect(clippedControls).toEqual([]);
}

function slugify(path: string) {
  return path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSolidLogoSvgBuffer(color: string) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="${color}"/></svg>`
  );
}

async function expectQrPreviewCenterToBeColor(
  page: Page,
  color: {
    readonly red: number;
    readonly maxGreen: number;
    readonly maxBlue: number;
  }
) {
  const canvas = page.getByLabel("QR preview").locator("canvas").first();

  await expect
    .poll(
      async () => {
        const pixel = await canvas.evaluate((node) => {
          const previewCanvas = node as HTMLCanvasElement;
          const context = previewCanvas.getContext("2d");
          if (!context) return null;

          const x = Math.floor(previewCanvas.width / 2);
          const y = Math.floor(previewCanvas.height / 2);
          const [red, green, blue] = context.getImageData(x, y, 1, 1).data;

          return { red, green, blue };
        });

        return Boolean(
          pixel &&
            pixel.red >= color.red &&
            pixel.green <= color.maxGreen &&
            pixel.blue <= color.maxBlue
        );
      },
      { message: "uploaded logo should render in the QR preview on first upload" }
    )
    .toBe(true);
}

async function expectQrCanvasToUseNeutralModules(page: Page) {
  const canvas = page.getByLabel("QR preview").locator("canvas").first();

  await expect
    .poll(
      async () => {
        const pixelCounts = await canvas.evaluate((node) => {
          const previewCanvas = node as HTMLCanvasElement;
          const context = previewCanvas.getContext("2d");
          if (!context) return null;

          const { width, height } = previewCanvas;
          const { data } = context.getImageData(0, 0, width, height);
          let neutralDarkPixels = 0;
          let accentBluePixels = 0;

          for (let index = 0; index < data.length; index += 4) {
            const red = data[index] ?? 0;
            const green = data[index + 1] ?? 0;
            const blue = data[index + 2] ?? 0;
            const alpha = data[index + 3] ?? 0;

            if (alpha < 255) continue;
            if (red < 40 && green < 50 && blue < 70) neutralDarkPixels += 1;
            if (red < 90 && green < 90 && blue > 140) accentBluePixels += 1;
          }

          return { neutralDarkPixels, accentBluePixels };
        });

        return Boolean(
          pixelCounts &&
            pixelCounts.neutralDarkPixels > 1_000 &&
            pixelCounts.accentBluePixels < 10
        );
      },
      {
        message:
          "frame accent color should not recolor the QR modules inside the canvas",
        timeout: 15_000,
      }
    )
    .toBe(true);
}
