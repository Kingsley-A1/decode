import Link from "next/link";
import { Eye, FileText, LayoutTemplate, UploadCloud } from "lucide-react";
import { LandingPageBuilderIsland } from "@/components/landing-pages/LandingPageBuilderIsland";
import { PageShell } from "@/components/PageShell";

const pageCapabilities = [
  {
    title: "Template library",
    description: "Profile, business, links, menu, coupon, event, feedback, media, and document pages.",
    icon: LayoutTemplate,
  },
  {
    title: "Media-ready",
    description: "Upload images, PDFs, and audio through the asset flow with type and size validation.",
    icon: UploadCloud,
  },
  {
    title: "Live preview",
    description: "Check mobile and desktop page fit before publishing dynamic QR destinations.",
    icon: Eye,
  },
  {
    title: "Public output",
    description: "Accessible headings, links, image labels, documents, and media controls for public pages.",
    icon: FileText,
  },
] as const;

export default function LandingPagesPage() {
  return (
    <PageShell
      variant="workspace"
      eyebrow="Pages"
      title="Landing pages"
      description="Create polished, editable public pages for dynamic QR campaigns with templates, media uploads, and mobile-first preview."
    >
      <div className="space-y-6">
        <LandingPageBuilderIsland />

        <section
          aria-label="Landing page capabilities"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {pageCapabilities.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-base font-semibold text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>

        <div className="flex justify-end">
          <Link
            href="/demo"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            View demo
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
