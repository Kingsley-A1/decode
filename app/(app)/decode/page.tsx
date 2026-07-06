import { PageShell } from "@/components/PageShell";
import { CipherTool } from "@/components/CipherTool";

export default function DecodePage() {
  return (
    <PageShell
      title="Decode utility"
      description="Encode, decode, and transform text with validated algorithms."
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm">
        <CipherTool />
      </div>
    </PageShell>
  );
}
