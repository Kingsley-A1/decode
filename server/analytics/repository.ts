import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { publicLandingPageSelect } from "@/server/landing-pages/selectors";
import { QR_CODE_MODE, QR_CODE_STATUS } from "@/server/qr/constants";
import { SCAN_BOT_DEVICE_CLASS } from "@/server/analytics/constants";
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
      type: true,
      title: true,
      payload: true,
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
  // The event is always recorded (deviceClass preserves "bot" for
  // transparency), but bots such as link-preview crawlers must never inflate
  // the human-facing scan count. Analytics queries exclude bots to match.
  const isBot = telemetry.deviceClass === SCAN_BOT_DEVICE_CLASS;
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  if (!isBot) {
    operations.push(
      prisma.qRCode.update({
        where: { id: qrCodeId },
        data: { scanCount: { increment: 1 } },
        select: { id: true },
      })
    );
  }

  operations.push(
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
    })
  );

  await prisma.$transaction(operations);
}
