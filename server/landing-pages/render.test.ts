import { describe, expect, it } from "vitest";
import { LANDING_PAGE_TYPE } from "@/server/landing-pages/constants";
import { renderLandingPageHtml } from "@/server/landing-pages/render";

describe("renderLandingPageHtml", () => {
  it("renders asset IDs through the Decode asset proxy instead of R2 keys", () => {
    const html = renderLandingPageHtml({
      title: "Gallery",
      type: LANDING_PAGE_TYPE.IMAGES,
      content: {
        title: "Gallery",
        images: [
          {
            assetId: "asset_123",
            alt: "Display",
            caption: "workspaces/private/key.png",
          },
        ],
      },
    });

    expect(html).toContain("/api/assets/asset_123");
    expect(html).toContain('width="1200" height="800" loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain("r2.cloudflarestorage.com");
  });

  it("renders optional hero images with intrinsic dimensions and useful labels", () => {
    const html = renderLandingPageHtml({
      title: "School Admissions",
      type: LANDING_PAGE_TYPE.BUSINESS,
      content: {
        businessName: "School Admissions",
        heroAssetId: "hero_123",
        heroAlt: "Students walking through a school campus entrance",
        heroWidth: 1600,
        heroHeight: 900,
      },
    });

    expect(html).toContain('class="hero-media"');
    expect(html).toContain('src="/api/assets/hero_123"');
    expect(html).toContain('alt="Students walking through a school campus entrance"');
    expect(html).toContain('width="1600" height="900" loading="eager"');
    expect(html).toContain('fetchpriority="high"');
  });

  it("labels audio controls and keeps the media output server-rendered", () => {
    const html = renderLandingPageHtml({
      title: "Audio Guide",
      type: LANDING_PAGE_TYPE.AUDIO_LINK,
      content: {
        title: "Audio Guide",
        audioAssetId: "audio_123",
      },
    });

    expect(html).toContain('aria-labelledby="audio-heading"');
    expect(html).toContain('preload="metadata"');
    expect(html).toContain('aria-label="Audio Guide audio"');
    expect(html).not.toContain("<script");
  });

  it("renders proposed product pages defensively when content already exists", () => {
    const html = renderLandingPageHtml({
      title: "Warranty QR",
      type: "product",
      content: {
        productName: "Smart Bottle",
        brandName: "Decode Goods",
        summary: "Scan for warranty, support, and care instructions.",
        hero: {
          assetPath: "/assets/landing-page-templates/retail/product-packaging.webp",
          alt: "Reusable smart bottle on a retail display",
          width: 1600,
          height: 900,
        },
        gallery: [{ assetId: "gallery_123", alt: "Smart bottle packaging" }],
        buyUrl: "https://example.com/buy",
      },
    });

    expect(html).toContain("<h1>Smart Bottle</h1>");
    expect(html).toContain("Decode Goods");
    expect(html).toContain(
      "/assets/landing-page-templates/retail/product-packaging.webp"
    );
    expect(html).toContain("/api/assets/gallery_123");
    expect(html).toContain("Buy product");
  });

  it("renders one clear h1 and no client-side script dependency", () => {
    const html = renderLandingPageHtml({
      title: "Creator Links",
      type: LANDING_PAGE_TYPE.LINKS,
      content: {
        heading: "Creator Links",
        links: [{ label: "Portfolio", url: "https://example.com" }],
      },
    });

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('<main class="page-shell">');
    expect(html).toContain("<article");
    expect(html).not.toContain("<script");
  });

  it("escapes user-provided display content", () => {
    const html = renderLandingPageHtml({
      title: "<script>alert(1)</script>",
      type: LANDING_PAGE_TYPE.PROFILE,
      content: { displayName: "<img src=x onerror=alert(1)>", links: [] },
    });

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });
});
