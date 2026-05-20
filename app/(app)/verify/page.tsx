import { PageShell } from "@/components/PageShell";
import { SuspiciousLinkChecker } from "@/components/SuspiciousLinkChecker";

export default function VerifyPage() {
  return (
    <PageShell
      eyebrow="Link safety"
      title="Verify a link"
      description="Run server-side URL checks before opening or sharing a destination from a QR code."
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SuspiciousLinkChecker />
      </div>
    </PageShell>
  );
}
