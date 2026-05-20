import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { QRGenerator } from "@/components/QRGenerator";

export default function GeneratePage() {
  return (
    <PageShell
      title="Generate QR codes"
      description="Create, design, and export scan-ready QR codes."
      variant="workspace"
      actions={
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-800 sm:min-h-11 sm:px-4"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <QRGenerator showHeader={false} />
      </div>
    </PageShell>
  );
}
