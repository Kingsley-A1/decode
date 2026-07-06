import { z } from "zod";
import {
  DYNAMIC_ONLY_QR_CODE_TYPES,
  DYNAMIC_QR_CODE_TYPES,
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

// No errorCorrectionLevel here: an omitted level is resolved adaptively by
// the service (see `resolveQRDesignErrorCorrection`).
export const defaultQRDesignConfig = {
  foregroundColor: "#0F172A",
  backgroundColor: "#FFFFFF",
  frameColor: "#2563EB",
  margin: 4,
  logoSizeRatio: 0,
  dotStyle: QR_DOT_STYLE.SQUARE,
  cornerStyle: QR_CORNER_STYLE.SQUARE,
  size: 1024,
  frameStyle: "none",
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
      frameColor: hexColorSchema.default("#2563EB"),
      margin: z.number().int().min(0).max(16).default(4),
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
      // Optional at the boundary: when omitted, the service resolves it
      // adaptively (H for dynamic codes, logos, and short payloads; Q for
      // long static payloads) and stores the concrete result.
      errorCorrectionLevel: z
        .enum([
          QR_ERROR_CORRECTION_LEVEL.LOW,
          QR_ERROR_CORRECTION_LEVEL.MEDIUM,
          QR_ERROR_CORRECTION_LEVEL.QUARTILE,
          QR_ERROR_CORRECTION_LEVEL.HIGH,
        ])
        .optional(),
      size: z.number().int().min(128).max(4096).default(1024),
      frameStyle: z
        .enum(["none", "scan-me", "classic", "ticket", "badge", "minimal"])
        .default("none"),
      // Optional centered logo as a data URL. Bounded in size at the schema
      // boundary; the service downscales it before persisting so rows stay
      // small and the export/preview stay consistent.
      logo: z.string().max(4_000_000).optional(),
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

const whatsappContentSchema = z.object({
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

const fileContentSchema = z.object({
  /** A ready `qr.file` asset in the caller's workspace. */
  assetId: z.string().trim().min(1).max(128),
  fileName: z.string().trim().min(1).max(200),
});

const landingPageContentSchema = z.object({});

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
    type: z.literal(QR_CODE_TYPE.WHATSAPP),
    content: whatsappContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.WIFI),
    content: wifiContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.VCARD),
    content: vCardContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.FILE),
    content: fileContentSchema,
  }),
  baseCreateQRCodeSchema.extend({
    type: z.literal(QR_CODE_TYPE.LANDING_PAGE),
    content: landingPageContentSchema,
  }),
]);

const DYNAMIC_TYPE_SET = new Set<string>(DYNAMIC_QR_CODE_TYPES);
const DYNAMIC_ONLY_TYPE_SET = new Set<string>(DYNAMIC_ONLY_QR_CODE_TYPES);

export const createQRCodeRequestSchema = createQRCodeRequestBaseSchema.superRefine(
  (value, context) => {
    if (value.mode === QR_CODE_MODE.STATIC && value.slug) {
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Slugs are only used for dynamic QR codes.",
      });
    }

    if (value.mode !== QR_CODE_MODE.DYNAMIC) {
      if (DYNAMIC_ONLY_TYPE_SET.has(value.type)) {
        context.addIssue({
          code: "custom",
          path: ["type"],
          message:
            "File and landing-page QR codes are dynamic-only: their content lives behind a Decode redirect.",
        });
      }

      return;
    }

    if (!DYNAMIC_TYPE_SET.has(value.type)) {
      context.addIssue({
        code: "custom",
        path: ["type"],
        message:
          "Dynamic QR codes support URL, text, contact card, file, and landing-page content.",
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

// Stateless render of an unsaved QR code. Used so static/anonymous downloads go
// through the same styled SVG renderer as saved/dynamic codes — keeping the
// frame, frame color, and the rest of the design consistent across every path.
export const renderUnsavedQRCodeRequestSchema = z.object({
  value: z.string().trim().min(1).max(4096),
  title: z.string().trim().min(1).max(120).optional(),
  format: z.enum([
    QR_EXPORT_FORMAT.PNG,
    QR_EXPORT_FORMAT.JPG,
    QR_EXPORT_FORMAT.SVG,
    QR_EXPORT_FORMAT.PDF,
  ]),
  design: baseCreateQRCodeSchema.shape.design,
});

export const updateQRCodeDestinationRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  destinationUrl: z.string().trim().min(1).max(2048),
});

export const updateQRCodeRequestSchema = z
  .object({
    workspaceId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    destinationUrl: z.string().trim().min(1).max(2048).optional(),
    // Editable hosted content for text/contact dynamic codes. Its shape is
    // validated against the stored QR type inside the service transaction (see
    // `parseEditableDynamicContent`), because the type is only known then.
    content: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.destinationUrl !== undefined ||
      value.content !== undefined,
    { message: "Provide a title, destination, or content to update." }
  );

/**
 * Dynamic types whose hosted content can be edited in place after publishing.
 * URL edits go through `destinationUrl`; file and landing-page content is
 * managed through their own flows (asset re-upload, landing-page builder).
 */
export const EDITABLE_DYNAMIC_QR_CODE_TYPES = [
  QR_CODE_TYPE.TEXT,
  QR_CODE_TYPE.VCARD,
] as const;

export type EditableDynamicContentResult =
  | {
      readonly type: typeof QR_CODE_TYPE.TEXT;
      readonly content: z.infer<typeof textContentSchema>;
    }
  | {
      readonly type: typeof QR_CODE_TYPE.VCARD;
      readonly content: z.infer<typeof vCardContentSchema>;
    };

/**
 * Validates raw edit content against the stored QR type. Returns a
 * type-discriminated result the payload builder can consume without casts, or
 * `null` when the type has no in-place content editor. Throws `ZodError` on
 * invalid content so the route surfaces a structured 400.
 */
export function parseEditableDynamicContent(
  type: string,
  content: unknown
): EditableDynamicContentResult | null {
  switch (type) {
    case QR_CODE_TYPE.TEXT:
      return { type: QR_CODE_TYPE.TEXT, content: textContentSchema.parse(content) };
    case QR_CODE_TYPE.VCARD:
      return {
        type: QR_CODE_TYPE.VCARD,
        content: vCardContentSchema.parse(content),
      };
    default:
      return null;
  }
}

export const archiveQRCodeRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
});

export const qrDesignSchema = baseCreateQRCodeSchema.shape.design;

export type CreateQRCodeRequest = z.infer<typeof createQRCodeRequestSchema>;
/** Design as accepted at the API boundary — error correction may be omitted. */
export type QRDesignInput = z.infer<typeof qrDesignSchema>;
/**
 * Design with the error-correction level resolved to a concrete value. The
 * renderers require this shape; `resolveQRDesignErrorCorrection` produces it.
 */
export type QRDesignConfig = QRDesignInput & {
  readonly errorCorrectionLevel: NonNullable<
    QRDesignInput["errorCorrectionLevel"]
  >;
};
export type RenderQRCodeRequest = z.infer<typeof renderQRCodeRequestSchema>;
export type RenderUnsavedQRCodeRequest = z.infer<
  typeof renderUnsavedQRCodeRequestSchema
>;
export type UpdateQRCodeDestinationRequest = z.infer<
  typeof updateQRCodeDestinationRequestSchema
>;
export type UpdateQRCodeRequest = z.infer<typeof updateQRCodeRequestSchema>;
export type ArchiveQRCodeRequest = z.infer<typeof archiveQRCodeRequestSchema>;
