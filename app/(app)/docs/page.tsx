import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCode2,
  FileText,
  Link2,
  QrCode,
  ScanLine,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui";

const workflowDocs = [
  {
    title: "Generate QR codes",
    href: "/generate",
    icon: QrCode,
    description:
      "Create static QR codes for fixed payloads or dynamic QR codes that route through editable destinations.",
    bullets: [
      "Choose a QR type and complete the validated form.",
      "Adjust colors, frame, logo, and scanability-safe design settings.",
      "Export PNG, SVG, or PDF with format-specific actions.",
    ],
  },
  {
    title: "Scan",
    href: "/scan",
    icon: ScanLine,
    description:
      "Decode QR codes with a camera-first flow and image upload fallback.",
    bullets: [
      "Grant camera permission only when scanning is needed.",
      "Use image upload when camera access is blocked or unavailable.",
      "Copy, share, clear, verify, or safely open decoded results.",
    ],
  },
  {
    title: "Links",
    href: "/links",
    icon: Link2,
    description:
      "Verify a destination with heuristics, an SSRF-protected probe, and threat intelligence.",
    bullets: [
      "Every verdict shows its evidence, confidence, and probe summary.",
      "Suspicious or malicious verdicts gate the open flow behind a confirmation.",
      "Use verification directly from scan results when content is a URL.",
    ],
  },
  {
    title: "Landing pages",
    href: "/landing-pages",
    icon: FileText,
    description:
      "Build editable mobile pages for profiles, business cards, menus, events, coupons, and media links.",
    bullets: [
      "Pick a template and validate required content before publishing.",
      "Upload media through the R2-backed asset flow.",
      "Preview mobile and desktop layouts before sharing.",
    ],
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description:
      "Manage saved QR codes, dynamic destinations, and scan analytics from real workspace data.",
    bullets: [
      "Demo content lives on `/demo`, not the production dashboard.",
      "Dynamic QR codes can be distinguished from static codes.",
      "Analytics show scan totals, devices, referrers, and recent scans.",
    ],
  },
  {
    title: "Decode utility",
    href: "/decode",
    icon: FileCode2,
    description:
      "Encode, decode, and validate supported text algorithms through an API-backed utility surface.",
    bullets: [
      "Use direction controls for encode and decode operations.",
      "Copy, swap, and clear long text without breaking layout.",
      "Invalid input returns clear validation errors.",
    ],
  },
] as const;

const operatingNotes = [
  "Sign in through OAuth before saving private workspace data.",
  "Default workspaces are created after OAuth provider consent.",
  "Suspicious links are never opened automatically.",
  "Keyboard focus remains visible across navigation, forms, and controls.",
  "Dynamic QR destinations should be edited before printed codes are retired.",
  "Public pages should keep headings, links, and media labels accessible.",
] as const;

export default function DocsPage() {
  return (
    <PageShell
      eyebrow="Product docs"
      title="Decode documentation"
      description="A practical operating guide for QR generation, scanning, verification, landing pages, dashboard analytics, and text decode utilities."
      actions={
        <Link
          href="/support"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
        >
          Get support
        </Link>
      }
    >
      <section className="grid gap-4 lg:grid-cols-3" aria-label="Documentation summary">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <Badge variant="info">Quick start</Badge>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">
            Build, verify, and track a QR workflow
          </h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-3">
            {[
              "Create a QR code or landing page.",
              "Review the destination before sharing.",
              "Track saved codes and scan activity in the dashboard.",
            ].map((item, index) => (
              <li key={item} className="rounded-lg bg-slate-50 p-4">
                <span className="block text-xs font-semibold uppercase text-sky-700">
                  Step {index + 1}
                </span>
                <span className="mt-2 block">{item}</span>
              </li>
            ))}
          </ol>
        </article>
        <article className="rounded-xl border border-slate-200 bg-sky-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Data rule
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Production surfaces use real API and database state. Sample content
            belongs on the demo route so users can clearly separate practice
            data from workspace data.
          </p>
        </article>
      </section>

      <section aria-labelledby="workflow-docs-title" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="workflow-docs-title" className="text-xl font-semibold text-slate-950">
              Workflow guides
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Each route is documented around the action a user is trying to complete.
            </p>
          </div>
          <Badge variant="neutral">6 core flows</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {workflowDocs.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="flex items-start justify-between gap-4">
                  <span className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-semibold text-slate-950">
                        {section.title}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">
                        {section.description}
                      </span>
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-sky-700"
                    aria-hidden="true"
                  />
                </span>
                <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Operational checklist
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Use this before launching a public QR campaign.
            </p>
          </div>
          <Badge variant="success">Production-minded</Badge>
        </div>
        <ul className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          {operatingNotes.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
