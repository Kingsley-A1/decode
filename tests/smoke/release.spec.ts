import { expect, test } from "@playwright/test";
import QRCode from "qrcode";

test.describe("release smoke checks", () => {
  test("loads the primary application shell", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Generate or Scan" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /decode/i })).toBeVisible();
  });

  test("creates an anonymous static QR payload", async ({ request }) => {
    const response = await request.post("/api/qr-codes", {
      data: {
        type: "url",
        mode: "static",
        save: false,
        content: {
          url: "https://example.com/decode-smoke",
        },
      },
    });

    const body = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.headers()["x-request-id"]).toBeTruthy();
    expect(body.ok).toBe(true);
    expect(body.data.payload.value).toBe("https://example.com/decode-smoke");
  });

  test("returns deterministic link verification verdicts", async ({
    request,
  }) => {
    const response = await request.post("/api/links/verify", {
      data: {
        url: "http://[::1",
      },
    });

    const body = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.headers()["x-request-id"]).toBeTruthy();
    expect(body.ok).toBe(true);
    expect(body.data.verdict).toBe("suspicious");
    expect(body.data.normalizedUrl).toBeNull();
    expect(body.data.cache.cacheable).toBe(false);
  });

  test("decodes uploaded QR images through the server fallback", async ({
    request,
  }) => {
    const buffer = await QRCode.toBuffer("Decode smoke image", {
      type: "png",
      width: 320,
    });

    const response = await request.post("/api/scans/image", {
      multipart: {
        file: {
          name: "decode-smoke.png",
          mimeType: "image/png",
          buffer,
        },
      },
    });

    const body = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.headers()["x-request-id"]).toBeTruthy();
    expect(body.ok).toBe(true);
    expect(body.data.text).toBe("Decode smoke image");
    expect(body.data.contentType).toBe("text");
  });

  test("guards dashboard analytics behind authentication", async ({
    request,
  }) => {
    const response = await request.get("/api/dashboard/summary");
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBeTruthy();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  test("validates a configured dynamic QR redirect", async ({ request }) => {
    const slug = process.env.SMOKE_DYNAMIC_SLUG;

    test.skip(
      !slug,
      "Set SMOKE_DYNAMIC_SLUG to run the production dynamic redirect smoke check."
    );

    const response = await request.get(`/r/${slug}`, { maxRedirects: 0 });

    expect([200, 302]).toContain(response.status());
    expect(response.headers()["x-request-id"]).toBeTruthy();
  });
});
