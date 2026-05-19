import { describe, expect, it } from "vitest";
import {
  LANDING_PAGE_STATUS,
  LANDING_PAGE_TYPE,
} from "@/server/landing-pages/constants";
import {
  createLandingPageRequestSchema,
  getLandingPageContentAssetIds,
  parseLandingPageContent,
} from "@/server/landing-pages/schemas";

describe("landing page schemas", () => {
  it("accepts every supported landing page type", () => {
    const examples = [
      {
        type: LANDING_PAGE_TYPE.PROFILE,
        content: { displayName: "Ada", links: [] },
      },
      {
        type: LANDING_PAGE_TYPE.BUSINESS,
        content: { businessName: "Decode", website: "decode.example" },
      },
      {
        type: LANDING_PAGE_TYPE.LINKS,
        content: {
          heading: "Useful links",
          links: [{ label: "Docs", url: "decode.example/docs" }],
        },
      },
      {
        type: LANDING_PAGE_TYPE.MENU,
        content: {
          restaurantName: "Decode Cafe",
          sections: [{ name: "Lunch", items: [{ name: "Rice", price: "$12" }] }],
        },
      },
      {
        type: LANDING_PAGE_TYPE.COUPON,
        content: { headline: "Save 20%", code: "DECODE20" },
      },
      {
        type: LANDING_PAGE_TYPE.EVENT,
        content: { name: "Launch", startAt: "2026-05-18T10:00:00.000Z" },
      },
      {
        type: LANDING_PAGE_TYPE.FEEDBACK,
        content: { heading: "Feedback", formUrl: "forms.example/decode" },
      },
      {
        type: LANDING_PAGE_TYPE.PDF,
        content: { title: "Brochure", pdfAssetId: "asset_123" },
      },
      {
        type: LANDING_PAGE_TYPE.IMAGES,
        content: {
          title: "Gallery",
          images: [{ assetId: "asset_123", alt: "Display" }],
        },
      },
      {
        type: LANDING_PAGE_TYPE.VIDEO_LINK,
        content: { title: "Watch", videoUrl: "video.example/watch" },
      },
      {
        type: LANDING_PAGE_TYPE.AUDIO_LINK,
        content: { title: "Listen", audioAssetId: "asset_123" },
      },
    ] as const;

    for (const example of examples) {
      const request = createLandingPageRequestSchema.parse({
        qrCodeId: "qr_123",
        title: "Landing page",
        status: LANDING_PAGE_STATUS.PUBLISHED,
        ...example,
      });
      const content = parseLandingPageContent(request.type, request.content);

      expect(content).toBeTruthy();
    }
  });

  it("normalizes external URLs inside landing page content", () => {
    const content = parseLandingPageContent(LANDING_PAGE_TYPE.LINKS, {
      heading: "Links",
      links: [{ label: "Website", url: "decode.example" }],
    });

    expect(content).toMatchObject({
      links: [{ url: "https://decode.example/" }],
    });
  });

  it("extracts referenced assets for landing page attachment", () => {
    const content = parseLandingPageContent(LANDING_PAGE_TYPE.IMAGES, {
      title: "Gallery",
      images: [{ assetId: "asset_one" }, { assetId: "asset_two" }],
    });

    expect(getLandingPageContentAssetIds(LANDING_PAGE_TYPE.IMAGES, content)).toEqual([
      "asset_one",
      "asset_two",
    ]);
  });
});
