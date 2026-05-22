import { Link2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export default function LinksPage() {
  return (
    <PageShell
      eyebrow="Links"
      title="Links"
      description="The Decode links system is being rebuilt for public use."
    >
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
          <Link2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-sky-700">
          Coming soon
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Link verification is being upgraded.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We are finishing the evidence, scoring, and review workflow before
          reopening this tool.
        </p>
      </section>
    </PageShell>
  );
}
