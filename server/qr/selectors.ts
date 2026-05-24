import type { Prisma } from "@prisma/client";

export const qrCodeDashboardSelect = {
  id: true,
  workspaceId: true,
  ownerId: true,
  title: true,
  type: true,
  mode: true,
  status: true,
  slug: true,
  destinationUrl: true,
  scanCount: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  landingPage: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
} satisfies Prisma.QRCodeSelect;

export const qrCodeDetailSelect = {
  ...qrCodeDashboardSelect,
  payload: true,
  designConfig: true,
} satisfies Prisma.QRCodeSelect;

export const qrCodeOwnershipSelect = {
  id: true,
  workspaceId: true,
  ownerId: true,
  mode: true,
  status: true,
  deletedAt: true,
} satisfies Prisma.QRCodeSelect;

export type QRCodeDashboardRecord = Prisma.QRCodeGetPayload<{
  select: typeof qrCodeDashboardSelect;
}>;

export type QRCodeDetailRecord = Prisma.QRCodeGetPayload<{
  select: typeof qrCodeDetailSelect;
}>;

export const qrCodeRenderSelect = {
  id: true,
  workspaceId: true,
  ownerId: true,
  title: true,
  type: true,
  mode: true,
  status: true,
  payload: true,
  designConfig: true,
  deletedAt: true,
} satisfies Prisma.QRCodeSelect;
