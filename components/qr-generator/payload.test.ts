import { describe, expect, it } from "vitest";
import { initialDesignState, initialFormState } from "./constants";
import {
  buildApiContent,
  buildPayload,
  escapeVCardValue,
  escapeWifiValue,
  getDynamicPublishSignature,
} from "./payload";
import type { FormState } from "./types";

function formWith(overrides: Partial<FormState>): FormState {
  return { ...initialFormState, ...overrides };
}

describe("buildPayload", () => {
  it("encodes mailto subjects with percent-encoded spaces, not plus", () => {
    const payload = buildPayload({
      type: "email",
      mode: "static",
      form: formWith({ email: "a@b.com", emailSubject: "Spring Sale" }),
    });

    expect(payload?.value).toBe("mailto:a@b.com?subject=Spring%20Sale");
    expect(payload?.value).not.toContain("+");
  });

  it("strips newlines from SMS messages so the delimiter stays intact", () => {
    const payload = buildPayload({
      type: "sms",
      mode: "static",
      form: formWith({ smsPhone: "+15551234567", smsMessage: "line one\nline two" }),
    });

    expect(payload?.value).toBe("SMSTO:+15551234567:line one line two");
  });

  it("builds a wa.me link without the leading plus", () => {
    const payload = buildPayload({
      type: "whatsapp",
      mode: "static",
      form: formWith({ whatsappPhone: "+15551234567", whatsappMessage: "hi there" }),
    });

    expect(payload?.value).toBe("https://wa.me/15551234567?text=hi%20there");
  });

  it("escapes Wi-Fi special characters", () => {
    const payload = buildPayload({
      type: "wifi",
      mode: "static",
      form: formWith({ wifiSsid: "Cafe;Guest", wifiPassword: "p:a,ss" }),
    });

    expect(payload?.value).toContain("S:Cafe\\;Guest;");
    expect(payload?.value).toContain("P:p\\:a\\,ss;");
  });

  it("returns a publish-required placeholder for unpublished dynamic codes", () => {
    const payload = buildPayload({
      type: "url",
      mode: "dynamic",
      form: formWith({ url: "https://example.com" }),
      publishedDynamicPayload: null,
      dynamicPublishSignature: "sig",
    });

    expect(payload?.value).toBe("");
    expect(payload?.requiresPublish).toBe(true);
  });

  it("returns the published value when the signature matches", () => {
    const payload = buildPayload({
      type: "url",
      mode: "dynamic",
      form: formWith({ url: "https://example.com" }),
      publishedDynamicPayload: {
        qrCodeId: "id",
        slug: "abc",
        payloadValue: "https://dcd.to/abc",
        destinationUrl: "https://example.com/",
        signature: "sig",
      },
      dynamicPublishSignature: "sig",
    });

    expect(payload?.value).toBe("https://dcd.to/abc");
    expect(payload?.requiresPublish).toBeUndefined();
  });

  it("marks a published dynamic code stale when the signature drifts", () => {
    const payload = buildPayload({
      type: "url",
      mode: "dynamic",
      form: formWith({ url: "https://example.com" }),
      publishedDynamicPayload: {
        qrCodeId: "id",
        slug: "abc",
        payloadValue: "https://dcd.to/abc",
        destinationUrl: "https://example.com/",
        signature: "old",
      },
      dynamicPublishSignature: "new",
    });

    expect(payload?.requiresPublish).toBe(true);
    expect(payload?.isStale).toBe(true);
  });

  it("returns null when content cannot produce a payload", () => {
    const payload = buildPayload({
      type: "url",
      mode: "static",
      form: formWith({ url: "not a url" }),
    });

    expect(payload).toBeNull();
  });
});

describe("buildApiContent", () => {
  it("omits empty optional fields", () => {
    const content = buildApiContent("email", formWith({ email: "a@b.com" }));

    expect(content).toEqual({ email: "a@b.com" });
  });
});

describe("getDynamicPublishSignature", () => {
  it("changes when the destination changes", () => {
    const first = getDynamicPublishSignature({
      form: formWith({ url: "https://a.com" }),
      design: initialDesignState,
      logoUrl: "",
    });
    const second = getDynamicPublishSignature({
      form: formWith({ url: "https://b.com" }),
      design: initialDesignState,
      logoUrl: "",
    });

    expect(first).not.toBe(second);
  });

  it("uses a presence marker for the logo so large data URLs do not bloat it", () => {
    const withLogo = getDynamicPublishSignature({
      form: formWith({ url: "https://a.com" }),
      design: initialDesignState,
      logoUrl: "data:image/png;base64," + "A".repeat(5000),
    });

    expect(withLogo).not.toBeNull();
    expect((withLogo ?? "").length).toBeLessThan(500);
  });

  it("returns null for an invalid URL", () => {
    expect(
      getDynamicPublishSignature({
        form: formWith({ url: "" }),
        design: initialDesignState,
        logoUrl: "",
      })
    ).toBeNull();
  });
});

describe("escape helpers", () => {
  it("escapes vCard separators", () => {
    expect(escapeVCardValue("a;b,c\\d")).toBe("a\\;b\\,c\\\\d");
  });

  it("escapes Wi-Fi separators", () => {
    expect(escapeWifiValue('a;b:c"d')).toBe('a\\;b\\:c\\"d');
  });
});
