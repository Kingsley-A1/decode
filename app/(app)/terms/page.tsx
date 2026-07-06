import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Mail,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui";

const effectiveDate = "May 20, 2026";
const contactEmail = "decoder.ng@gmail.com";

const sharedPreviewImage = {
  url: "/icon-512.jpg",
  width: 512,
  height: 512,
  alt: "DECODE app icon",
  type: "image/jpeg",
} as const;

export const metadata: Metadata = {
  title: "Terms of Service | Decode",
  description:
    "The terms that apply when you use Decode for QR generation, scanning, verification, landing pages, uploads, and workspace features.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Decode",
    description:
      "Terms for using Decode QR generation, scanning, verification, landing pages, uploads, and workspace features.",
    url: "/terms",
    images: [sharedPreviewImage],
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | Decode",
    description:
      "Terms for using Decode QR generation, scanning, verification, landing pages, uploads, and workspace features.",
    images: [sharedPreviewImage],
  },
};

const summaryCards = [
  {
    title: "Use Decode responsibly",
    description:
      "You are responsible for the QR payloads, links, uploads, landing pages, and campaigns you create.",
    icon: BadgeCheck,
  },
  {
    title: "Respect safety controls",
    description:
      "Do not bypass link checks, scanability warnings, account controls, or platform abuse protections.",
    icon: ShieldCheck,
  },
  {
    title: "Operational product",
    description:
      "Decode may change as features improve, providers evolve, and production requirements are refined.",
    icon: FileText,
  },
] as const;

const termsSections = [
  {
    title: "1. Agreement to these terms",
    body: [
      "These Terms of Service govern your use of Decode, including QR generation, scanning, link verification, landing pages, uploaded assets, dashboards, reviews, OAuth sign-in, and related workspace features.",
      "By using Decode, you agree to these terms. If you are using Decode for an organization, you confirm that you have authority to use the service for that organization.",
    ],
  },
  {
    title: "2. Accounts and workspaces",
    body: [
      "Some features require sign-in through an OAuth provider such as Google or GitHub. You are responsible for keeping your account secure and for activity that happens through your workspace.",
      "Decode may create a default workspace after provider consent so you can save QR codes, landing pages, assets, scans, and related records.",
      "You must provide accurate account information and promptly contact support if you believe your account or workspace has been compromised.",
    ],
  },
  {
    title: "3. User content and permissions",
    body: [
      "You retain responsibility for the content you submit, including QR payloads, destination URLs, landing-page copy, images, logos, files, reviews, and support messages.",
      "You grant Decode the limited permission needed to host, process, preview, transform, render, scan, verify, publish, and display that content for the features you choose to use.",
      "Do not upload or publish content that violates law, infringes rights, contains malware, impersonates others, collects sensitive data deceptively, or misleads users about where a QR code leads.",
    ],
  },
  {
    title: "4. Acceptable use",
    body: [
      "You may not use Decode to distribute phishing pages, malware, credential harvesting flows, illegal content, spam, deceptive redirects, or abusive campaigns.",
      "You may not attempt to disrupt Decode, bypass access controls, scrape private areas, probe infrastructure, overload services, reverse engineer protected systems, or interfere with another user's workspace.",
      "Decode may restrict, remove, archive, or disable content or accounts that appear to violate these terms or create platform, user, legal, or security risk.",
    ],
  },
  {
    title: "5. QR codes, links, and scan safety",
    body: [
      "Static QR codes may keep working independently after export because their payload is encoded in the QR image. Dynamic QR codes, redirects, landing pages, dashboards, and analytics depend on Decode services remaining available.",
      "Link verification and scanability guidance are risk-reduction tools, not absolute safety guarantees. You should still review destinations before sharing or opening them.",
      "You are responsible for testing QR codes before production use, including print quality, size, contrast, destination accuracy, and scan behavior on target devices.",
    ],
  },
  {
    title: "6. Uploaded assets and logos",
    body: [
      "You must have the rights needed to upload logos, images, files, and other assets. Decode may process assets to generate previews, QR designs, landing pages, and exports.",
      "Do not upload secrets, private keys, payment credentials, regulated records, or files you are not allowed to store in the service.",
    ],
  },
  {
    title: "7. Third-party services",
    body: [
      "Decode may rely on third-party providers for hosting, databases, object storage, OAuth sign-in, analytics, security monitoring, email, and performance diagnostics.",
      "Third-party services may have their own terms and privacy practices. Decode is not responsible for third-party destinations that users encode into QR codes or link from landing pages.",
    ],
  },
  {
    title: "8. Availability and changes",
    body: [
      "Decode is improved continuously. Features may be added, changed, limited, or removed as the product matures, infrastructure changes, or safety requirements evolve.",
      "Decode aims for reliable operation, but service interruptions, provider outages, maintenance, data migrations, and defects can happen.",
    ],
  },
  {
    title: "9. Disclaimers",
    body: [
      "Decode is provided on an as-is and as-available basis to the fullest extent permitted by law. Decode does not guarantee that every QR code, link check, scan, export, landing page, or analytics result will be uninterrupted, error-free, or suitable for every use case.",
      "You are responsible for validating QR codes and destinations before campaigns, events, packaging, print runs, public launches, or other high-impact uses.",
    ],
  },
  {
    title: "10. Limitation of liability",
    body: [
      "To the fullest extent permitted by law, Decode and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including lost profits, lost data, business interruption, reputational harm, or failed campaigns.",
      "Nothing in these terms limits liability where it cannot legally be limited.",
    ],
  },
  {
    title: "11. Suspension and termination",
    body: [
      "You may stop using Decode at any time. Decode may suspend or terminate access if continued use creates security risk, legal exposure, platform abuse, payment issues where applicable, or violation of these terms.",
      "After termination, some records may remain for backups, audit logs, abuse prevention, legal obligations, or legitimate operational needs.",
    ],
  },
  {
    title: "12. Updates and contact",
    body: [
      "Decode may update these terms as the product and operating requirements change. The effective date shows when this page was last materially updated.",
      `Questions about these terms can be sent to ${contactEmail}.`,
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      description="What you can build, and your responsibilities."
      actions={
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
        >
          Ask a question
          <Mail className="h-4 w-4" aria-hidden="true" />
        </a>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
            <Badge variant="info">Effective {effectiveDate}</Badge>
            <Badge variant="neutral">Applies to Decode product use</Badge>
          </div>
          <div className="divide-y divide-slate-200">
            {termsSections.map((section) => (
              <section key={section.title} className="py-6 first:pt-5 last:pb-0">
                <h2 className="text-xl font-semibold text-slate-950">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Scale className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Practical legal surface
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This page is written for actual product use: OAuth, QR
                  payloads, landing pages, uploads, dynamic links, and scan
                  safety.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Safety matters
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Decode can restrict campaigns that create phishing, malware,
                  abuse, deceptive redirects, or legal risk.
                </p>
              </div>
            </div>
          </article>
          <Link
            href="/privacy"
            className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            Read the Privacy Policy
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </aside>
      </section>
    </PageShell>
  );
}
