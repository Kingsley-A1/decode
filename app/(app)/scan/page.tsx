import { PageShell } from "@/components/PageShell";
import { ScanClient } from "./scan-client";

export default function ScanPage() {
  return (
    <PageShell
      eyebrow="Scanner"
      title="Scan QR codes"
      description="Use the camera or image upload path to decode QR content without auto-opening links."
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <ScanClient />
      </div>
    </PageShell>
  );
}
