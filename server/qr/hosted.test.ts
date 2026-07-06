import { describe, expect, it } from "vitest";
import {
  getStoredContent,
  parseStoredVCardContent,
  renderContactPage,
  renderTextPage,
} from "@/server/qr/hosted";

describe("getStoredContent", () => {
  it("returns the content object from a stored payload", () => {
    expect(
      getStoredContent({ type: "text", value: "", content: { text: "hi" } })
    ).toEqual({ text: "hi" });
  });

  it("returns an empty object for malformed payloads", () => {
    expect(getStoredContent(null)).toEqual({});
    expect(getStoredContent("nope")).toEqual({});
    expect(getStoredContent([1, 2, 3])).toEqual({});
    expect(getStoredContent({ type: "text", value: "" })).toEqual({});
  });
});

describe("parseStoredVCardContent", () => {
  it("trims strings and drops empty fields", () => {
    expect(
      parseStoredVCardContent({
        firstName: "  Ada  ",
        lastName: "",
        organization: "   ",
        phone: "+15551234567",
        unrelated: 42,
      })
    ).toEqual({
      firstName: "Ada",
      lastName: undefined,
      organization: undefined,
      title: undefined,
      phone: "+15551234567",
      email: undefined,
      website: undefined,
      address: undefined,
    });
  });
});

describe("renderTextPage", () => {
  it("escapes HTML in the title and body", () => {
    const html = renderTextPage({
      title: "<b>Menu</b>",
      text: "<script>alert(1)</script>",
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;Menu&lt;/b&gt;");
  });

  it("preserves paragraph and line breaks without markup", () => {
    const html = renderTextPage({
      title: "Notice",
      text: "line one\nline two\n\nsecond paragraph",
    });

    expect(html).toContain("line one<br/>line two");
    expect(html.match(/<p>/g)?.length).toBe(2);
  });

  it("emits a no-index hosted document with no scripts", () => {
    const html = renderTextPage({ title: "Notice", text: "hello" });

    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toContain("<script");
  });
});

describe("renderContactPage", () => {
  it("renders safe tel/mailto/website links and a save-contact action", () => {
    const html = renderContactPage({
      title: "Ada Lovelace",
      content: {
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "+15551234567",
        email: "ada@example.com",
        website: "https://example.com",
      },
      vcfUrl: "/r/contact-card/vcf",
    });

    expect(html).toContain('href="tel:+15551234567"');
    expect(html).toContain('href="mailto:ada@example.com"');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="/r/contact-card/vcf"');
    expect(html).toContain("Save contact");
  });

  it("does not turn an unsafe scheme into a link", () => {
    const html = renderContactPage({
      title: "Attacker",
      content: { firstName: "Eve", website: "javascript:alert(1)" },
      vcfUrl: "/r/x/vcf",
    });

    expect(html).not.toContain('href="javascript:');
    // The value survives as escaped text, never as an anchor target.
    expect(html).toContain("javascript:alert(1)");
  });

  it("escapes injected markup in contact fields", () => {
    const html = renderContactPage({
      title: "X",
      content: { organization: "<img src=x onerror=alert(1)>" },
      vcfUrl: "/r/x/vcf",
    });

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });
});
