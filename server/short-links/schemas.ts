import { z } from "zod";

export const createShortLinkRequestSchema = z.object({
  url: z.string().trim().min(1).max(4096),
  workspaceId: z.string().min(1).max(128).optional(),
  acknowledgedSuspicious: z.boolean().optional(),
  /** ISO-8601 timestamp; rejected if it is in the past at submission. */
  expiresAt: z.string().datetime().optional(),
});

export type CreateShortLinkRequest = z.infer<typeof createShortLinkRequestSchema>;

export const updateShortLinkRequestSchema = z
  .object({
    destinationUrl: z.string().trim().min(1).max(4096).optional(),
    /** Owners may pause or resume a link; `flagged` is verifier-owned. */
    status: z.enum(["active", "disabled"]).optional(),
    acknowledgedSuspicious: z.boolean().optional(),
    /** ISO-8601 timestamp to set, or null to clear the expiry. */
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (value) =>
      value.destinationUrl !== undefined ||
      value.status !== undefined ||
      value.expiresAt !== undefined,
    { message: "Provide at least one field to update." }
  );

export type UpdateShortLinkRequest = z.infer<typeof updateShortLinkRequestSchema>;
