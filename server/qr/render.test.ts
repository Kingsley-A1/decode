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

  it("renders the selected dot style and colors into the SVG", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design: { ...design, dotStyle: "dots", foregroundColor: "#0EA5E9" },
      format: QR_EXPORT_FORMAT.SVG,
    });
    const svg = rendered.body as string;

    expect(svg).toContain("<circle");
    expect(svg).toContain("#0EA5E9");
  });

  it("composites a logo into the SVG when provided", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design: { ...design, logoSizeRatio: 0.2 },
      format: QR_EXPORT_FORMAT.SVG,
      logo: { dataUrl: "data:image/png;base64,AAAA" },
    });

    expect(rendered.body as string).toContain("<image");
  });

  it("includes a frame caption in the SVG when a frame is selected", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design: { ...design, frameStyle: "scan-me" },
      format: QR_EXPORT_FORMAT.SVG,
    });

    expect(rendered.body as string).toContain("SCAN ME");
  });
});
