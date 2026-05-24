import "server-only";

import type { Prisma } from "@prisma/client";
import { QR_CODE_MODE } from "@/server/qr/constants";
import { qrDesignSchema } from "@/server/qr/schemas";
import { getDynamicQRCodeRedirectUrl } from "@/server/qr/slugs";
import type {
  QRCodeDashboardRecord,
  QRCodeDetailRecord,
} from "@/server/qr/selectors";

export function toQRCodeListItem(record: QRCodeDashboardRecord) {
  return {
    ...record,
    redirectUrl: getQRCodeRedirectUrl(record),
  };
}

export function toQRCodeDetail(record: QRCodeDetailRecord) {
  return {
    ...toQRCodeListItem(record),
    payloadValue: getQRCodePayloadValue(record.payload),
    designConfig: getQRCodeDesignConfig(record.designConfig),
  };
}

function getQRCodeRedirectUrl(
  record: Pick<QRCodeDashboardRecord, "mode" | "slug">
): string | null {
  if (record.mode !== QR_CODE_MODE.DYNAMIC || !record.slug) return null;

  return getDynamicQRCodeRedirectUrl(record.slug);
}

function getQRCodePayloadValue(payload: Prisma.JsonValue): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, Prisma.JsonValue>).value;

  return typeof value === "string" && value.trim() ? value : null;
}

function getQRCodeDesignConfig(designConfig: Prisma.JsonValue) {
  const parsed = qrDesignSchema.safeParse(designConfig);

  return parsed.success ? parsed.data : null;
}
