import type { ReactNode } from "react";
import { Activity, BarChart3, Clock, MousePointer2 } from "lucide-react";
import {
  EmptyState,
  Skeleton,
} from "@/components/ui";
import type {
  DashboardBreakdownRow,
  DashboardScanEvent,
  DashboardSummaryModel,
  DashboardTrendPoint,
} from "@/components/dashboard/dashboard-data";
import {
  formatDateTime,
  formatNumber,
} from "@/components/dashboard/dashboard-utils";

interface DashboardAnalyticsProps {
  readonly summary: DashboardSummaryModel;
  readonly isLoading?: boolean;
}

export function DashboardAnalytics({
  summary,
  isLoading = false,
}: DashboardAnalyticsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AnalyticsPanel title="Scans over time" isLoading={isLoading}>
        <ScanTrendChart points={summary.scanTrend} />
      </AnalyticsPanel>
      <AnalyticsPanel title="Device class" isLoading={isLoading}>
        <BreakdownList rows={summary.scansByDeviceClass} emptyLabel="No device data yet" />
      </AnalyticsPanel>
      <AnalyticsPanel title="Referrers" isLoading={isLoading}>
        <BreakdownList rows={summary.scansByReferrer} emptyLabel="No referrer data yet" />
      </AnalyticsPanel>
      <AnalyticsPanel title="Recent scans" isLoading={isLoading}>
        <RecentScansList scans={summary.recentScans} />
      </AnalyticsPanel>
    </div>
  );
}

function AnalyticsPanel({
  title,
  isLoading,
  children,
}: {
  readonly title: string;
  readonly isLoading: boolean;
  readonly children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          {getPanelIcon(title)}
        </span>
      </div>
      {isLoading ? <PanelSkeleton /> : children}
    </section>
  );
}

function ScanTrendChart({
  points,
}: {
  readonly points: readonly DashboardTrendPoint[];
}) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No scan trend yet"
        description="Scan events will appear after a published code is scanned."
        icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
      />
    );
  }

  const maxScans = Math.max(...points.map((point) => point.scans), 1);

  return (
    <div className="flex h-52 items-end gap-2" aria-label="Scans over time">
      {points.map((point) => (
        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end rounded-lg bg-slate-50 p-1">
            <div
              className="w-full rounded-md bg-sky-500"
              style={{ height: `${Math.max((point.scans / maxScans) * 100, 8)}%` }}
              title={`${point.label}: ${formatNumber(point.scans)} scans`}
            />
          </div>
          <span className="max-w-full truncate text-xs text-slate-600">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function BreakdownList({
  rows,
  emptyLabel,
}: {
  readonly rows: readonly DashboardBreakdownRow[];
  readonly emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyLabel}
        description="Analytics will populate after scans are recorded."
        icon={<Activity className="h-6 w-6" aria-hidden="true" />}
      />
    );
  }

  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{row.label}</span>
            <span className="shrink-0 text-slate-500">{formatNumber(row.count)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${Math.max((row.count / total) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentScansList({
  scans,
}: {
  readonly scans: readonly DashboardScanEvent[];
}) {
  if (scans.length === 0) {
    return (
      <EmptyState
        title="No recent scans"
        description="The latest scan events will be listed here."
        icon={<Clock className="h-6 w-6" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {scans.slice(0, 5).map((scan) => (
        <article
          key={scan.id}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
              {scan.qrTitle}
            </p>
            <p className="text-xs text-slate-500">{formatDateTime(scan.scannedAt)}</p>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {scan.deviceClass} from {scan.referrer || "Direct"} - {scan.location}
          </p>
        </article>
      ))}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

function getPanelIcon(title: string) {
  if (title.includes("time")) {
    return <BarChart3 className="h-4 w-4" aria-hidden="true" />;
  }

  if (title.includes("Device")) {
    return <Activity className="h-4 w-4" aria-hidden="true" />;
  }

  if (title.includes("Referrers")) {
    return <MousePointer2 className="h-4 w-4" aria-hidden="true" />;
  }

  return <Clock className="h-4 w-4" aria-hidden="true" />;
}
