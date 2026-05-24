import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { PageShell } from "@/components/PageShell";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Workspace"
      title="Dashboard"
      description="Start in your workspace, then manage saved QR codes, dynamic destinations, links, pages, and scan activity as real data is created."
    >
      <DashboardClient />
    </PageShell>
  );
}
