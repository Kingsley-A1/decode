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
    expect(html).not.toContain("r2.cloudflarestorage.com");
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
