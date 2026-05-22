import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { landingPageTypeSchema } from "@/server/landing-pages/schemas";
import { LANDING_PAGE_TYPE } from "@/server/landing-pages/constants";
import {
  LANDING_PAGE_TEMPLATE_SOURCE,
  LANDING_PAGE_TEMPLATE_STATUS,
} from "@/server/landing-page-templates/constants";

const templateKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Template key must use lowercase letters, numbers, and hyphens.",
  });
const shortTextSchema = z.string().trim().min(1).max(160);
const boundedTextSchema = z.string().trim().min(1).max(800);
const optionalPathSchema = z.string().trim().min(1).max(2048).optional();

export const landingPageTemplateCategorySchema = z.enum([
  "personal",
  "business",
  "restaurant",
  "hotel",
  "school",
  "event",
  "retail",
  "healthcare",
  "real_estate",
  "institution",
  "media",
  "documents",
  "feedback",
]);

export const landingPageTemplateStatusSchema = z.enum([
  LANDING_PAGE_TEMPLATE_STATUS.DRAFT,
  LANDING_PAGE_TEMPLATE_STATUS.PUBLISHED,
  LANDING_PAGE_TEMPLATE_STATUS.ARCHIVED,
]);

const templateFlagSchema = z.enum(["popular", "new"]);
const templateAssetKindSchema = z.enum(["image", "pdf", "audio"]);
const templateAssetSlotSchema = z.enum([
  "avatar",
  "logo",
  "hero",
  "gallery",
  "pdf",
  "audio",
  "document",
]);
const thumbnailToneSchema = z.enum([
  "sky",
  "emerald",
  "amber",
  "rose",
  "indigo",
  "slate",
]);
const templateSourceSchema = z.enum([
  LANDING_PAGE_TEMPLATE_SOURCE.FIRST_PARTY,
  LANDING_PAGE_TEMPLATE_SOURCE.ADMIN,
]);
const templateSortPrioritySchema = z.number().int().min(1).max(100_000);
const templateFlagsSchema = z.array(templateFlagSchema).max(4);
const templateTagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .min(1)
  .max(20);
const templateRequiredFieldsSchema = z
  .array(z.string().trim().min(1).max(80))
  .min(1)
  .max(20);
const templateOptionalFieldsSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(40);

export const landingPageTemplateAssetRequirementSchema = z.object({
  uploadedAssetId: z.string().trim().min(1).max(160).optional(),
  slot: templateAssetSlotSchema,
  label: shortTextSchema,
  kind: templateAssetKindSchema,
  required: z.boolean().default(false),
  assetPath: optionalPathSchema,
  alt: z.string().trim().max(160).optional(),
  width: z.number().int().positive().max(5000).optional(),
  height: z.number().int().positive().max(5000).optional(),
});
const templateAssetRequirementsSchema = z
  .array(landingPageTemplateAssetRequirementSchema)
  .max(12);

export const landingPageTemplateThumbnailSchema = z.object({
  label: shortTextSchema,
  alt: shortTextSchema,
  assetPath: optionalPathSchema,
  tone: thumbnailToneSchema,
});

export const landingPageTemplateMobilePreviewSchema = z.object({
  alt: shortTextSchema,
  assetPath: optionalPathSchema,
  width: z.literal(390),
  height: z.literal(844),
});

export const landingPageTemplateDefinitionSchema = z.object({
  key: templateKeySchema,
  type: landingPageTypeSchema,
  label: shortTextSchema,
  description: boundedTextSchema,
  category: landingPageTemplateCategorySchema,
  industry: shortTextSchema,
  status: landingPageTemplateStatusSchema.default(
    LANDING_PAGE_TEMPLATE_STATUS.DRAFT
  ),
  source: templateSourceSchema.default(LANDING_PAGE_TEMPLATE_SOURCE.ADMIN),
  sortPriority: templateSortPrioritySchema.default(1000),
  flags: templateFlagsSchema.default([]),
  tags: templateTagsSchema,
  recommendedFor: boundedTextSchema,
  requiredFields: templateRequiredFieldsSchema,
  optionalFields: templateOptionalFieldsSchema.default([]),
  defaultTitle: shortTextSchema,
  defaultContent: z.unknown(),
  assetRequirements: templateAssetRequirementsSchema.default([]),
  thumbnail: landingPageTemplateThumbnailSchema,
  mobilePreview: landingPageTemplateMobilePreviewSchema,
  accessibilityNotes: boundedTextSchema,
});

export const adminCreateLandingPageTemplateRequestSchema =
  landingPageTemplateDefinitionSchema;

export const adminUpdateLandingPageTemplateRequestSchema = z
  .object({
    key: templateKeySchema.optional(),
    type: landingPageTypeSchema.optional(),
    label: shortTextSchema.optional(),
    description: boundedTextSchema.optional(),
    category: landingPageTemplateCategorySchema.optional(),
    industry: shortTextSchema.optional(),
    status: landingPageTemplateStatusSchema.optional(),
    source: templateSourceSchema.optional(),
    sortPriority: templateSortPrioritySchema.optional(),
    flags: templateFlagsSchema.optional(),
    tags: templateTagsSchema.optional(),
    recommendedFor: boundedTextSchema.optional(),
    requiredFields: templateRequiredFieldsSchema.optional(),
    optionalFields: templateOptionalFieldsSchema.optional(),
    defaultTitle: shortTextSchema.optional(),
    defaultContent: z.unknown().optional(),
    assetRequirements: templateAssetRequirementsSchema.optional(),
    thumbnail: landingPageTemplateThumbnailSchema.optional(),
    mobilePreview: landingPageTemplateMobilePreviewSchema.optional(),
    accessibilityNotes: boundedTextSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one template field to update.",
  });

export function assertTemplateCanPublish(
  definition: LandingPageTemplateDefinition
): void {
  const content = templateDefaultContentSchemas[definition.type].parse(
    definition.defaultContent
  );
  const issues: z.ZodIssue[] = [];

  if (
    !definition.defaultContent ||
    typeof definition.defaultContent !== "object" ||
    Array.isArray(definition.defaultContent) ||
    Object.keys(definition.defaultContent).length === 0
  ) {
    issues.push({
      code: "custom",
      path: ["defaultContent"],
      message: "Default content is required before publishing.",
    });
  }

  if (!definition.thumbnail.assetPath?.trim()) {
    issues.push({
      code: "custom",
      path: ["thumbnail", "assetPath"],
      message: "Thumbnail asset path is required before publishing.",
    });
  }
  if (!definition.thumbnail.alt.trim()) {
    issues.push({
      code: "custom",
      path: ["thumbnail", "alt"],
      message: "Thumbnail alt text is required before publishing.",
    });
  }

  if (!definition.mobilePreview.assetPath?.trim()) {
    issues.push({
      code: "custom",
      path: ["mobilePreview", "assetPath"],
      message: "A rendered 390x844 mobile preview is required before publishing.",
    });
  }
  if (!definition.mobilePreview.alt.trim()) {
    issues.push({
      code: "custom",
      path: ["mobilePreview", "alt"],
      message: "Mobile preview alt text is required before publishing.",
    });
  }

  for (const field of definition.requiredFields) {
    if (!isTemplateFieldComplete(field, content)) {
      issues.push({
        code: "custom",
        path: ["requiredFields", field],
        message: `Default content does not satisfy required field: ${field}.`,
      });
    }
  }

  definition.assetRequirements.forEach((asset, index) => {
    const hasAsset = Boolean(asset.assetPath?.trim() || asset.uploadedAssetId?.trim());

    if (asset.required && !hasAsset) {
      issues.push({
        code: "custom",
        path: ["assetRequirements", index, "assetPath"],
        message: `${asset.label} is required before publishing.`,
      });
    }

    if (hasAsset && !asset.alt?.trim()) {
      issues.push({
        code: "custom",
        path: ["assetRequirements", index, "alt"],
        message: `${asset.label} alt text is required before publishing.`,
      });
    }
  });

  if (issues.length > 0) throw new z.ZodError(issues);
}

export function toTemplateJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export type LandingPageTemplateDefinition = z.infer<
  typeof landingPageTemplateDefinitionSchema
>;
export type AdminCreateLandingPageTemplateRequest = z.infer<
  typeof adminCreateLandingPageTemplateRequestSchema
>;
export type AdminUpdateLandingPageTemplateRequest = z.infer<
  typeof adminUpdateLandingPageTemplateRequestSchema
>;

const linkSchema = z.object({
  id: z.string().trim().max(120).optional(),
  label: shortTextSchema,
  url: z.string().trim().min(1).max(2048),
});

const menuItemSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: shortTextSchema,
  description: z.string().trim().max(500).optional(),
  price: z.string().trim().max(40).optional(),
});

const menuSectionSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: shortTextSchema,
  items: z.array(menuItemSchema).min(1).max(40),
});

const templateImageSchema = z.object({
  id: z.string().trim().max(120).optional(),
  assetId: z.string().trim().max(160).optional(),
  previewUrl: z.string().trim().max(2048).optional(),
  alt: z.string().trim().max(160).optional(),
  caption: z.string().trim().max(500).optional(),
});

const templateAssetSchema = z.object({
  assetId: z.string().trim().min(1).max(160),
  previewUrl: z.string().trim().max(2048).optional(),
  fileName: z.string().trim().max(160).optional(),
  contentType: z.string().trim().max(120).optional(),
});

const templateDefaultContentSchemas = {
  [LANDING_PAGE_TYPE.PROFILE]: z.object({
    displayName: shortTextSchema,
    headline: z.string().trim().max(160).optional(),
    bio: z.string().trim().max(1000).optional(),
    avatar: templateAssetSchema.optional(),
    links: z.array(linkSchema).max(20).default([]),
  }),
  [LANDING_PAGE_TYPE.BUSINESS]: z.object({
    businessName: shortTextSchema,
    tagline: z.string().trim().max(160).optional(),
    description: z.string().trim().max(1200).optional(),
    logo: templateAssetSchema.optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(254).optional(),
    website: z.string().trim().max(2048).optional(),
    address: z.string().trim().max(500).optional(),
    links: z.array(linkSchema).max(20).default([]),
  }),
  [LANDING_PAGE_TYPE.LINKS]: z.object({
    heading: shortTextSchema,
    description: z.string().trim().max(800).optional(),
    links: z.array(linkSchema).min(1).max(40),
  }),
  [LANDING_PAGE_TYPE.MENU]: z.object({
    restaurantName: shortTextSchema,
    description: z.string().trim().max(800).optional(),
    sections: z.array(menuSectionSchema).min(1).max(20),
  }),
  [LANDING_PAGE_TYPE.COUPON]: z.object({
    couponHeadline: shortTextSchema,
    couponCode: shortTextSchema,
    couponDetails: z.string().trim().max(1200).optional(),
    expiresAt: z.string().trim().max(80).optional(),
    redemptionUrl: z.string().trim().max(2048).optional(),
  }),
  [LANDING_PAGE_TYPE.EVENT]: z.object({
    eventName: shortTextSchema,
    startAt: z.string().trim().min(1).max(80),
    endAt: z.string().trim().max(80).optional(),
    location: z.string().trim().max(500).optional(),
    description: z.string().trim().max(1200).optional(),
    registrationUrl: z.string().trim().max(2048).optional(),
  }),
  [LANDING_PAGE_TYPE.FEEDBACK]: z.object({
    heading: shortTextSchema,
    description: z.string().trim().max(800).optional(),
    formUrl: z.string().trim().min(1).max(2048),
  }),
  [LANDING_PAGE_TYPE.PDF]: z.object({
    pdfTitle: shortTextSchema,
    description: z.string().trim().max(800).optional(),
    pdf: templateAssetSchema.optional(),
  }),
  [LANDING_PAGE_TYPE.IMAGES]: z.object({
    heading: shortTextSchema,
    description: z.string().trim().max(800).optional(),
    images: z.array(templateImageSchema).max(40).default([]),
  }),
  [LANDING_PAGE_TYPE.VIDEO_LINK]: z.object({
    videoTitle: shortTextSchema,
    videoUrl: z.string().trim().min(1).max(2048),
    description: z.string().trim().max(800).optional(),
  }),
  [LANDING_PAGE_TYPE.AUDIO_LINK]: z.object({
    audioTitle: shortTextSchema,
    audioUrl: z.string().trim().max(2048).optional(),
    audio: templateAssetSchema.optional(),
    description: z.string().trim().max(800).optional(),
  }).refine((value) => value.audioUrl || value.audio, {
    path: ["audioUrl"],
    message: "Provide an audio URL or an uploaded audio placeholder.",
  }),
} satisfies Record<z.infer<typeof landingPageTypeSchema>, z.ZodType>;

function isTemplateFieldComplete(
  field: string,
  content: Record<string, unknown>
): boolean {
  if (field === "links") return getArray(content.links).length > 0;
  if (field === "sections") return getArray(content.sections).length > 0;
  if (field === "images") return true;
  if (field === "pdf") return true;
  if (field === "audioUrl or audio") {
    return Boolean(getText(content.audioUrl) || content.audio);
  }

  return Boolean(getText(content[field]));
}

function getArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
