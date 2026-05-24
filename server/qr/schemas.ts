import { z } from "zod";
import {
  QR_CODE_MODE,
  QR_CODE_TYPE,
  QR_CORNER_STYLE,
  QR_DOT_STYLE,
  QR_ERROR_CORRECTION_LEVEL,
  QR_EXPORT_FORMAT,
} from "@/server/qr/constants";
import {
  DYNAMIC_SLUG_PATTERN,
  isReservedDynamicSlug,
  normalizeDynamicSlug,
} from "@/server/qr/slugs";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color such as #0EA5E9.");

const dynamicSlugSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters for the dynamic QR slug.")
  .max(64, "Use no more than 64 characters for the dynamic QR slug.")
  .transform((value) => normalizeDynamicSlug(value))
  .refine((value) => DYNAMIC_SLUG_PATTERN.test(value), {
    message:
      "Use lowercase letters, numbers, and hyphens. Start and end with a letter or number.",
  })
  .refine((value) => !isReservedDynamicSlug(value), {
    message: "This slug is reserved by Decode.",
  });

export const defaultQRDesignConfig = {
  foregroundColor: "#0F172A",
  backgroundColor: "#FFFFFF",
  margin: 16,
  logoSizeRatio: 0,
  dotStyle: QR_DOT_STYLE.SQUARE,
  cornerStyle: QR_CORNER_STYLE.SQUARE,
  errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL.QUARTILE,
  size: 1024,
} as const;

const baseCreateQRCodeSchema = z.object({
  mode: z
    .enum([QR_CODE_MODE.STATIC, QR_CODE_MODE.DYNAMIC])
    .default(QR_CODE_MODE.STATIC),
  title: z.string().trim().min(1).max(120).optional(),
  save: z.boolean().default(false),
  workspaceId: z.string().trim().min(1).optional(),
  slug: dynamicSlugSchema.optional(),
  design: z
    .object({
      foregroundColor: hexColorSchema.default("#0F172A"),
      backgroundColor: hexColorSchema.default("#FFFFFF"),
      margin: z.number().int().min(0).max(16).default(16),
      logoSizeRatio: z.number().min(0).max(0.35).default(0),
      dotStyle: z
        .enum([
          QR_DOT_STYLE.SQUARE,
          QR_DOT_STYLE.ROUNDED,
          QR_DOT_STYLE.DOTS,
          QR_DOT_STYLE.CLASSY,
          QR_DOT_STYLE.EXTRA_ROUNDED,
        ])
        .default(QR_DOT_STYLE.SQUARE),
      cornerStyle: z
        .enum([
          QR_CORNER_STYLE.SQUARE,
          QR_CORNER_STYLE.ROUNDED,
          QR_CORNER_STYLE.DOT,
        ])
        .default(QR_CORNER_STYLE.SQUARE),
      errorCorrectionLevel: z
        .enum([
          QR_ERROR_CORRECTION_LEVEL.LOW,
          QR_ERROR_CORRECTION_LEVEL.MEDIUM,
          QR_ERROR_CORRECTION_LEVEL.QUARTILE,
          QR_ERROR_CORRECTION_LEVEL.HIGH,
        ])
        .default(QR_ERROR_CORRECTION_LEVEL.QUARTILE),
      size: z.number().int().min(128).max(4096).default(1024),
    })
    .default(defaultQRDesignConfig),
});

const urlContentSchema = z.object({
  url: z.string().trim().min(1).max(2048),
});

const textContentSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

const emailContentSchema = z.object({
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(160).optional(),
  body: z.string().trim().max(1000).optional(),
});

const phoneContentSchema = z.object({
  phone: z.string().trim().min(3).max(40),
});

const smsContentSchema = z.object({
  phone: z.string().trim().min(3).max(40),
  message: z.string().trim().max(1000).optional(),
});

const wifiContentSchema = z.object({
  ssid: z.string().trim().min(1).max(64),
  password: z.string().max(128).optional(),
  encryption: z.enum(["WPA", "WEP", "nopass"]).default("WPA"),
  hidden: z.boolean().default(false),
});

const vCardContentSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  organization: z.string().trim().max(120).optional(),
  title: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(254).optional(),
  website: z.string().trim().max(2048).optional(),
  address: z.string().trim().max(240).optional(),
});

const createQRCodeRequestBaseSchema = z.discriminatedUnion("type", [
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.URL),
    content: urlContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.TEXT),
    content: textContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.EMAIL),
    content: emailContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.PHONE),
    content: phoneContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.SMS),
    content: smsContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.WIFI),
    content: wifiContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.VCARD),
    content: vCardContentSchema,
  }),
]);

export const createQRCodeRequestSchema = createQRCodeRequestBaseSchema.superRefine(
  (value, context) => {
    if (value.mode === QR_CODE_MODE.STATIC && value.slug) {
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Slugs are only used for dynamic QR codes.",
      });
    }

    if (value.mode !== QR_CODE_MODE.DYNAMIC) return;

    if (value.type !== QR_CODE_TYPE.URL) {
      context.addIssue({
        code: "custom",
        path: ["type"],
        message: "Dynamic QR redirects currently require a website URL.",
      });
    }

    if (!value.save) {
      context.addIssue({
        code: "custom",
        path: ["save"],
        message: "Dynamic QR codes must be saved to a workspace.",
      });
    }

  }
);

export const renderQRCodeRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  format: z.enum([
    QR_EXPORT_FORMAT.PNG,
    QR_EXPORT_FORMAT.JPG,
    QR_EXPORT_FORMAT.SVG,
    QR_EXPORT_FORMAT.PDF,
  ]),
});

export const updateQRCodeDestinationRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  destinationUrl: z.string().trim().min(1).max(2048),
});

export const qrDesignSchema = baseCreateQRCodeSchema.shape.design;

export type CreateQRCodeRequest = z.infer<typeof createQRCodeRequestSchema>;
export type QRDesignConfig = z.infer<typeof qrDesignSchema>;
export type RenderQRCodeRequest = z.infer<typeof renderQRCodeRequestSchema>;
export type UpdateQRCodeDestinationRequest = z.infer<
  typeof updateQRCodeDestinationRequestSchema
>;
