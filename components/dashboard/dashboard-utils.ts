import type {
  DashboardBreakdownRow,
  DashboardQRDesignConfig,
  DashboardQRCode,
  DashboardQRMode,
  DashboardQRStatus,
  DashboardScanEvent,
  DashboardSummaryModel,
  DashboardTrendPoint,
} from "@/components/dashboard/dashboard-data";
import { emptyDashboardSummary } from "@/components/dashboard/dashboard-data";

type UnknownRecord = Record<string, unknown>;

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "Not published";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    url: "URL",
    text: "Text",
    email: "Email",
    phone: "Phone",
    sms: "SMS",
    whatsapp: "WhatsApp",
    wifi: "Wi-Fi",
    vcard: "vCard",
    file: "File",
    landing_page: "Landing page",
  };

  return labels[value] ?? value;
}

export function getModeLabel(mode: DashboardQRMode): string {
  return mode === "dynamic" ? "Dynamic" : "Static";
}

export function getStatusLabel(status: DashboardQRStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getQRCodeHref(qrCode: Pick<DashboardQRCode, "id">): string {
  return `/dashboard/qr/${qrCode.id}`;
}

export function getQRCodeEditHref(qrCode: Pick<DashboardQRCode, "id">): string {
  return `/dashboard/qr/${qrCode.id}/edit`;
}

export function getQRCodeDestinationLabel(qrCode: DashboardQRCode): string {
  if (qrCode.mode === "dynamic") {
    if (qrCode.destinationUrl) return qrCode.destinationUrl;

    // Hosted dynamic types have no external destination — Decode serves the
    // content behind the redirect.
    const hostedLabels: Record<string, string> = {
      text: "Decode-hosted text",
      vcard: "Decode-hosted contact card",
      file: "Decode-hosted file download",
      landing_page: "Decode-hosted landing page",
    };

    return hostedLabels[qrCode.type] ?? "No destination set";
  }

  return qrCode.payloadValue ?? `${getTypeLabel(qrCode.type)} content is encoded in the QR image`;
}

export function buildSummaryFromRows(
  rows: readonly DashboardQRCode[]
): DashboardSummaryModel {
  const totalScans = rows.reduce((total, row) => total + row.scanCount, 0);

  return {
    ...emptyDashboardSummary,
    totalQRCodes: rows.length,
    dynamicQRCodes: rows.filter((row) => row.mode === "dynamic").length,
    totalScans,
    recentActivityLabel:
      totalScans > 0 ? `${formatNumber(Math.min(totalScans, 99))} recent scans` : "None",
  };
}

export function normalizeQRCode(value: unknown): DashboardQRCode | null {
  if (!isRecord(value)) return null;

  const mode = value.mode === "dynamic" ? "dynamic" : "static";
  const status = normalizeStatus(value.status);
  const id = readString(value.id);
  if (!id) return null;

  return {
    id,
    title: readString(value.title) || "Untitled QR code",
    type: readString(value.type) || "url",
    mode,
    status,
    slug: readNullableString(value.slug),
    destinationUrl: readNullableString(value.destinationUrl),
    redirectUrl: readNullableString(value.redirectUrl),
    payloadValue: readNullableString(value.payloadValue),
    content: isRecord(value.content) ? value.content : null,
    designConfig: readDesignConfig(value.designConfig),
    scanCount: readNumber(value.scanCount),
    createdAt: readDateString(value.createdAt),
    updatedAt: readDateString(value.updatedAt),
    publishedAt: readNullableDateString(value.publishedAt),
    archivedAt: readNullableDateString(value.archivedAt),
  };
}

function readDesignConfig(value: unknown): DashboardQRDesignConfig | null {
  if (!isRecord(value)) return null;

  const rawErrorCorrectionLevel = readString(value.errorCorrectionLevel);
  // Default an unknown level instead of dropping the whole design — losing the
  // colors, dot style, and frame over one stray field degrades the preview.
  const errorCorrectionLevel =
    rawErrorCorrectionLevel === "L" ||
    rawErrorCorrectionLevel === "M" ||
    rawErrorCorrectionLevel === "Q" ||
    rawErrorCorrectionLevel === "H"
      ? rawErrorCorrectionLevel
      : "Q";

  return {
    foregroundColor: readString(value.foregroundColor) || "#0F172A",
    backgroundColor: readString(value.backgroundColor) || "#FFFFFF",
    frameColor: readString(value.frameColor) || "#2563EB",
    margin: readNumber(value.margin),
    logoSizeRatio: readNumber(value.logoSizeRatio),
    dotStyle: readString(value.dotStyle) || "square",
    cornerStyle: readString(value.cornerStyle) || "square",
    errorCorrectionLevel,
    size: readNumber(value.size) || 1024,
    frameStyle: readString(value.frameStyle) || "none",
    logo: readString(value.logo) || undefined,
  };
}

export function normalizeSummary(value: unknown): DashboardSummaryModel | null {
  if (!isRecord(value)) return null;

  return {
    totalQRCodes: readNumber(value.totalQRCodes),
    dynamicQRCodes: readNumber(value.dynamicQRCodes),
    totalScans: readNumber(value.totalScans),
    recentActivityLabel:
      readNumber(value.totalScans) > 0
        ? `${formatNumber(readNumber(value.totalScans))} total scans`
        : "None",
    scanTrend: readTrendPoints(value.scanTrend),
    scansByDeviceClass: readBreakdownRows(value.scansByDeviceClass, "deviceClass"),
    scansByReferrer: readBreakdownRows(value.scansByReferrer, "referrer"),
    recentScans: readRecentScans(value.recentScans),
  };
}

function readTrendPoints(value: unknown): readonly DashboardTrendPoint[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      return {
        label: readString(item.label) || readString(item.date) || "Period",
        scans: readNumber(item.scans) || readNumber(item.count),
      };
    })
    .filter((item): item is DashboardTrendPoint => Boolean(item));
}

export function getApiErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value) || !isRecord(value.error)) return fallback;

  return readString(value.error.message) || fallback;
}

function readBreakdownRows(
  value: unknown,
  labelKey: "deviceClass" | "referrer"
): readonly DashboardBreakdownRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      return {
        label: readString(item[labelKey]) || "Direct",
        count: readNumber(item.count),
      };
    })
    .filter((item): item is DashboardBreakdownRow => Boolean(item));
}

function readRecentScans(value: unknown): readonly DashboardScanEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const qrCode = isRecord(item.qrCode) ? item.qrCode : {};

      return {
        id: readString(item.id) || `scan-${readDateString(item.scannedAt)}`,
        qrCodeId: readString(item.qrCodeId),
        qrTitle: readString(qrCode.title) || "QR code",
        scannedAt: readDateString(item.scannedAt),
        deviceClass: readString(item.deviceClass) || "Unknown",
        referrer: readString(item.referrer) || "Direct",
        location: [readString(item.region), readString(item.country)]
          .filter(Boolean)
          .join(", ") || "Unknown",
      };
    })
    .filter((item): item is DashboardScanEvent => Boolean(item));
}

function normalizeStatus(value: unknown): DashboardQRStatus {
  if (value === "archived") return "archived";
  if (value === "draft") return "draft";

  return "published";
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown): string | null {
  const stringValue = readString(value);

  return stringValue || null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readDateString(value: unknown): string {
  const stringValue = readString(value);

  return stringValue || new Date().toISOString();
}

function readNullableDateString(value: unknown): string | null {
  const stringValue = readString(value);

  return stringValue || null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
