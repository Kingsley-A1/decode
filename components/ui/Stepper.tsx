import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperStep {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: readonly StepperStep[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li
            key={step.label}
            className={cn(
              "rounded-lg border p-3",
              isCurrent
                ? "border-sky-300 bg-sky-50"
                : isComplete
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-white"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isComplete
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                      ? "bg-sky-700 text-white"
                      : "bg-slate-100 text-slate-600"
                )}
              >
                {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className="text-sm font-semibold text-slate-950">
                {step.label}
              </span>
            </div>
            {step.description && (
              <p className="mt-2 text-sm leading-5 text-slate-600">
                {step.description}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
