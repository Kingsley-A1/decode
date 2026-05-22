import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(
  process.cwd(),
  "public",
  "assets",
  "landing-page-templates",
  "mobile-previews"
);

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  try {
    const templates = await fetchTemplates();

    await page.goto(`${baseURL}/landing-pages`, {
      waitUntil: "domcontentloaded",
      timeout: 240_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(
      () => undefined
    );

    for (const template of templates) {
      const card = page.locator(`[data-template-key="${template.key}"]`);
      await card.getByRole("button", {
        name: `Use ${template.label} template`,
      }).click();

      const preview = page.locator('[data-landing-page-preview="mobile"]').last();
      await preview.waitFor({ state: "visible", timeout: 30_000 });
      await forcePreviewSize(preview);
      await waitForPreviewImages(preview);
      const screenshotPath = path.join(outputDir, `${template.key}.png`);
      const normalizedPath = path.join(outputDir, `${template.key}.normalized.png`);

      await preview.screenshot({ path: screenshotPath });
      await sharp(screenshotPath)
        .resize({ width: 390, height: 844, fit: "cover", position: "top" })
        .png()
        .toFile(normalizedPath);
      await sharp(normalizedPath).toFile(screenshotPath);
      await rm(normalizedPath, { force: true });
    }
  } finally {
    await browser.close();
  }
}

async function fetchTemplates() {
  const response = await fetch(`${baseURL}/api/landing-page-templates`);

  if (!response.ok) {
    throw new Error(`Could not fetch templates: ${response.status}`);
  }

  const body = await response.json();
  const templates = body?.data?.templates;

  if (!Array.isArray(templates)) {
    throw new Error("Template API did not return a template array.");
  }

  return templates.map((template) => ({
    key: String(template.key),
    label: String(template.label),
  }));
}

async function forcePreviewSize(preview) {
  await preview.evaluate((element) => {
    const previewElement = element;
    previewElement.style.width = "390px";
    previewElement.style.maxWidth = "390px";
    previewElement.style.height = "844px";
    previewElement.style.minHeight = "844px";

    const inner = previewElement.firstElementChild;
    if (inner instanceof HTMLElement) {
      inner.style.minHeight = "844px";
    }
  });
}

async function waitForPreviewImages(preview) {
  await preview.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        if (image.complete) return undefined;

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })
    )
  );
}

await main();
