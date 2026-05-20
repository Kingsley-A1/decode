import { z } from "zod";
import { ADMIN_STATUS } from "@/server/admin/constants";

const adminEmailSchema = z.string().trim().email().max(254).toLowerCase();
const adminPasswordSchema = z.string().min(12).max(128);
const adminRegistrationCodeSchema = z.string().trim().regex(/^\d{6,10}$/, {
  message: "Registration code must be 6 to 10 digits.",
});

export const adminRegisterRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: adminEmailSchema,
    password: adminPasswordSchema,
    confirmPassword: adminPasswordSchema,
    registrationCode: adminRegistrationCodeSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

export const adminLoginRequestSchema = z.object({
  email: adminEmailSchema,
  password: z.string().min(1).max(128),
});

export const adminListQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  take: z.coerce.number().int().min(1).max(100).default(25),
});

export const adminAuditQuerySchema = z.object({
  source: z
    .enum(["all", "platform", "workspace", "auth"])
    .default("all"),
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(80).optional(),
  requestId: z.string().trim().max(160).optional(),
  cursorCreatedAt: z.string().trim().datetime().optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
});

export const adminReviewModerationRequestSchema = z.object({
  status: z.enum(["published", "hidden", "flagged"]),
  reason: z.string().trim().min(3).max(500),
});

export const adminQRCodeVisibilityRequestSchema = z.object({
  status: z.enum(["published", "archived"]),
  reason: z.string().trim().min(3).max(500),
});

export const adminUserStatusRequestSchema = z.object({
  status: z.enum([ADMIN_STATUS.ACTIVE, ADMIN_STATUS.DISABLED]),
  reason: z.string().trim().min(3).max(500),
});

export const workspaceReviewRequestSchema = z.object({
  status: z.enum(["reviewed", "watch", "clear"]),
  note: z.string().trim().min(3).max(500),
});

export type AdminRegisterRequest = z.infer<
  typeof adminRegisterRequestSchema
>;
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
export type AdminReviewModerationRequest = z.infer<
  typeof adminReviewModerationRequestSchema
>;
export type AdminQRCodeVisibilityRequest = z.infer<
  typeof adminQRCodeVisibilityRequestSchema
>;
export type AdminUserStatusRequest = z.infer<
  typeof adminUserStatusRequestSchema
>;
export type WorkspaceReviewRequest = z.infer<
  typeof workspaceReviewRequestSchema
>;
