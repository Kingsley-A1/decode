import { z } from "zod";

export const createShortLinkRequestSchema = z.object({
  url: z.string().trim().min(1).max(4096),
  workspaceId: z.string().min(1).max(128).optional(),
  acknowledgedSuspicious: z.boolean().optional(),
  /** ISO-8601 timestamp; rejected if it is in the past at submission. */
  expiresAt: z.string().datetime().optional(),
});

export type CreateShortLinkRequest = z.infer<typeof createShortLinkRequestSchema>;
