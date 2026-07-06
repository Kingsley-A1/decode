import { PageShell } from "@/components/PageShell";
import { ScanClient } from "./scan-client";

export default function ScanPage() {
  return (
    <PageShell
      title="Scan QR codes"
      description="Scan QR codes and act on them safely."
    >
      <ScanClient />
    </PageShell>
  );
}
