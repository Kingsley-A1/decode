"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  demoSummary,
  getDemoQRCodeById,
  type DashboardQRCode,
} from "@/components/dashboard/dashboard-data";
import {
  formatDateTime,
  formatNumber,
  getApiErrorMessage,
  getModeLabel,
  getQRCodeDestinationLabel,
  getQRCodeEditHref,
  getStatusLabel,
  getTypeLabel,
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
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const loadQRCode = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCodeId)}`
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not load QR code.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (!normalized) throw new Error("The QR code response was incomplete.");

      setQRCode(normalized);
    } catch (error) {
      const previewQRCode = getDemoQRCodeById(qrCodeId);
      setQRCode(previewQRCode);
      setNotice(
        error instanceof Error
          ? `${error.message} Showing preview detail data when available.`
          : "Showing preview detail data when available."
      );
    } finally {
      setIsLoading(false);
    }
  }, [qrCodeId]);

  useEffect(() => {
    void loadQRCode();
  }, [loadQRCode]);

  const confirmArchive = () => {
    if (!qrCode) return;

    setQRCode({
      ...qrCode,
      status: "archived",
      archivedAt: new Date().toISOString(),
    });
    setShowArchiveDialog(false);
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!qrCode) {
    return (
      <EmptyState
        title="QR code not found"
        description="This dashboard detail route is ready, but no matching saved QR code could be loaded."
        icon={<QrCode className="h-6 w-6" aria-hidden="true" />}
        action={
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
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
            leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
          >
            Archive
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant="info" title="Preview detail">
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
            <MiniQRPattern label={qrCode.title} />
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

      <DashboardAnalytics summary={demoSummary} />

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

function MiniQRPattern({ label }: { readonly label: string }) {
  return (
    <div
      aria-label={`${label} QR preview`}
      className="grid aspect-square w-full max-w-[260px] grid-cols-9 gap-1 rounded-lg bg-white p-4"
    >
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const column = index % 9;
        const isFinder =
          (row < 3 && column < 3) ||
          (row < 3 && column > 5) ||
          (row > 5 && column < 3);
        const isActive =
          isFinder || (row * 7 + column * 11 + label.length) % 4 !== 0;

        return (
          <span
            key={index}
            className={
              isActive
                ? "rounded-[3px] bg-slate-950"
                : "rounded-[3px] bg-slate-100"
            }
          />
        );
      })}
    </div>
  );
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

async function fetchJson<TData>(url: string): Promise<TData> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `Request failed with ${response.status}.`));
  }

  return data as TData;
}
