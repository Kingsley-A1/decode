import { DemoShowcase } from "@/components/demo/DemoShowcase";
import { PageShell } from "@/components/PageShell";

export default function DemoPage() {
  return (
    <PageShell
      title="Demo workspace"
      description="Explore Decode with sample data, no account needed."
    >
      <DemoShowcase />
    </PageShell>
  );
}
