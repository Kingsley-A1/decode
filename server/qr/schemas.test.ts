import { describe, expect, it } from "vitest";
import { QR_EXPORT_FORMAT } from "@/server/qr/constants";
import { renderUnsavedQRCodeRequestSchema } from "@/server/qr/schemas";

describe("renderUnsavedQRCodeRequestSchema", () => {
  it("parses a minimal request and fills design defaults", () => {
    const parsed = renderUnsavedQRCodeRequestSchema.parse({
      value: "https://decode.example.com",
      format: QR_EXPORT_FORMAT.PNG,
      design: {},
    });

    expect(parsed.format).toBe(QR_EXPORT_FORMAT.PNG);
    expect(parsed.design.frameColor).toBe("#2563EB");
    expect(parsed.design.frameStyle).toBe("none");
  });

  it("defaults the quiet-zone margin to the 4-module spec value", () => {
    const parsed = renderUnsavedQRCodeRequestSchema.parse({
      value: "https://decode.example.com",
      format: QR_EXPORT_FORMAT.PNG,
      design: {},
    });

    expect(parsed.design.margin).toBe(4);
  });

  it("leaves an omitted error-correction level undefined for adaptive resolution", () => {
    const parsed = renderUnsavedQRCodeRequestSchema.parse({
      value: "https://decode.example.com",
      format: QR_EXPORT_FORMAT.PNG,
      design: {},
    });

    expect(parsed.design.errorCorrectionLevel).toBeUndefined();
  });

  it("preserves an explicit error-correction level", () => {
    const parsed = renderUnsavedQRCodeRequestSchema.parse({
      value: "https://decode.example.com",
      format: QR_EXPORT_FORMAT.PNG,
      design: { errorCorrectionLevel: "M" },
    });

    expect(parsed.design.errorCorrectionLevel).toBe("M");
  });

  it("preserves an explicit frame color and style", () => {
    const parsed = renderUnsavedQRCodeRequestSchema.parse({
      value: "https://decode.example.com",
      format: QR_EXPORT_FORMAT.SVG,
      design: { frameColor: "#D01616", frameStyle: "classic" },
    });

    expect(parsed.design.frameColor).toBe("#D01616");
    expect(parsed.design.frameStyle).toBe("classic");
  });

  it("rejects an empty value", () => {
    expect(() =>
      renderUnsavedQRCodeRequestSchema.parse({
        value: "",
        format: QR_EXPORT_FORMAT.PNG,
        design: {},
      })
    ).toThrow();
  });

  it("rejects an unsupported format", () => {
    expect(() =>
      renderUnsavedQRCodeRequestSchema.parse({
        value: "https://decode.example.com",
        format: "gif",
        design: {},
      })
    ).toThrow();
  });

  it("rejects an out-of-range margin", () => {
    expect(() =>
      renderUnsavedQRCodeRequestSchema.parse({
        value: "https://decode.example.com",
        format: QR_EXPORT_FORMAT.PNG,
        design: { margin: 40 },
      })
    ).toThrow();
  });
});
