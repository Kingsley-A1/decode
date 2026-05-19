import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { QRGenerator } from "@/components/QRGenerator";

export default function GeneratePage() {
  return (
    <PageShell
      eyebrow="QR workspace"
      title="Generate QR codes"
      description="Create static QR codes now, with the shell ready for dynamic QR creation, saved designs, and analytics workflows."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-800"
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
