import { z } from "zod";

export const verifyLinkRequestSchema = z.object({
  url: z.string().trim().min(1).max(4096),
});

export type VerifyLinkRequest = z.infer<typeof verifyLinkRequestSchema>;
