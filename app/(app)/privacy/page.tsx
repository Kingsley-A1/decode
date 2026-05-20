import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
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
  title: "Privacy Policy | Decode",
  description:
    "How Decode collects, uses, stores, and protects account, QR, landing-page, asset, and scan data.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Decode",
    description:
      "How Decode handles account, QR, landing-page, asset, and scan data.",
    url: "/privacy",
    images: [sharedPreviewImage],
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Decode",
    description:
      "How Decode handles account, QR, landing-page, asset, and scan data.",
    images: [sharedPreviewImage],
  },
};

const summaryCards = [
  {
    title: "Identity data",
    description:
      "OAuth sign-in stores only the account details needed to create your Decode account and workspace.",
    icon: UserRound,
  },
  {
    title: "Workspace data",
    description:
      "QR codes, landing pages, uploads, reviews, and settings are used to provide the features you choose.",
    icon: Database,
  },
  {
    title: "Security first",
    description:
      "Scan telemetry is minimized, sensitive identifiers are hashed where practical, and admin access is restricted.",
    icon: ShieldCheck,
  },
] as const;

const policySections = [
  {
    title: "1. What Decode collects",
    body: [
      "Account data, including your name, email address, profile image, OAuth provider identifier, session records, and workspace membership information when you sign in.",
      "QR and landing-page data, including titles, payloads, destination URLs, design settings, publish status, uploaded assets, and generated landing-page content.",
      "Operational data, including scan counts, scan timestamps, device class, browser, operating system, referrer, coarse location signals when available, hashed network identifiers, audit logs, support messages, and error diagnostics.",
      "Review data, including the name, email address, rating, title, and review body you choose to submit.",
    ],
  },
  {
    title: "2. How Decode uses data",
    body: [
      "To create and manage QR codes, landing pages, uploaded assets, previews, exports, scans, analytics, and workspace records.",
      "To authenticate users, create default workspaces, maintain sessions, protect accounts, investigate abuse, and keep admin operations auditable.",
      "To respond to support requests, improve product reliability, debug failed workflows, and understand which features need better implementation.",
      "To verify links and reduce QR safety risk by showing normalized URLs, verdicts, reasons, and cautious-open flows.",
    ],
  },
  {
    title: "3. Google and OAuth data",
    body: [
      "If you sign in with Google, Decode uses Google OAuth only to authenticate you and receive basic profile information such as your name, email address, profile image, and provider account identifier.",
      "Decode does not sell Google user data, use it for advertising, or transfer it for unrelated purposes. Google user data is used to operate your requested account and workspace features.",
      "OAuth provider access tokens, refresh tokens, scopes, and expiry metadata may be stored by the authentication adapter when returned by the provider, and are protected as account credentials.",
    ],
  },
  {
    title: "4. Sharing and service providers",
    body: [
      "Decode may use infrastructure providers for hosting, databases, object storage, analytics, security monitoring, email/support handling, and application performance diagnostics.",
      "Those providers process data only to help operate Decode. Decode does not sell personal information.",
      "If you publish a QR code or landing page, the content you publish may be visible to anyone with the QR code, URL, or shared destination.",
    ],
  },
  {
    title: "5. Cookies, analytics, and local storage",
    body: [
      "Decode uses cookies or similar storage for authentication sessions, security, preferences, PWA behavior, and application functionality.",
      "Privacy-conscious analytics and performance signals may be used to understand product reliability, page performance, and usage patterns without turning Decode into an advertising product.",
    ],
  },
  {
    title: "6. Retention and deletion",
    body: [
      "Workspace records, QR codes, landing pages, uploaded assets, and audit logs are kept while needed to provide the product, comply with operational requirements, resolve disputes, prevent abuse, or meet legal obligations.",
      "You can request account or workspace deletion by contacting support. Some records may remain in backups, security logs, audit logs, or legally required records for a limited period.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "Decode uses practical administrative, technical, and operational controls to protect user data, including restricted admin access, hashed telemetry identifiers where practical, and server-side validation for sensitive workflows.",
      "No internet service can guarantee perfect security. If you believe your account, QR code, or uploaded asset has been exposed, contact support quickly.",
    ],
  },
  {
    title: "8. Your choices",
    body: [
      "You can choose what QR payloads, landing-page content, assets, and reviews you submit. Avoid uploading secrets, payment credentials, private keys, or content you do not have rights to use.",
      "You can contact support to request access, correction, export, or deletion of personal data associated with your account, subject to identity verification and applicable retention requirements.",
    ],
  },
  {
    title: "9. Children",
    body: [
      "Decode is not directed to children under 13. If you believe a child has provided personal information, contact support so the issue can be reviewed.",
    ],
  },
  {
    title: "10. Updates",
    body: [
      "Decode may update this Privacy Policy as the product, legal requirements, or operational practices change. The effective date shows when this page was last materially updated.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      description="Decode is built as a practical QR workspace. This policy explains what data is collected, why it is used, and how privacy-sensitive workflows are handled."
      actions={
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
        >
          Contact support
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
            <Badge variant="neutral">Applies to decode.com.ng and app routes</Badge>
          </div>
          <div className="divide-y divide-slate-200">
            {policySections.map((section) => (
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
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Google Cloud Console ready
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This page directly covers Google OAuth sign-in data, user
                  consent, storage, sharing, and deletion requests.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  No sale of personal data
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Decode uses account and workspace data to operate the product,
                  not to sell user profiles or run advertising resale.
                </p>
              </div>
            </div>
          </article>
          <Link
            href="/terms"
            className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            Read the Terms of Service
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
