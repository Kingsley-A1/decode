import Link from "next/link";
import {
  Eye,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  UploadCloud,
} from "lucide-react";
import { LandingPageBuilder } from "@/components/landing-pages/LandingPageBuilder";
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
      eyebrow="Pages"
      title="Landing pages"
      description="Create polished, editable public pages for dynamic QR campaigns with templates, media uploads, and mobile-first preview."
      actions={
        <Link
          href="/demo"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
        >
          View demo
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-950">
                  Build pages that make dynamic QR codes useful
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Use Pages when the QR destination needs more than a single
                  redirect: menus, offers, galleries, event details, documents,
                  audio, video, feedback, and link collections.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              Publishing model
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pages attach to dynamic QR codes, stay editable after publishing,
              and keep media labels accessible for public rendering.
            </p>
          </aside>
        </section>

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

        <LandingPageBuilder />
      </div>
    </PageShell>
  );
}
