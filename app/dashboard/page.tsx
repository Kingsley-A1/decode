import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { PageShell } from "@/components/PageShell";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Workspace"
      title="Dashboard"
      description="Start from a clean workspace, then manage saved QR codes, dynamic destinations, pages, and scan activity as real data is created."
    >
      <DashboardClient />
    </PageShell>
  );
}
