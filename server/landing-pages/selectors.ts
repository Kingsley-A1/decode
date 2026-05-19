import type { Prisma } from "@prisma/client";

export const landingPageSummarySelect = {
  id: true,
  workspaceId: true,
  qrCodeId: true,
  type: true,
  title: true,
  status: true,
  content: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LandingPageSelect;

export const publicLandingPageSelect = {
  id: true,
  workspaceId: true,
  qrCodeId: true,
  type: true,
  title: true,
  status: true,
  content: true,
  publishedAt: true,
  deletedAt: true,
} satisfies Prisma.LandingPageSelect;
