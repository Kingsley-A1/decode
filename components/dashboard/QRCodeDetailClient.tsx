"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Edit3,
  ExternalLink,
  Link2,
  QrCode,
} from "lucide-react";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import {
  emptyDashboardSummary,
  type DashboardQRCode,
  type DashboardSummaryModel,
} from "@/components/dashboard/dashboard-data";
import { useQRCode, type QROptions } from "@/hooks/useQRCode";
import {
  formatDateTime,
  formatNumber,
  getApiErrorMessage,
  getModeLabel,
  getQRCodeDestinationLabel,
  getQRCodeEditHref,
  getStatusLabel,
  getTypeLabel,
  normalizeSummary,
  normalizeQRCode,
} from "@/components/dashboard/dashboard-utils";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  QRPreviewPanel,
  Skeleton,
  StatTile,
} from "@/components/ui";

interface ApiResponse<TData> {
  readonly ok: boolean;
  readonly data?: TData;
  readonly error?: { readonly message: string };
}

interface QRCodeDetailClientProps {
  readonly qrCodeId: string;
}

export function QRCodeDetailClient({ qrCodeId }: QRCodeDetailClientProps) {
  const [qrCode, setQRCode] = useState<DashboardQRCode | null>(null);
  const [summary, setSummary] =
    useState<DashboardSummaryModel>(emptyDashboardSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const loadQRCode = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetchJson<
        ApiResponse<{ qrCode: unknown; analytics?: unknown }>
      >(`/api/qr-codes/${encodeURIComponent(qrCodeId)}`);

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not load QR code.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (!normalized) throw new Error("The QR code response was incomplete.");

      setQRCode(normalized);
      setSummary(
        normalizeSummary(response.data?.analytics) ?? emptyDashboardSummary
      );
    } catch (error) {
      setQRCode(null);
      setSummary(emptyDashboardSummary);
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not load this QR code."
      );
    } finally {
      setIsLoading(false);
    }
  }, [qrCodeId]);

  useEffect(() => {
    void loadQRCode();
  }, [loadQRCode]);

  const confirmArchive = async () => {
    if (!qrCode) return;

    setIsArchiving(true);
    setNotice(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCode.id)}/archive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not archive QR code.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (normalized) setQRCode(normalized);
      setShowArchiveDialog(false);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not archive QR code."
      );
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!qrCode) {
    return (
      <EmptyState
        title="QR code not found"
        description={notice ?? "No matching saved QR code could be loaded."}
        icon={<QrCode className="h-6 w-6" aria-hidden="true" />}
        action={
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={getQRCodeEditHref(qrCode)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowArchiveDialog(true)}
            isLoading={isArchiving}
            leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
          >
            Archive
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant="warning" title="QR detail notice">
          {notice}
        </Alert>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={qrCode.mode === "dynamic" ? "info" : "neutral"}>
                  {getModeLabel(qrCode.mode)}
                </Badge>
                <Badge variant={qrCode.status === "published" ? "success" : "warning"}>
                  {getStatusLabel(qrCode.status)}
                </Badge>
                <Badge variant="neutral">{getTypeLabel(qrCode.type)}</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
                {qrCode.title}
              </h2>
              <p className="mt-2 break-all text-sm leading-6 text-slate-600">
                {getQRCodeDestinationLabel(qrCode)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Scans"
              value={formatNumber(qrCode.scanCount)}
              icon={<QrCode className="h-5 w-5" aria-hidden="true" />}
            />
            <StatTile
              label="Updated"
              value={formatDateTime(qrCode.updatedAt)}
              icon={<Edit3 className="h-5 w-5" aria-hidden="true" />}
            />
            <StatTile
              label="Published"
              value={formatDateTime(qrCode.publishedAt)}
              icon={<ExternalLink className="h-5 w-5" aria-hidden="true" />}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoBlock label="Mode" value={getModeLabel(qrCode.mode)} />
            <InfoBlock label="Type" value={getTypeLabel(qrCode.type)} />
            <InfoBlock label="Slug" value={qrCode.slug ?? "Not used"} />
            <InfoBlock label="Status" value={getStatusLabel(qrCode.status)} />
          </div>
        </div>

        <aside className="space-y-4">
          <QRPreviewPanel>
            <SavedQRCodePreview qrCode={qrCode} />
          </QRPreviewPanel>
          {qrCode.mode === "dynamic" ? (
            <Alert variant="info" title="Editable destination">
              This dynamic QR can route to a new URL without reprinting the code.
            </Alert>
          ) : (
            <Alert variant="warning" title="Static QR">
              Static QR content is fixed after export. Create a new QR when the
              encoded content needs to change.
            </Alert>
          )}
        </aside>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-950">
            Destination and content
          </h2>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            {qrCode.mode === "dynamic" ? "Current destination" : "Encoded content"}
          </p>
          <p className="mt-2 break-all text-sm leading-6 text-slate-600">
            {getQRCodeDestinationLabel(qrCode)}
          </p>
        </div>
      </section>

      <DashboardAnalytics summary={summary} />

      <Dialog
        open={showArchiveDialog}
        title="Archive QR code?"
        description="This requires confirmation because it can affect live campaign operations."
        onClose={() => setShowArchiveDialog(false)}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Archive &quot;{qrCode.title}&quot;? Keep printed dynamic codes active until
            replacement signage or links are in place.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmArchive}
              isLoading={isArchiving}
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

function InfoBlock({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function SavedQRCodePreview({ qrCode }: { readonly qrCode: DashboardQRCode }) {
  const qrOptions = useMemo<QROptions>(() => {
    const design = qrCode.designConfig;

    return {
      data: qrCode.payloadValue ?? qrCode.redirectUrl ?? qrCode.destinationUrl ?? "",
      width: 260,
      height: 260,
      margin: design?.margin ?? 16,
      dotsColor: design?.foregroundColor ?? "#0F172A",
      backgroundColor: design?.backgroundColor ?? "#FFFFFF",
      dotsType: getQROptionDotStyle(design?.dotStyle),
      cornersSquareType: getQROptionCornerStyle(design?.cornerStyle),
      cornersDotType: design?.cornerStyle === "dot" ? "dot" : "square",
      errorCorrectionLevel: design?.errorCorrectionLevel ?? "Q",
      logoSize: 0,
    };
  }, [qrCode]);
  const { ref, isReady } = useQRCode(qrOptions);

  if (!qrOptions.data) {
    return (
      <div className="flex min-h-48 items-center justify-center text-center text-sm leading-6 text-slate-500">
        No saved QR payload is available for this code.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      aria-label={`${qrCode.title} QR preview`}
      className={`w-full overflow-hidden rounded-lg [&_canvas]:!h-auto [&_canvas]:!w-full ${
        isReady ? "" : "animate-pulse"
      }`}
    />
  );
}

function getQROptionDotStyle(
  value: string | undefined
): QROptions["dotsType"] {
  if (
    value === "rounded" ||
    value === "dots" ||
    value === "classy" ||
    value === "extra-rounded"
  ) {
    return value;
  }

  return "square";
}

function getQROptionCornerStyle(
  value: string | undefined
): QROptions["cornersSquareType"] {
  if (value === "rounded") return "extra-rounded";
  if (value === "dot") return "dot";

  return "square";
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-40" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function fetchJson<TData>(
  url: string,
  init?: RequestInit
): Promise<TData> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `Request failed with ${response.status}.`));
  }

  return data as TData;
}
