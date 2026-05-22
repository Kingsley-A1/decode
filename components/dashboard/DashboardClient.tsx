"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Activity,
  Archive,
  ArrowRight,
  BarChart3,
  FileCode2,
  FileText,
  Link2,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { DashboardQRCodeTable } from "@/components/dashboard/DashboardQRCodeTable";
import {
  emptyDashboardSummary,
  type DashboardQRCode,
  type DashboardSummaryModel,
} from "@/components/dashboard/dashboard-data";
import {
  buildSummaryFromRows,
  formatNumber,
  getApiErrorMessage,
  normalizeQRCode,
  normalizeSummary,
} from "@/components/dashboard/dashboard-utils";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Skeleton,
} from "@/components/ui";

interface ApiResponse<TData> {
  readonly ok: boolean;
  readonly data?: TData;
  readonly error?: { readonly message: string };
}

interface QRListResponse {
  readonly qrCodes: readonly unknown[];
}

interface DashboardSummaryResponse {
  readonly summary: unknown;
  readonly recentScansPage?: readonly unknown[];
}

interface DashboardKpi {
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly description: string;
}

const platformActions = [
  {
    title: "Generate QR",
    description: "Create static or dynamic QR codes with guarded design controls.",
    href: "/generate",
    icon: QrCode,
  },
  {
    title: "Build pages",
    description: "Create editable mobile landing pages for dynamic QR campaigns.",
    href: "/landing-pages",
    icon: FileText,
  },
  {
    title: "Scan QR",
    description: "Use camera or image upload scanning without auto-opening links.",
    href: "/scan",
    icon: ScanLine,
  },
  {
    title: "Links",
    description: "Link safety system coming soon.",
    href: "/links",
    icon: Link2,
  },
  {
    title: "Decode text",
    description: "Run Base64, URL, Morse, binary, hex, and cipher transforms.",
    href: "/decode",
    icon: FileCode2,
  },
  {
    title: "Open demo",
    description: "View a prefilled workspace with saved codes and analytics.",
    href: "/demo",
    icon: BarChart3,
  },
] as const;

export function DashboardClient() {
  const [rows, setRows] = useState<readonly DashboardQRCode[]>([]);
  const [summary, setSummary] = useState<DashboardSummaryModel>(
    emptyDashboardSummary
  );
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState<DashboardQRCode | null>(
    null
  );

  const loadDashboard = async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);

    setIsLoading(true);
    setNotice(null);

    try {
      const [summaryResult, listResult] = await Promise.all([
        fetchJson<ApiResponse<DashboardSummaryResponse>>(
          "/api/dashboard/summary",
          controller.signal
        ),
        fetchJson<ApiResponse<QRListResponse>>(
          "/api/qr-codes?take=25",
          controller.signal
        ),
      ]);

      if (!summaryResult.ok) {
        throw new Error(
          summaryResult.error?.message ?? "Could not load dashboard analytics."
        );
      }

      if (!listResult.ok) {
        throw new Error(
          listResult.error?.message ?? "Could not load saved QR codes."
        );
      }

      const nextRows = (listResult.data?.qrCodes ?? [])
        .map(normalizeQRCode)
        .filter((row): row is DashboardQRCode => Boolean(row));
      const summaryPayload = {
        ...(isRecord(summaryResult.data?.summary)
          ? summaryResult.data?.summary
          : {}),
        recentScans:
          summaryResult.data?.recentScansPage ??
          (isRecord(summaryResult.data?.summary)
            ? summaryResult.data?.summary.recentScans
            : []),
      };
      const nextSummary =
        normalizeSummary(summaryPayload) ?? buildSummaryFromRows(nextRows);

      setRows(nextRows);
      setSummary(nextSummary);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load dashboard data.";

      setRows([]);
      setSummary(emptyDashboardSummary);
      setNotice(isExpectedEmptyAccessMessage(message) ? null : message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const visibleRows = useMemo(
    () => rows.filter((row) => row.status !== "archived"),
    [rows]
  );
  const kpis = getDashboardKpis(summary);
  const hasWorkspaceData =
    visibleRows.length > 0 ||
    summary.totalScans > 0 ||
    summary.dynamicQRCodes > 0;

  const confirmArchive = () => {
    if (!pendingArchive) return;

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === pendingArchive.id
          ? { ...row, status: "archived", archivedAt: new Date().toISOString() }
          : row
      )
    );
    setPendingArchive(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Workspace command center
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Your real dashboard stays empty until saved QR codes, dynamic pages,
            and scan events exist in the workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={loadDashboard}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
          <Link
            href="/generate"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-700 bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:border-sky-800 hover:bg-sky-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create QR
          </Link>
        </div>
      </div>

      {notice && (
        <Alert variant="warning" title="Dashboard notice">
          {notice}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 sm:h-32" />
            ))
          : kpis.map((item) => <DashboardKpiLink key={item.label} item={item} />)}
      </div>

      {isLoading ? (
        <Skeleton className="h-80" />
      ) : hasWorkspaceData ? (
        <>
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Saved QR codes
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Static codes are fixed artifacts. Dynamic codes route through
                  a slug and can be edited after publishing.
                </p>
              </div>
              <Badge variant="info">
                {formatNumber(visibleRows.length)} active
              </Badge>
            </div>

            <DashboardQRCodeTable
              rows={visibleRows}
              onArchive={setPendingArchive}
              emptyState={
                <EmptyState
                  title="No saved QR codes yet"
                  description="Create a static QR for immediate export, or publish a dynamic QR to manage destinations here."
                  icon={<QrCode className="h-6 w-6" aria-hidden="true" />}
                  action={<PrimaryLink href="/generate">Create first QR</PrimaryLink>}
                />
              }
            />
          </section>

          <DashboardAnalytics summary={summary} />
        </>
      ) : (
        <DashboardEmptyState />
      )}

      <Dialog
        open={Boolean(pendingArchive)}
        title="Archive QR code?"
        description="Archived codes are removed from the active dashboard list."
        onClose={() => setPendingArchive(null)}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            {pendingArchive
              ? `Archive "${pendingArchive.title}"? Dynamic redirects should only be archived after you are sure the printed code is no longer in use.`
              : "Archive this QR code?"}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setPendingArchive(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmArchive}
              leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
            >
              Archive QR
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <div className="space-y-5">
      <EmptyState
        title="No workspace activity yet"
        description="Start with a QR code, landing page, scan, verification, or decoder workflow. Demo content now lives separately so the production dashboard stays honest."
        icon={<QrCode className="h-6 w-6" aria-hidden="true" />}
        className="bg-sky-50/40"
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <PrimaryLink href="/generate">Create QR</PrimaryLink>
            <SecondaryLink href="/demo">Open demo workspace</SecondaryLink>
          </div>
        }
      />

      <section aria-labelledby="dashboard-actions-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="dashboard-actions-title"
            className="text-lg font-semibold text-slate-950"
          >
            Continue with a platform workflow
          </h2>
          <Badge variant="info">Quick start</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {platformActions.map((item) => (
            <FeatureActionCard key={item.href} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardKpiLink({ item }: { readonly item: DashboardKpi }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 sm:p-4"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-xs font-medium leading-5 text-slate-600 sm:text-sm">
          {item.label}
        </span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
      </span>
      <span className="mt-3 block break-words text-xl font-semibold text-slate-950 sm:mt-4 sm:text-2xl">
        {item.value}
      </span>
      <span className="mt-2 flex items-center gap-1 text-xs font-medium text-sky-700 sm:text-sm">
        {item.description}
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function FeatureActionCard({
  item,
}: {
  readonly item: (typeof platformActions)[number];
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
    >
      <span className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-slate-950">
            {item.title}
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            {item.description}
          </span>
        </span>
      </span>
    </Link>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
    >
      {children}
    </Link>
  );
}

function getDashboardKpis(summary: DashboardSummaryModel): readonly DashboardKpi[] {
  return [
    {
      label: "Saved QR codes",
      value: formatNumber(summary.totalQRCodes),
      href: "/generate",
      icon: QrCode,
      description: "Generate",
    },
    {
      label: "Scan events",
      value: formatNumber(summary.totalScans),
      href: "/scan",
      icon: Activity,
      description: "Scan",
    },
    {
      label: "Dynamic codes",
      value: formatNumber(summary.dynamicQRCodes),
      href: "/generate",
      icon: BarChart3,
      description: "Create dynamic",
    },
    {
      label: "Landing pages",
      value: "Build",
      href: "/landing-pages",
      icon: FileText,
      description: "Open pages",
    },
  ];
}

async function fetchJson<TData>(
  url: string,
  signal?: AbortSignal
): Promise<TData> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `Request failed with ${response.status}.`));
  }

  return data as TData;
}

function isExpectedEmptyAccessMessage(message: string): boolean {
  return (
    message.includes("Sign in before viewing") ||
    message.includes("No dashboard workspace") ||
    message.includes("aborted")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
