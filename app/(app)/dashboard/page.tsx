import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { PageShell } from "@/components/PageShell";

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Workspace"
      title="Dashboard"
    >
      <DashboardClient />
    </PageShell>
  );
}
