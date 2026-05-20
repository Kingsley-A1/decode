import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import QRCode from "qrcode";

const primaryRoutes = [
  { path: "/generate", heading: "Generate QR codes" },
  { path: "/scan", heading: "Scan QR codes" },
  { path: "/verify", heading: "Verify a link" },
  { path: "/decode", heading: "Decode utility" },
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/landing-pages", heading: "Landing pages" },
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

  test("common breakpoints render without horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.setTimeout(150_000);

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

  test("generator completes the static QR workflow and updates frames", async ({
    page,
  }) => {
    await page.goto("/generate");
    await expect(
      page.getByRole("heading", { name: "Generate QR codes", level: 1 })
    ).toBeVisible();

    await expect(
      page.getByRole("group", { name: "QR behavior" }).getByRole("button", {
        name: /static/i,
      })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("QR preview")).toBeVisible();
    const initialPreviewBox = await page.getByLabel("QR preview").boundingBox();

    await page.getByLabel("Website URL").fill("https://decode.com.ng/phase-8");
    await page.getByRole("button", { name: "Continue to design" }).click();
    await expect(
      page.getByRole("heading", { name: "2. Design and guardrails" })
    ).toBeVisible();

    const scanMeFrame = page.getByRole("button", {
      name: "Select Scan me frame",
    });
    await scanMeFrame.click();
    await expect(scanMeFrame).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText("No scanability warnings detected for the current design.")
    ).toBeVisible();

    const framedPreviewBox = await page.getByLabel("QR preview").boundingBox();
    expect(framedPreviewBox?.width).toBeGreaterThan(250);
    expect(initialPreviewBox?.width).toBeGreaterThan(250);
    expect(
      Math.abs((framedPreviewBox?.width ?? 0) - (initialPreviewBox?.width ?? 0))
    ).toBeLessThanOrEqual(80);

    await page.getByRole("button", { name: "Continue to export" }).click();
    await expect(
      page.getByRole("heading", { name: "3. Export and publish" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^PNG\b/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^SVG\b/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^PDF\b/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy payload" })
    ).toBeEnabled();
  });

  test("scanner upload fallback decodes QR images and links to verifier", async ({
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
    await expect(page.getByRole("link", { name: "Verify link" })).toHaveAttribute(
      "href",
      new RegExp(`/verify\\?url=${encodeURIComponent(qrText)}`)
    );
  });

  test("verifier shows normalized suspicious verdicts and cautious open flow", async ({
    page,
  }) => {
    await page.goto("/verify");
    await expect(
      page.getByRole("heading", { name: "Verify a link", level: 1 })
    ).toBeVisible();

    const checkButton = page.getByRole("button", { name: "Check link" });

    await page.getByLabel("Link to verify").fill("http://localhost:3000/login");
    await expect(checkButton).toBeEnabled();
    await checkButton.click();

    const verdictPanel = page.locator('section[aria-live="polite"]');

    await expect(page.locator("code", { hasText: "localhost_host" })).toBeVisible(
      { timeout: 15_000 }
    );
    await expect(page.getByText(/http:\/\/localhost:3000\/login\/?/)).toBeVisible();
    await expect(verdictPanel.getByText(/^Suspicious$/).first()).toBeVisible();

    await page.getByRole("button", { name: "Open with caution" }).click();
    await expect(
      page.getByRole("dialog", { name: "Open flagged link?" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Stay here" }).click();
    await expect(
      page.getByRole("dialog", { name: "Open flagged link?" })
    ).toBeHidden();
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
      "RGVjb2RlIFBsYXRmb3Jt"
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
