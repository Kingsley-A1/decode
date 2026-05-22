"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Archive,
  ArrowRight,
  BarChart3,
  FileCode2,
  FileText,
  Link2,
  Plus,
  QrCode,
  ScanLine,
} from "lucide-react";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { DashboardQRCodeTable } from "@/components/dashboard/DashboardQRCodeTable";
import {
  demoQRCodes,
  demoSummary,
  type DashboardQRCode,
} from "@/components/dashboard/dashboard-data";
import { formatNumber } from "@/components/dashboard/dashboard-utils";
import { Alert, Badge, Button, Dialog } from "@/components/ui";

interface DemoFeature {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly cta: string;
}

const demoFeatures: readonly DemoFeature[] = [
  {
    title: "QR generator",
    description: "Walk through content, design, frames, guardrails, and export actions.",
    href: "/generate",
    icon: QrCode,
    cta: "Generate",
  },
  {
    title: "Landing pages",
    description: "Build profile, business, links, menu, coupon, event, media, and feedback pages.",
    href: "/landing-pages",
    icon: FileText,
    cta: "Build pages",
  },
  {
    title: "Scanner",
    description: "Try camera scanning, upload fallback, result actions, and URL handoff.",
    href: "/scan",
    icon: ScanLine,
    cta: "Scan",
  },
  {
    title: "Links",
    description: "Link evidence, scoring, and review workflows are coming soon.",
    href: "/links",
    icon: Link2,
    cta: "Preview",
  },
  {
    title: "Decode utility",
    description: "Use the two-pane API-backed encoder, decoder, and cipher workspace.",
    href: "/decode",
    icon: FileCode2,
    cta: "Decode",
  },
  {
    title: "Real dashboard",
    description: "Return to the production dashboard with empty-state CTAs and real data only.",
    href: "/dashboard",
    icon: BarChart3,
    cta: "Dashboard",
  },
];

export function DemoShowcase() {
  const [rows, setRows] = useState<readonly DashboardQRCode[]>(demoQRCodes);
  const [pendingArchive, setPendingArchive] = useState<DashboardQRCode | null>(
    null
  );

  const visibleRows = useMemo(
    () => rows.filter((row) => row.status !== "archived"),
    [rows]
  );

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
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Badge variant="info">Demo data</Badge>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">
            Prefilled workspace for product demos
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This page holds the mocked QR codes, scan analytics, and feature
            walkthrough links. It lets users explore Decode without making the
            production dashboard look populated before real workspace data exists.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <PrimaryLink href="/generate">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create from demo
            </PrimaryLink>
            <SecondaryLink href="/dashboard">Open real dashboard</SecondaryLink>
          </div>
        </div>

        <aside className="rounded-xl border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Demo workspace</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <DemoStat label="QR codes" value={formatNumber(demoSummary.totalQRCodes)} />
            <DemoStat label="Scans" value={formatNumber(demoSummary.totalScans)} />
            <DemoStat label="Dynamic" value={formatNumber(demoSummary.dynamicQRCodes)} />
            <DemoStat label="Today" value="38" />
          </div>
          <Alert className="mt-4" variant="info" title="Safe preview">
            Demo actions are local previews. Production data stays on the
            dashboard route.
          </Alert>
        </aside>
      </section>

      <section aria-labelledby="demo-features-title" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="demo-features-title"
              className="text-lg font-semibold text-slate-950"
            >
              Feature demo paths
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jump into any primary workflow with clean, routed product surfaces.
            </p>
          </div>
          <Badge variant="neutral">All platform surfaces</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {demoFeatures.map((feature) => (
            <DemoFeatureCard key={feature.href} feature={feature} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Demo saved QR codes
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Static and dynamic examples with edit, detail, and archive flows.
            </p>
          </div>
          <Badge variant="info">{formatNumber(visibleRows.length)} active</Badge>
        </div>
        <DashboardQRCodeTable
          rows={visibleRows}
          onArchive={setPendingArchive}
        />
      </section>

      <DashboardAnalytics summary={demoSummary} />

      <Dialog
        open={Boolean(pendingArchive)}
        title="Archive demo QR code?"
        description="This only changes the local demo list for the current session."
        onClose={() => setPendingArchive(null)}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            {pendingArchive
              ? `Archive "${pendingArchive.title}" in this demo view?`
              : "Archive this demo QR code?"}
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
              Archive demo
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function DemoFeatureCard({ feature }: { readonly feature: DemoFeature }) {
  const Icon = feature.icon;

  return (
    <Link
      href={feature.href}
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
    >
      <span className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-slate-950">
            {feature.title}
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            {feature.description}
          </span>
          <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-sky-700">
            {feature.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </span>
    </Link>
  );
}

function DemoStat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/80 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
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
