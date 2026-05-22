import { describe, expect, it } from "vitest";
import { defaultLandingPageTemplatePresets } from "@/components/landing-pages/landing-page-data";
import { LANDING_PAGE_TEMPLATE_STATUS } from "@/server/landing-page-templates/constants";
import {
  adminUpdateLandingPageTemplateRequestSchema,
  assertTemplateCanPublish,
  landingPageTemplateAssetRequirementSchema,
  landingPageTemplateDefinitionSchema,
  landingPageTemplateMobilePreviewSchema,
} from "@/server/landing-page-templates/schemas";

describe("landing page template schemas", () => {
  it("accepts the first-party template catalog as publishable seed data", () => {
    for (const template of defaultLandingPageTemplatePresets) {
      const parsed = landingPageTemplateDefinitionSchema.parse(template);

      expect(() => assertTemplateCanPublish(parsed)).not.toThrow();
    }
  });

  it("rejects published templates whose default content misses required fields", () => {
    const template = landingPageTemplateDefinitionSchema.parse({
      ...defaultLandingPageTemplatePresets[0],
      key: "broken-business-template",
      type: "business",
      label: "Broken business template",
      requiredFields: ["businessName"],
      defaultContent: { tagline: "No business name" },
    });

    expect(() => assertTemplateCanPublish(template)).toThrow("businessName");
  });

  it("rejects empty update payloads before they reach admin mutation handlers", () => {
    expect(() => adminUpdateLandingPageTemplateRequestSchema.parse({})).toThrow(
      "Provide at least one template field to update."
    );
  });

  it("rejects invalid asset metadata that would destabilize template previews", () => {
    expect(() =>
      landingPageTemplateAssetRequirementSchema.parse({
        slot: "hero",
        label: "Hero image",
        kind: "image",
        required: true,
        width: 0,
        height: 900,
      })
    ).toThrow();

    expect(() =>
      landingPageTemplateMobilePreviewSchema.parse({
        alt: "School admissions mobile preview",
        width: 375,
        height: 844,
      })
    ).toThrow();
  });

  it("rejects published templates missing public thumbnail or mobile preview assets", () => {
    const template = landingPageTemplateDefinitionSchema.parse({
      ...defaultLandingPageTemplatePresets[0],
      key: "missing-preview-assets",
      status: LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED,
    });

    expect(() =>
      assertTemplateCanPublish({
        ...template,
        thumbnail: { ...template.thumbnail, assetPath: undefined },
      })
    ).toThrow("Thumbnail asset path");

    expect(() =>
      assertTemplateCanPublish({
        ...template,
        mobilePreview: { ...template.mobilePreview, assetPath: undefined },
      })
    ).toThrow("mobile preview");
  });

  it("rejects published templates with missing required assets or attached asset alt text", () => {
    const template = landingPageTemplateDefinitionSchema.parse({
      ...defaultLandingPageTemplatePresets[0],
      key: "missing-required-assets",
      status: LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED,
    });

    expect(() =>
      assertTemplateCanPublish({
        ...template,
        assetRequirements: [
          {
            slot: "hero",
            label: "Hero image",
            kind: "image",
            required: true,
            alt: "Hero image",
          },
        ],
      })
    ).toThrow("Hero image");

    expect(() =>
      assertTemplateCanPublish({
        ...template,
        assetRequirements: [
          {
            slot: "hero",
            label: "Hero image",
            kind: "image",
            required: false,
            assetPath: "/assets/landing-page-templates/example.webp",
          },
        ],
      })
    ).toThrow("alt text");
  });

  it("validates template-specific default content shapes before publish", () => {
    const couponTemplate = landingPageTemplateDefinitionSchema.parse({
      ...defaultLandingPageTemplatePresets.find(
        (template) => template.key === "restaurant-coupon"
      )!,
      key: "phase-8-coupon",
      status: LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED,
      requiredFields: ["couponHeadline", "couponCode"],
      defaultContent: {
        headline: "Wrong shape",
        code: "WRONG",
      },
    });

    expect(() => assertTemplateCanPublish(couponTemplate)).toThrow(
      "couponHeadline"
    );
  });

  it("allows draft templates to be saved while still blocking invalid publish", () => {
    const draftTemplate = landingPageTemplateDefinitionSchema.parse({
      ...defaultLandingPageTemplatePresets[0],
      key: "phase-8-draft-template",
      status: LANDING_PAGE_TEMPLATE_STATUS.DRAFT,
      requiredFields: ["displayName"],
      defaultContent: { links: [] },
    });

    expect(draftTemplate.status).toBe(LANDING_PAGE_TEMPLATE_STATUS.DRAFT);
    expect(() => assertTemplateCanPublish(draftTemplate)).toThrow("displayName");
  });
});
