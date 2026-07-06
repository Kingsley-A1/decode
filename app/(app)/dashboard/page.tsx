import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { PageShell } from "@/components/PageShell";
import { withReturnTo } from "@/lib/redirects";

export default async function DashboardPage() {
  const session = await auth();

  // The dashboard is a workspace surface; anonymous visitors go to the
  // sign-in page and return here after authenticating.
  if (!session?.user) {
    redirect(withReturnTo("/me?intent=login", "/dashboard"));
  }

  return (
    <PageShell
      title="Dashboard"
      description="Manage saved QR codes and scan analytics."
    >
      <DashboardClient />
    </PageShell>
  );
}
