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
    const svg = rendered.body as string;

    // The caption is drawn as vector outlines (font-independent), with the
    // source text preserved as the path's accessible name.
    expect(svg).toContain('aria-label="SCAN ME"');
    expect(svg).toMatch(/<path d="M[^"]+" fill="#FFFFFF" role="img"/);
    expect(svg).not.toContain("<text");
  });

  it.each(["scan-me", "classic", "ticket", "badge", "minimal"] as const)(
    "applies the chosen frame color into the %s frame SVG",
    async (frameStyle) => {
      const rendered = await renderQRCode({
        value: "https://decode.example.com",
        design: { ...design, frameStyle, frameColor: "#D01616" },
        format: QR_EXPORT_FORMAT.SVG,
      });

      expect(rendered.body as string).toContain("#D01616");
    }
  );

  it("sizes the PDF page to the artwork instead of an A4 sheet", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design,
      format: QR_EXPORT_FORMAT.PDF,
      title: "Decode QR",
    });
    const pdf = (rendered.body as Buffer).toString("latin1");

    // 256px artwork at 72dpi/96dpi = 192pt — not 595.28x841.89 (A4).
    expect(pdf).toContain("/MediaBox [0 0 192 192]");
    expect(pdf).not.toContain("841.89");
  });

  it("renders a logo-less PDF as pure vectors with no embedded raster", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design,
      format: QR_EXPORT_FORMAT.PDF,
    });
    const pdf = (rendered.body as Buffer).toString("latin1");

    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).not.toContain("/Subtype /Image");
  });

  it("embeds only the logo as an image when a logo is present", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design: { ...design, logoSizeRatio: 0.2 },
      format: QR_EXPORT_FORMAT.PDF,
      logo: { dataUrl: `data:image/png;base64,${ONE_BY_ONE_PNG_BASE64}` },
    });
    const pdf = (rendered.body as Buffer).toString("latin1");
    const imageCount = pdf.match(/\/Subtype \/Image/g)?.length ?? 0;

    // pdfkit stores an RGBA PNG as the image plus its alpha SMask — both
    // count as image XObjects, and both belong to the single logo.
    expect(imageCount).toBeGreaterThanOrEqual(1);
    expect(imageCount).toBeLessThanOrEqual(2);
  });

  it("sizes a framed PDF to the frame footprint and draws the caption as vectors", async () => {
    const rendered = await renderQRCode({
      value: "https://decode.example.com",
      design: { ...design, frameStyle: "scan-me", size: 512 },
      format: QR_EXPORT_FORMAT.PDF,
    });
    const pdf = (rendered.body as Buffer).toString("latin1");

    // 512px QR: border=11, pad=23, gap=34, captionHeight=77 →
    // 580x657px artwork → 435x492.75pt page.
    expect(pdf).toContain("/MediaBox [0 0 435 492.75]");
    // The caption ships as vector glyph outlines, so no text font is embedded.
    expect(pdf).not.toContain("Helvetica-Bold");
  });
});

// A valid 1x1 PNG so the logo path exercises the native PNG embed.
const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
