export type DashboardQRMode = "static" | "dynamic";
export type DashboardQRStatus = "draft" | "published" | "archived";

export interface DashboardQRCode {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly mode: DashboardQRMode;
  readonly status: DashboardQRStatus;
  readonly slug: string | null;
  readonly destinationUrl: string | null;
  readonly redirectUrl: string | null;
  readonly payloadValue: string | null;
  readonly designConfig: DashboardQRDesignConfig | null;
  readonly scanCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
}

export interface DashboardQRDesignConfig {
  readonly foregroundColor: string;
  readonly backgroundColor: string;
  readonly frameColor: string;
  readonly margin: number;
  readonly logoSizeRatio: number;
  readonly dotStyle: string;
  readonly cornerStyle: string;
  readonly errorCorrectionLevel: "L" | "M" | "Q" | "H";
  readonly size: number;
  readonly frameStyle: string;
  readonly logo?: string;
}

export interface DashboardScanEvent {
  readonly id: string;
  readonly qrCodeId: string;
  readonly qrTitle: string;
  readonly scannedAt: string;
  readonly deviceClass: string;
  readonly referrer: string;
  readonly location: string;
}

export interface DashboardBreakdownRow {
  readonly label: string;
  readonly count: number;
}

export interface DashboardTrendPoint {
  readonly label: string;
  readonly scans: number;
}

export interface DashboardSummaryModel {
  readonly totalQRCodes: number;
  readonly dynamicQRCodes: number;
  readonly totalScans: number;
  readonly recentActivityLabel: string;
  readonly scanTrend: readonly DashboardTrendPoint[];
  readonly scansByDeviceClass: readonly DashboardBreakdownRow[];
  readonly scansByReferrer: readonly DashboardBreakdownRow[];
  readonly recentScans: readonly DashboardScanEvent[];
}

export const emptyDashboardSummary: DashboardSummaryModel = {
  totalQRCodes: 0,
  dynamicQRCodes: 0,
  totalScans: 0,
  recentActivityLabel: "None",
  scanTrend: [],
  scansByDeviceClass: [],
  scansByReferrer: [],
  recentScans: [],
};

export const demoQRCodes: readonly DashboardQRCode[] = [
  {
    id: "dyn-menu",
    title: "Cafe Menu Redirect",
    type: "url",
    mode: "dynamic",
    status: "published",
    slug: "cafe-menu",
    destinationUrl: "https://decode.example/cafe/menu",
    redirectUrl: "https://decode.example/r/cafe-menu",
    payloadValue: "https://decode.example/r/cafe-menu",
    designConfig: null,
    scanCount: 1248,
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-19T08:20:00.000Z",
    publishedAt: "2026-05-01T10:08:00.000Z",
    archivedAt: null,
  },
  {
    id: "static-wifi",
    title: "Guest Wi-Fi Lobby",
    type: "wifi",
    mode: "static",
    status: "published",
    slug: null,
    destinationUrl: null,
    redirectUrl: null,
    payloadValue: "WIFI:T:WPA;S:Guest;P:decode;;",
    designConfig: null,
    scanCount: 386,
    createdAt: "2026-05-02T15:30:00.000Z",
    updatedAt: "2026-05-10T11:12:00.000Z",
    publishedAt: "2026-05-02T15:34:00.000Z",
    archivedAt: null,
  },
  {
    id: "dyn-launch",
    title: "Launch Waitlist",
    type: "url",
    mode: "dynamic",
    status: "published",
    slug: "launch",
    destinationUrl: "https://decode.example/waitlist",
    redirectUrl: "https://decode.example/r/launch",
    payloadValue: "https://decode.example/r/launch",
    designConfig: null,
    scanCount: 812,
    createdAt: "2026-05-08T09:00:00.000Z",
    updatedAt: "2026-05-18T19:05:00.000Z",
    publishedAt: "2026-05-08T09:20:00.000Z",
    archivedAt: null,
  },
  {
    id: "static-vcard",
    title: "Founder Contact Card",
    type: "vcard",
    mode: "static",
    status: "published",
    slug: null,
    destinationUrl: null,
    redirectUrl: null,
    payloadValue: null,
    designConfig: null,
    scanCount: 143,
    createdAt: "2026-05-03T13:10:00.000Z",
    updatedAt: "2026-05-05T16:45:00.000Z",
    publishedAt: "2026-05-03T13:20:00.000Z",
    archivedAt: null,
  },
];

export const demoSummary: DashboardSummaryModel = {
  totalQRCodes: demoQRCodes.length,
  dynamicQRCodes: demoQRCodes.filter((qrCode) => qrCode.mode === "dynamic")
    .length,
  totalScans: demoQRCodes.reduce((total, qrCode) => total + qrCode.scanCount, 0),
  recentActivityLabel: "38 scans today",
  scanTrend: [
    { label: "May 13", scans: 184 },
    { label: "May 14", scans: 221 },
    { label: "May 15", scans: 196 },
    { label: "May 16", scans: 278 },
    { label: "May 17", scans: 242 },
    { label: "May 18", scans: 319 },
    { label: "May 19", scans: 356 },
  ],
  scansByDeviceClass: [
    { label: "Mobile", count: 2147 },
    { label: "Desktop", count: 312 },
    { label: "Tablet", count: 130 },
  ],
  scansByReferrer: [
    { label: "Direct", count: 1086 },
    { label: "Instagram", count: 742 },
    { label: "Google", count: 431 },
    { label: "Partner site", count: 330 },
  ],
  recentScans: [
    {
      id: "scan-001",
      qrCodeId: "dyn-menu",
      qrTitle: "Cafe Menu Redirect",
      scannedAt: "2026-05-19T09:41:00.000Z",
      deviceClass: "Mobile",
      referrer: "Direct",
      location: "Lagos, NG",
    },
    {
      id: "scan-002",
      qrCodeId: "dyn-launch",
      qrTitle: "Launch Waitlist",
      scannedAt: "2026-05-19T09:32:00.000Z",
      deviceClass: "Mobile",
      referrer: "Instagram",
      location: "Austin, US",
    },
    {
      id: "scan-003",
      qrCodeId: "static-wifi",
      qrTitle: "Guest Wi-Fi Lobby",
      scannedAt: "2026-05-19T08:58:00.000Z",
      deviceClass: "Tablet",
      referrer: "Direct",
      location: "London, GB",
    },
  ],
};
