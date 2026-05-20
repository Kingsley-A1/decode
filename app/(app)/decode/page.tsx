import { PageShell } from "@/components/PageShell";
import { CipherTool } from "@/components/CipherTool";

export default function DecodePage() {
  return (
    <PageShell
      eyebrow="Utilities"
      title="Decode utility"
      description="Run server-validated text transforms for Base64, URL encoding, ROT13, Caesar, Morse, binary, hex, and reverse workflows."
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm">
        <CipherTool showHeader={false} />
      </div>
    </PageShell>
  );
}
