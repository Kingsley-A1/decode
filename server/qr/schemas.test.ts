import { describe, expect, it } from "vitest";
import {
  QR_CODE_MODE,
  QR_CODE_TYPE,
  QR_EXPORT_FORMAT,
} from "@/server/qr/constants";
import {
  createQRCodeRequestSchema,
  parseEditableDynamicContent,
  renderUnsavedQRCodeRequestSchema,
} from "@/server/qr/schemas";

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

describe("createQRCodeRequestSchema dynamic types", () => {
  const dynamicBase = { mode: QR_CODE_MODE.DYNAMIC, save: true } as const;

  it("accepts a dynamic text code", () => {
    const parsed = createQRCodeRequestSchema.parse({
      ...dynamicBase,
      type: QR_CODE_TYPE.TEXT,
      content: { text: "Today's specials" },
    });

    expect(parsed.type).toBe(QR_CODE_TYPE.TEXT);
  });

  it("accepts a dynamic contact-card code", () => {
    const parsed = createQRCodeRequestSchema.parse({
      ...dynamicBase,
      type: QR_CODE_TYPE.VCARD,
      content: { firstName: "Ada", lastName: "Lovelace" },
    });

    expect(parsed.type).toBe(QR_CODE_TYPE.VCARD);
  });

  it("accepts a dynamic file code with an asset reference", () => {
    const parsed = createQRCodeRequestSchema.parse({
      ...dynamicBase,
      type: QR_CODE_TYPE.FILE,
      content: { assetId: "asset_123", fileName: "menu.pdf" },
    });

    expect(parsed.type).toBe(QR_CODE_TYPE.FILE);
  });

  it("accepts a dynamic landing-page code with empty content", () => {
    const parsed = createQRCodeRequestSchema.parse({
      ...dynamicBase,
      type: QR_CODE_TYPE.LANDING_PAGE,
      content: {},
    });

    expect(parsed.type).toBe(QR_CODE_TYPE.LANDING_PAGE);
  });

  it("rejects a static file code (dynamic-only type)", () => {
    expect(() =>
      createQRCodeRequestSchema.parse({
        mode: QR_CODE_MODE.STATIC,
        save: false,
        type: QR_CODE_TYPE.FILE,
        content: { assetId: "asset_123", fileName: "menu.pdf" },
      })
    ).toThrow();
  });

  it("rejects a static landing-page code (dynamic-only type)", () => {
    expect(() =>
      createQRCodeRequestSchema.parse({
        mode: QR_CODE_MODE.STATIC,
        save: false,
        type: QR_CODE_TYPE.LANDING_PAGE,
        content: {},
      })
    ).toThrow();
  });

  it("rejects a dynamic type outside the supported set", () => {
    expect(() =>
      createQRCodeRequestSchema.parse({
        ...dynamicBase,
        type: QR_CODE_TYPE.WIFI,
        content: { ssid: "Guest" },
      })
    ).toThrow();
  });

  it("rejects a file code missing its file name", () => {
    expect(() =>
      createQRCodeRequestSchema.parse({
        ...dynamicBase,
        type: QR_CODE_TYPE.FILE,
        content: { assetId: "asset_123" },
      })
    ).toThrow();
  });
});

describe("parseEditableDynamicContent", () => {
  it("validates and returns text content", () => {
    const result = parseEditableDynamicContent(QR_CODE_TYPE.TEXT, {
      text: "hello",
    });

    expect(result).toEqual({ type: QR_CODE_TYPE.TEXT, content: { text: "hello" } });
  });

  it("validates and returns contact content", () => {
    const result = parseEditableDynamicContent(QR_CODE_TYPE.VCARD, {
      firstName: "Ada",
    });

    expect(result?.type).toBe(QR_CODE_TYPE.VCARD);
  });

  it("returns null for a type without an in-place editor", () => {
    expect(parseEditableDynamicContent(QR_CODE_TYPE.URL, { url: "x" })).toBeNull();
    expect(parseEditableDynamicContent(QR_CODE_TYPE.FILE, {})).toBeNull();
  });

  it("throws on invalid content for an editable type", () => {
    expect(() =>
      parseEditableDynamicContent(QR_CODE_TYPE.TEXT, { text: "" })
    ).toThrow();
  });
});
