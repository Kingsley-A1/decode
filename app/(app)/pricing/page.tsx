import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PricingPaymentAction } from "./PricingPaymentAction";

export const metadata: Metadata = {
  title: "Pricing | Decode",
  description:
    "Simple pilot pricing for Decode QR codes, dynamic links, landing pages, and business scan analytics.",
};

interface PricingPlan {
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly period: string;
  readonly badge?: string;
  readonly emphasis?: "default" | "featured";
  readonly features: readonly string[];
  readonly unavailable?: readonly string[];
}

const plans: readonly PricingPlan[] = [
  {
    name: "Free",
    description: "For testing Decode and creating useful QR codes without risk.",
    price: "NGN 0",
    period: "forever",
    features: [
      "Unlimited static QR codes",
      "1 dynamic QR code",
      "1 landing page",
      "30-day basic analytics",
      "Decode-branded exports",
    ],
    unavailable: ["No manual payment needed"],
  },
  {
    name: "Creators",
    description: "For creators, small vendors, and solo operators running live QR campaigns.",
    price: "NGN 6,000",
    period: "per month",
    badge: "Starter paid plan",
    features: [
      "5 dynamic QR codes",
      "3 landing pages",
      "Editable destination links",
      "90-day scan analytics",
      "WhatsApp and contact CTAs",
      "Priority setup support",
    ],
  },
  {
    name: "Business Pack",
    description: "For businesses that want the full Decode workflow for one clear annual price.",
    price: "NGN 60,000",
    period: "per year",
    badge: "Best value",
    emphasis: "featured",
    features: [
      "Access to all current Decode features",
      "Dynamic QR codes and editable redirects",
      "Landing pages for menus, links, events, profiles, and campaigns",
      "Business analytics and scan history",
      "Custom branded QR design support",
      "Priority WhatsApp onboarding",
    ],
  },
] as const;

const comparisonRows = [
  {
    feature: "Static QR codes",
    free: "Unlimited",
    creators: "Unlimited",
    business: "Unlimited",
  },
  {
    feature: "Dynamic QR codes",
    free: "1",
    creators: "5",
    business: "All current limits unlocked",
  },
  {
    feature: "Landing pages",
    free: "1",
    creators: "3",
    business: "All page types",
  },
  {
    feature: "Analytics",
    free: "30 days",
    creators: "90 days",
    business: "Business scan history",
  },
  {
    feature: "Support",
    free: "Standard",
    creators: "Priority setup",
    business: "Priority onboarding",
  },
] as const;

const faqs = [
  {
    question: "Is Paystack active on this page?",
    answer:
      "No. This pricing page is a clean client pilot. Payment confirmation is manual through OPay and WhatsApp.",
  },
  {
    question: "What happens after I send payment proof?",
    answer:
      "The Decode team confirms the payment, activates the selected plan manually, and helps with onboarding where needed.",
  },
  {
    question: "Can I use Decode without paying first?",
    answer:
      "Yes. The Free plan is available for testing static QR codes, one dynamic QR code, one landing page, and basic analytics.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="space-y-12">
      <section id="plans" className="scroll-mt-24 space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-sky-700">
            Pricing
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Choose the smallest plan that unlocks the job.
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="compare-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2
            id="compare-heading"
            className="text-2xl font-semibold tracking-normal text-slate-950"
          >
            Quick comparison
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A simple view for client conversations and plan selection.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-normal text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Feature
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Free
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Creators
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Business Pack
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="px-5 py-4 font-semibold text-slate-950">
                    {row.feature}
                  </th>
                  <td className="px-5 py-4 text-slate-600">{row.free}</td>
                  <td className="px-5 py-4 text-slate-600">{row.creators}</td>
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {row.business}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pt-2 sm:pt-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
            Questions clients will ask
          </h2>
          <div className="mt-5 grid gap-4">
            {faqs.map((item) => (
              <section key={item.question} className="border-t border-slate-100 pt-4">
                <h3 className="flex items-start gap-2 text-base font-semibold text-slate-950">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
                    aria-hidden="true"
                  />
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function PricingCard({ plan }: { readonly plan: PricingPlan }) {
  const isFeatured = plan.emphasis === "featured";
  const isFree = plan.price === "NGN 0";

  return (
    <article
      className={
        isFeatured
          ? "relative rounded-2xl border border-sky-400 bg-white p-5 shadow-[0_22px_60px_rgba(2,132,199,0.16)] ring-1 ring-sky-200 sm:p-6"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      }
    >
      {plan.badge && (
        <p
          className={
            isFeatured
              ? "inline-flex min-h-8 items-center rounded-full bg-sky-700 px-3 text-xs font-semibold text-white"
              : "inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700"
          }
        >
          {plan.badge}
        </p>
      )}
      <h3 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
        {plan.name}
      </h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
        {plan.description}
      </p>
      <div className="mt-5">
        <p className="text-4xl font-semibold tracking-normal text-slate-950">
          {plan.price}
        </p>
        <p className="mt-1 text-sm text-slate-500">{plan.period}</p>
      </div>

      {isFree ? (
        <Link
          href="/generate"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100"
        >
          Start free
          <Zap className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <PricingPaymentAction
          planName={plan.name}
          amount={plan.price}
          billingPeriod={plan.period}
        />
      )}

      <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
        {plan.unavailable?.map((item) => (
          <li key={item} className="flex items-start gap-2 text-slate-500">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
