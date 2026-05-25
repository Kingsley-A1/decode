import { describe, expect, it } from "vitest";
import { QR_CODE_TYPE } from "@/server/qr/constants";
import { buildQRPayload } from "@/server/qr/payload";
import type { CreateQRCodeRequest } from "@/server/qr/schemas";

const baseRequest = {
  mode: "static",
  save: false,
  design: {
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
  },
} as const;

describe("buildQRPayload", () => {
  it("builds a normalized website URL payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.URL,
      content: { url: "example.com/path" },
    });

    expect(payload.value).toBe("https://example.com/path");
    expect(payload.destinationUrl).toBe("https://example.com/path");
  });

  it("builds a text payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.TEXT,
      content: { text: "Decode platform" },
    });

    expect(payload.value).toBe("Decode platform");
  });

  it("builds an email payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.EMAIL,
      content: {
        email: "team@example.com",
        subject: "Hello",
        body: "Decode",
      },
    });

    expect(payload.value).toBe("mailto:team@example.com?subject=Hello&body=Decode");
  });

  it("builds a phone payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.PHONE,
      content: { phone: "+1 (555) 123-4567" },
    });

    expect(payload.value).toBe("tel:+15551234567");
  });

  it("builds an SMS payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.SMS,
      content: { phone: "+1 555 123 4567", message: "Scan complete" },
    });

    expect(payload.value).toBe("SMSTO:+15551234567:Scan complete");
  });

  it("builds a Wi-Fi payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.WIFI,
      content: {
        ssid: "Decode HQ",
        password: "pass;word",
        encryption: "WPA",
        hidden: true,
      },
    });

    expect(payload.value).toBe("WIFI:T:WPA;S:Decode HQ;P:pass\\;word;H:true;;");
  });

  it("builds a vCard payload", () => {
    const payload = buildQRPayload({
      ...baseRequest,
      type: QR_CODE_TYPE.VCARD,
      content: {
        firstName: "Ada",
        lastName: "Lovelace",
        organization: "Decode",
        email: "ada@example.com",
        website: "decode.example.com",
      },
    } satisfies CreateQRCodeRequest);

    expect(payload.value).toContain("BEGIN:VCARD");
    expect(payload.value).toContain("FN:Ada Lovelace");
    expect(payload.value).toContain("URL:https://decode.example.com/");
  });
});
