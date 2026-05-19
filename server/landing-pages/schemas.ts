import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  LANDING_PAGE_STATUS,
  LANDING_PAGE_TYPE,
  type LandingPageType,
} from "@/server/landing-pages/constants";
import { normalizeHttpUrl } from "@/server/qr/payload";

const assetIdSchema = z.string().trim().min(1).max(128);
const boundedTextSchema = z.string().trim().max(500);
const shortTextSchema = z.string().trim().max(160);
const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .transform((value) => normalizeHttpUrl(value));

const linkSchema = z.object({
  label: shortTextSchema.min(1),
  url: httpUrlSchema,
});

const imageReferenceSchema = z.object({
  assetId: assetIdSchema,
  alt: shortTextSchema.optional(),
  caption: boundedTextSchema.optional(),
});

const menuItemSchema = z.object({
  name: shortTextSchema.min(1),
  description: boundedTextSchema.optional(),
  price: z.string().trim().max(40).optional(),
});

const menuSectionSchema = z.object({
  name: shortTextSchema.min(1),
  items: z.array(menuItemSchema).min(1).max(40),
});

const baseLandingPageRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  qrCodeId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  status: z
    .enum([
      LANDING_PAGE_STATUS.DRAFT,
      LANDING_PAGE_STATUS.PUBLISHED,
      LANDING_PAGE_STATUS.ARCHIVED,
    ])
    .default(LANDING_PAGE_STATUS.PUBLISHED),
  content: z.unknown(),
});

export const landingPageTypeSchema = z.enum([
  LANDING_PAGE_TYPE.PROFILE,
  LANDING_PAGE_TYPE.BUSINESS,
  LANDING_PAGE_TYPE.LINKS,
  LANDING_PAGE_TYPE.MENU,
  LANDING_PAGE_TYPE.COUPON,
  LANDING_PAGE_TYPE.EVENT,
  LANDING_PAGE_TYPE.FEEDBACK,
  LANDING_PAGE_TYPE.PDF,
  LANDING_PAGE_TYPE.IMAGES,
  LANDING_PAGE_TYPE.VIDEO_LINK,
  LANDING_PAGE_TYPE.AUDIO_LINK,
]);

export const landingPageStatusSchema = z.enum([
  LANDING_PAGE_STATUS.DRAFT,
  LANDING_PAGE_STATUS.PUBLISHED,
  LANDING_PAGE_STATUS.ARCHIVED,
]);

export const landingPageContentSchemas = {
  [LANDING_PAGE_TYPE.PROFILE]: z.object({
    displayName: shortTextSchema.min(1),
    headline: shortTextSchema.optional(),
    bio: z.string().trim().max(1000).optional(),
    avatarAssetId: assetIdSchema.optional(),
    links: z.array(linkSchema).max(20).default([]),
  }),
  [LANDING_PAGE_TYPE.BUSINESS]: z.object({
    businessName: shortTextSchema.min(1),
    tagline: shortTextSchema.optional(),
    description: z.string().trim().max(1200).optional(),
    logoAssetId: assetIdSchema.optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(254).optional(),
    website: httpUrlSchema.optional(),
    address: boundedTextSchema.optional(),
    links: z.array(linkSchema).max(20).default([]),
  }),
  [LANDING_PAGE_TYPE.LINKS]: z.object({
    heading: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    links: z.array(linkSchema).min(1).max(40),
  }),
  [LANDING_PAGE_TYPE.MENU]: z.object({
    restaurantName: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    sections: z.array(menuSectionSchema).min(1).max(20),
  }),
  [LANDING_PAGE_TYPE.COUPON]: z.object({
    headline: shortTextSchema.min(1),
    code: z.string().trim().min(1).max(80),
    details: z.string().trim().max(1200).optional(),
    expiresAt: z.string().trim().datetime().optional(),
    redemptionUrl: httpUrlSchema.optional(),
  }),
  [LANDING_PAGE_TYPE.EVENT]: z.object({
    name: shortTextSchema.min(1),
    startAt: z.string().trim().datetime(),
    endAt: z.string().trim().datetime().optional(),
    location: boundedTextSchema.optional(),
    description: z.string().trim().max(1200).optional(),
    registrationUrl: httpUrlSchema.optional(),
  }),
  [LANDING_PAGE_TYPE.FEEDBACK]: z.object({
    heading: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    formUrl: httpUrlSchema,
  }),
  [LANDING_PAGE_TYPE.PDF]: z.object({
    title: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    pdfAssetId: assetIdSchema,
  }),
  [LANDING_PAGE_TYPE.IMAGES]: z.object({
    title: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    images: z.array(imageReferenceSchema).min(1).max(40),
  }),
  [LANDING_PAGE_TYPE.VIDEO_LINK]: z.object({
    title: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    videoUrl: httpUrlSchema,
  }),
  [LANDING_PAGE_TYPE.AUDIO_LINK]: z.object({
    title: shortTextSchema.min(1),
    description: boundedTextSchema.optional(),
    audioUrl: httpUrlSchema.optional(),
    audioAssetId: assetIdSchema.optional(),
  }).refine((value) => value.audioUrl || value.audioAssetId, {
    path: ["audioUrl"],
    message: "Provide an audio URL or an uploaded audio asset.",
  }),
} satisfies Record<LandingPageType, z.ZodType>;

export const createLandingPageRequestSchema =
  baseLandingPageRequestSchema.extend({
    type: landingPageTypeSchema,
  });

export const updateLandingPageRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  status: landingPageStatusSchema.optional(),
  type: landingPageTypeSchema.optional(),
  content: z.unknown().optional(),
});

export function parseLandingPageContent(
  type: LandingPageType,
  content: unknown
): Prisma.InputJsonValue {
  return landingPageContentSchemas[type].parse(content) as Prisma.InputJsonValue;
}

export function getLandingPageContentAssetIds(
  type: LandingPageType,
  content: unknown
): string[] {
  const record = getJsonRecord(content);

  switch (type) {
    case LANDING_PAGE_TYPE.PROFILE:
      return getOptionalAssetIds(record.avatarAssetId);
    case LANDING_PAGE_TYPE.BUSINESS:
      return getOptionalAssetIds(record.logoAssetId);
    case LANDING_PAGE_TYPE.PDF:
      return getOptionalAssetIds(record.pdfAssetId);
    case LANDING_PAGE_TYPE.IMAGES:
      return getJsonArray(record.images)
        .flatMap((image) => getOptionalAssetIds(getJsonRecord(image).assetId));
    case LANDING_PAGE_TYPE.AUDIO_LINK:
      return getOptionalAssetIds(record.audioAssetId);
    default:
      return [];
  }
}

function getJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function getJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getOptionalAssetIds(value: unknown): string[] {
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

export type CreateLandingPageRequest = z.infer<
  typeof createLandingPageRequestSchema
>;
export type UpdateLandingPageRequest = z.infer<
  typeof updateLandingPageRequestSchema
>;
