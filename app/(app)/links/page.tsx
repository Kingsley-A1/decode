import { PageShell } from "@/components/PageShell";
import { SuspiciousLinkChecker } from "@/components/SuspiciousLinkChecker";

export default function LinksPage() {
  return (
    <PageShell
      eyebrow="Link safety"
      title="Verify a link"
      description="Normalize a destination, run heuristics, probe it under SSRF protection, and check threat intelligence before you open or share it."
    >
      <SuspiciousLinkChecker />
    </PageShell>
  );
}
