import { DemoShowcase } from "@/components/demo/DemoShowcase";
import { PageShell } from "@/components/PageShell";

export default function DemoPage() {
  return (
    <PageShell
      eyebrow="Product demo"
      title="Demo workspace"
      description="Explore Decode with prefilled QR codes, analytics, landing-page workflows, scanner tools, link verification, and decoder utilities."
    >
      <DemoShowcase />
    </PageShell>
  );
}
