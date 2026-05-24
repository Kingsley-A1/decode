"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface PricingPaymentActionProps {
  readonly planName: string;
  readonly amount: string;
  readonly billingPeriod: string;
}

const opayAccountNumber = "8088071657";
const opayAccountName = "Kingsley Maduabuchi";
const decodeWhatsAppPhone = "2349036826272";

function getPaymentProofUrl({
  planName,
  amount,
  billingPeriod,
}: PricingPaymentActionProps): string {
  const message = [
    "Hello Decode, I have made payment for the",
    `${planName} plan (${amount} ${billingPeriod}).`,
    `Payment was sent to OPay ${opayAccountNumber} - ${opayAccountName}.`,
    "I want to upload my payment proof and activate my plan.",
  ].join(" ");

  return `https://wa.me/${decodeWhatsAppPhone}?text=${encodeURIComponent(message)}`;
}

export function PricingPaymentAction({
  planName,
  amount,
  billingPeriod,
}: PricingPaymentActionProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const paymentProofUrl = getPaymentProofUrl({
    planName,
    amount,
    billingPeriod,
  });

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <button
        type="button"
        onClick={() => {
          setIsSelected(true);
          setHasPaid(false);
        }}
        aria-expanded={isSelected}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky-700 px-4 py-3 text-sm font-semibold text-[#ffffff] shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-600"
      >
        Choose {planName}
      </button>

      <div className="mt-4 min-h-12" aria-live="polite">
        {isSelected && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-slate-950">Payment details</p>
              <dl className="grid gap-2 text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <dt>Bank</dt>
                  <dd className="font-semibold text-slate-950">OPay</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Account number</dt>
                  <dd className="font-mono text-base font-semibold text-slate-950">
                    {opayAccountNumber}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Account name</dt>
                  <dd className="text-right font-semibold text-slate-950">
                    {opayAccountName}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              onClick={() => setHasPaid(true)}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-[#ffffff] shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-600"
            >
              I have made my payment
            </button>

            {hasPaid && (
              <a
                href={paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#128c4a] px-4 py-3 text-sm font-semibold text-[#ffffff] shadow-sm shadow-emerald-900/20 transition-colors hover:bg-[#0f773f] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#25d366]"
              >
                <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
                Upload payment proof on WhatsApp
              </a>
            )}
            {hasPaid && (
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                Keep your receipt or screenshot ready before opening WhatsApp.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
