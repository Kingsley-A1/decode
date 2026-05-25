import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import sharp from "sharp";
import { QR_EXPORT_FORMAT } from "@/server/qr/constants";
import { renderQRCode } from "@/server/qr/render";
import type { QRDesignConfig } from "@/server/qr/schemas";

const TINY_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const base: QRDesignConfig = {
  foregroundColor: "#0F172A",
  backgroundColor: "#FFFFFF",
  frameColor: "#2563EB",
  margin: 4,
  logoSizeRatio: 0,
  dotStyle: "square",
  cornerStyle: "square",
  errorCorrectionLevel: "Q",
  size: 512,
  frameStyle: "none",
};

async function decode(value: string, design: QRDesignConfig, logoUrl?: string) {
  const rendered = await renderQRCode({
    value,
    design,
    format: QR_EXPORT_FORMAT.PNG,
    logo: logoUrl ? { dataUrl: logoUrl } : null,
  });
  const { data, info } = await sharp(rendered.body as Buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return jsQR(new Uint8ClampedArray(data), info.width, info.height);
}

describe("styled QR scannability round-trip", () => {
  const value = "https://decode.example.com/r/spring-campaign";

  it("scans plain square QR", async () => {
    expect((await decode(value, base))?.data).toBe(value);
  });

  it("scans rounded dots + rounded corners", async () => {
    const result = await decode(value, {
      ...base,
      dotStyle: "rounded",
      cornerStyle: "rounded",
    });
    expect(result?.data).toBe(value);
  });

  it("scans dots style with square eyes", async () => {
    const result = await decode(value, {
      ...base,
      dotStyle: "dots",
      cornerStyle: "square",
    });
    expect(result?.data).toBe(value);
  });

  it("scans dots style with circular eyes", async () => {
    const result = await decode(value, {
      ...base,
      dotStyle: "dots",
      cornerStyle: "dot",
    });
    expect(result?.data).toBe(value);
  });

  it("scans with a centered logo (high ECC)", async () => {
    const result = await decode(
      value,
      { ...base, errorCorrectionLevel: "H", logoSizeRatio: 0.2 },
      TINY_LOGO
    );
    expect(result?.data).toBe(value);
  });

  it("scans inside a scan-me frame", async () => {
    const result = await decode(value, { ...base, frameStyle: "scan-me" });
    expect(result?.data).toBe(value);
  });
});
