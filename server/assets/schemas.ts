import { z } from "zod";
import { ASSET_PURPOSE } from "@/server/assets/constants";

export const createPresignedUploadRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  qrCodeId: z.string().trim().min(1).optional(),
  landingPageId: z.string().trim().min(1).optional(),
  purpose: z.enum([ASSET_PURPOSE.QR_LOGO, ASSET_PURPOSE.LANDING_PAGE_MEDIA]),
  contentType: z.string().trim().min(1).max(120),
  fileSizeBytes: z.number().int().positive(),
  checksum: z.string().trim().max(128).optional(),
});

export const confirmAssetUploadRequestSchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  checksum: z.string().trim().max(128).optional(),
});

export type CreatePresignedUploadRequest = z.infer<
  typeof createPresignedUploadRequestSchema
>;
export type ConfirmAssetUploadRequest = z.infer<
  typeof confirmAssetUploadRequestSchema
>;
