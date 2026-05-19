import "server-only";

import { prisma } from "@/server/db/prisma";
import {
  landingPageSummarySelect,
  publicLandingPageSelect,
} from "@/server/landing-pages/selectors";

export interface WorkspaceLandingPageInput {
  readonly workspaceId: string;
  readonly landingPageId: string;
}

export interface QRCodeLandingPageInput {
  readonly workspaceId: string;
  readonly qrCodeId: string;
}

export function getWorkspaceLandingPage({
  workspaceId,
  landingPageId,
}: WorkspaceLandingPageInput) {
  return prisma.landingPage.findFirst({
    where: {
      id: landingPageId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: landingPageSummarySelect,
  });
}

export function getWorkspaceLandingPageForQRCode({
  workspaceId,
  qrCodeId,
}: QRCodeLandingPageInput) {
  return prisma.landingPage.findFirst({
    where: {
      qrCodeId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: landingPageSummarySelect,
  });
}

export function getPublicLandingPageById(landingPageId: string) {
  return prisma.landingPage.findFirst({
    where: {
      id: landingPageId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: publicLandingPageSelect,
  });
}
