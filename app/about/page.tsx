import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui";

const principles = [
  {
    title: "Useful before decorative",
    description:
      "Decode prioritizes fast QR creation, clear validation, safe opens, and layouts that stay readable on mobile and desktop.",
    icon: PanelsTopLeft,
  },
  {
    title: "Real data by default",
    description:
      "Dashboards, reviews, pages, and saved QR records are wired to APIs and database state. Demo data lives on `/demo`.",
    icon: Database,
  },
  {
    title: "Safety is visible",
    description:
      "Scanning and verification flows show normalized URLs, verdicts, reasons, and confirmation steps before risky opens.",
    icon: ShieldCheck,
  },
] as const;

const roadmap = [
  "Database-backed workspace ownership and OAuth account creation after consent.",
  "Static and dynamic QR workflows with frames, exports, design controls, and scanability warnings.",
  "Landing-page builder with accessible previews and media upload controls.",
  "Scanner, link verification, dashboard analytics, and review collection as operational product surfaces.",
] as const;

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About Decode"
      title="Professional QR tools with safety and real workspace data"
      description="Decode is built for founders, operators, creators, and teams that need QR generation, link verification, landing pages, scanning, and analytics in one clean product."
      actions={
        <Link
          href="/generate"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
        >
          Start generating
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 p-3">
              <Image
                src="/logo.svg"
                alt="Decode logo"
                width={64}
                height={64}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <Badge variant="info">King Tech Foundation product</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Decode
              </h2>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-700">
            Decode is being rebuilt as a production-minded QR and link safety
            platform: simple enough for one-off QR tasks, structured enough for
            dynamic campaigns, editable pages, asset upload, and analytics.
          </p>
          <div className="mt-5 rounded-lg bg-sky-50 p-4 text-sm leading-6 text-sky-950">
            Designed and developed by King Tech Foundation. The product direction
            is intentionally practical: fewer gimmicks, stronger workflows, and
            clear separation between demo content and real user data.
          </div>
        </article>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {principles.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-sky-700">
              Build direction
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              What the platform is becoming
            </h2>
          </div>
          <Badge variant="success" icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}>
            Active rebuild
          </Badge>
        </div>
        <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
          {roadmap.map((item) => (
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

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/docs"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
        >
          <span className="text-lg font-semibold text-slate-950">
            Read the docs
          </span>
          <span className="mt-2 block text-sm leading-6 text-slate-600">
            Understand the QR, safety, dashboard, landing-page, and decode
            workflows.
          </span>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
            Open documentation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
        <Link
          href="/support"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
        >
          <span className="text-lg font-semibold text-slate-950">
            Get support
          </span>
          <span className="mt-2 block text-sm leading-6 text-slate-600">
            Send feedback, report issues, or request implementation support
            through the official channels.
          </span>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
            Contact support
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </section>
    </PageShell>
  );
}
