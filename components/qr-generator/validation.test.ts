import { describe, expect, it } from "vitest";
import { initialFormState } from "./constants";
import {
  getHttpUrlValidationError,
  isValidEmail,
  normalizeHttpUrl,
  normalizePhone,
  validateContent,
} from "./validation";
import type { FormState } from "./types";

function formWith(overrides: Partial<FormState>): FormState {
  return { ...initialFormState, ...overrides };
}

describe("normalizeHttpUrl", () => {
  it("adds https when no scheme is present", () => {
    expect(normalizeHttpUrl("example.com")).toBe("https://example.com/");
  });

  it("preserves an explicit http scheme", () => {
    expect(normalizeHttpUrl("http://example.com/path")).toBe(
      "http://example.com/path"
    );
  });

  it("throws for unsupported protocols", () => {
    expect(() => normalizeHttpUrl("ftp://example.com")).toThrow();
  });

  it("throws for empty input", () => {
    expect(() => normalizeHttpUrl("   ")).toThrow();
  });
});

describe("getHttpUrlValidationError", () => {
  it("returns null for a valid bare host", () => {
    expect(getHttpUrlValidationError("example.com")).toBeNull();
  });

  it("flags embedded spaces", () => {
    expect(getHttpUrlValidationError("example .com")).toMatch(/spaces/i);
  });

  it("flags a missing colon after the protocol", () => {
    expect(getHttpUrlValidationError("https//example.com")).toMatch(/colon/i);
  });

  it("rejects non-http schemes", () => {
    expect(getHttpUrlValidationError("mailto:a@b.com")).toMatch(/https?/i);
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("hello@example.com")).toBe(true);
  });

  it("rejects an address without a domain", () => {
    expect(isValidEmail("hello@")).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("strips formatting but keeps a leading plus", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });
});

describe("validateContent", () => {
  it("requires a URL for url codes", () => {
    const result = validateContent({
      type: "url",
      mode: "static",
      form: formWith({ url: "" }),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.url).toBeDefined();
  });

  it("accepts a valid URL", () => {
    const result = validateContent({
      type: "url",
      mode: "static",
      form: formWith({ url: "https://example.com" }),
    });

    expect(result.isValid).toBe(true);
  });

  it("blocks dynamic codes that are not url type", () => {
    const result = validateContent({
      type: "email",
      mode: "dynamic",
      form: formWith({ email: "hello@example.com" }),
    });

    expect(result.errors.type).toBeDefined();
  });

  it("requires a name or organization for vCards", () => {
    const result = validateContent({
      type: "vcard",
      mode: "static",
      form: formWith({ firstName: "", lastName: "", organization: "" }),
    });

    expect(result.errors.vcardName).toBeDefined();
  });
});
