import { PageShell } from "@/components/PageShell";
import { ScanClient } from "./scan-client";

export default function ScanPage() {
  return (
    <PageShell
      eyebrow="Scanner"
      title="Scan QR codes"
      description="Scan, verify, and act on QR content without auto-opening unsafe destinations."
    >
      <ScanClient />
    </PageShell>
  );
}
