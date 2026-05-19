import "server-only";

import { prisma } from "@/server/db/prisma";
import { publicLandingPageSelect } from "@/server/landing-pages/selectors";
import { QR_CODE_MODE, QR_CODE_STATUS } from "@/server/qr/constants";
import type { ScanTelemetry } from "@/server/analytics/scan";

export interface DynamicQRCodeRedirectTargetInput {
  readonly slug: string;
}

export interface RecordDynamicQRCodeScanInput {
  readonly qrCodeId: string;
  readonly workspaceId: string;
  readonly telemetry: ScanTelemetry;
}

export function getDynamicQRCodeRedirectTarget({
  slug,
}: DynamicQRCodeRedirectTargetInput) {
  return prisma.qRCode.findFirst({
    where: {
      slug,
      mode: QR_CODE_MODE.DYNAMIC,
      status: QR_CODE_STATUS.PUBLISHED,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: {
      id: true,
      workspaceId: true,
      destinationUrl: true,
      landingPage: {
        select: publicLandingPageSelect,
      },
    },
  });
}

export async function recordDynamicQRCodeScan({
  qrCodeId,
  workspaceId,
  telemetry,
}: RecordDynamicQRCodeScanInput): Promise<void> {
  await prisma.$transaction([
    prisma.qRCode.update({
      where: { id: qrCodeId },
      data: { scanCount: { increment: 1 } },
      select: { id: true },
    }),
    prisma.scanEvent.create({
      data: {
        qrCodeId,
        workspaceId,
        deviceClass: telemetry.deviceClass,
        browser: telemetry.browser,
        operatingSystem: telemetry.operatingSystem,
        referrer: telemetry.referrer,
        country: telemetry.country,
        region: telemetry.region,
        ipHash: telemetry.ipHash,
        userAgentHash: telemetry.userAgentHash,
      },
      select: { id: true },
    }),
  ]);
}
