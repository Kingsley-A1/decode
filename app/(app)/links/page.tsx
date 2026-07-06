import { PageShell } from "@/components/PageShell";
import { SuspiciousLinkChecker } from "@/components/SuspiciousLinkChecker";

export default function LinksPage() {
  return (
    <PageShell
      title="Verify a link"
      description="Check a link's safety before you open it."
    >
      <SuspiciousLinkChecker />
    </PageShell>
  );
}
