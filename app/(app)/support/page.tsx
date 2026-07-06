import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Link2,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui";

const supportChannels = [
  {
    title: "Email support",
    description: "Send product feedback, bug reports, and implementation questions.",
    href: "mailto:decoder.ng@gmail.com",
    label: "decoder.ng@gmail.com",
    icon: Mail,
  },
  {
    title: "WhatsApp",
    description: "Use WhatsApp for direct operational support and quick product questions.",
    href: "https://wa.me/2349036826272",
    label: "+234 903 682 6272",
    icon: MessageCircle,
  },
  {
    title: "Phone",
    description: "Call when you need a direct discussion about setup or QR workflows.",
    href: "tel:+2349036826272",
    label: "+234 903 682 6272",
    icon: Phone,
  },
] as const;

const supportPaths = [
  {
    title: "Read setup guidance",
    description: "Use the docs before launching a QR campaign or landing page.",
    href: "/docs",
    icon: BookOpen,
  },
  {
    title: "Links",
    description: "Link safety workflows are being rebuilt for public use.",
    href: "/links",
    icon: Link2,
  },
] as const;

const reportChecklist = [
  "The route or feature where the issue happened.",
  "A short description of what you expected versus what happened.",
  "The request ID from any failed API response if one was shown.",
  "Browser, device type, and whether the issue happens after refresh.",
] as const;

export default function SupportPage() {
  return (
    <PageShell
      title="Get help with Decode"
      description="Get help with questions, bugs, or safety concerns."
      actions={
        <a
          href="mailto:decoder.ng@gmail.com"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
        >
          Email support
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {supportChannels.map((channel) => {
          const Icon = channel.icon;

          return (
            <a
              key={channel.title}
              href={channel.href}
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mt-4 block text-lg font-semibold text-slate-950">
                {channel.title}
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">
                {channel.description}
              </span>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                {channel.label}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="info">Support intake</Badge>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                What to include in a report
              </h2>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
            {reportChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <section className="grid gap-3">
          {supportPaths.map((path) => {
            const Icon = path.icon;

            return (
              <Link
                key={path.href}
                href={path.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-950">
                      {path.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      {path.description}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                      Continue
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </section>
      </section>
    </PageShell>
  );
}
