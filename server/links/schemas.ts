import { z } from "zod";

export const verifyLinkRequestSchema = z.object({
  url: z.string().trim().min(1).max(4096),
  // When true, return the instant heuristic-only verdict and skip the
  // network probe. The UI uses this for an optimistic first paint before
  // requesting the full probe-backed verdict.
  skipProbe: z.boolean().optional(),
});

export type VerifyLinkRequest = z.infer<typeof verifyLinkRequestSchema>;
