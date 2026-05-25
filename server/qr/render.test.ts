import { describe, expect, it } from "vitest";
import { QR_EXPORT_FORMAT } from "@/server/qr/constants";
import { renderQRCode } from "@/server/qr/render";
import type { QRDesignConfig } from "@/server/qr/schemas";

const design: QRDesignConfig = {
  foregroundColor: "#0F172A",
  backgroundColor: "#FFFFFF",
  frameColor: "#2563EB",
  margin: 4,
  logoSizeRatio: 0,
  dotStyle: "square",
  cornerStyle: "square",
  errorCorrectionLevel: "Q",
  size: 256,
  frameStyle: "none",
};

describe("renderQRCode", () => {
  it.each([
    [QR_EXPORT_FORMAT.PNG, "image/png"],
    [QR_EXPORT_FORMAT.JPG, "image/jpeg"],
    [QR_EXPORT_FORMAT.SVG, "image/svg+xml; charset=utf-8"],
    [QR_EXPORT_FORMAT.PDF, "application/pdf"],
  ])("renders %s exports", async (format, contentType) => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design,
      format,
      title: "Decode QR",
    });

    expect(rendered.contentType).toBe(contentType);
    expect(rendered.extension).toBe(format);
    expect(rendered.body.length).toBeGreaterThan(100);
  });
});
