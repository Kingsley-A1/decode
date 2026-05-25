import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperStep {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: readonly StepperStep[];
  currentStep: number;
  variant?: "responsive" | "compact" | "cards";
  onStepSelect?: (stepIndex: number) => void;
}

export function ProgressStepper({
  steps,
  currentStep,
  variant = "responsive",
  onStepSelect,
}: StepperProps) {
  const isCompact = variant === "compact";
  const isCards = variant === "cards";
  const getStepPaddingClass = () => {
    if (isCompact) return "px-2 py-1.5";
    if (isCards) return "p-2.5";

    return "px-2 py-1.5 md:p-2.5";
  };

  return (
    <ol
      className={cn(
        "grid grid-cols-3",
        isCompact &&
          "min-h-12 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm",
        isCards && "gap-3",
        variant === "responsive" &&
          "min-h-12 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm md:min-h-0 md:gap-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
      )}
      aria-label="QR creation progress"
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const canSelectStep = Boolean(onStepSelect) && index <= currentStep;
        const stepContent = (
          <>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
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
              <p
                className={cn(
                  "mt-2 text-sm leading-5 text-slate-600",
                  (isCompact || variant === "responsive") && "hidden md:block"
                )}
              >
                {step.description}
              </p>
            )}
          </>
        );

        return (
          <li
            key={step.label}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "rounded-lg",
              !canSelectStep && getStepPaddingClass(),
              isCards && "border",
              variant === "responsive" && "md:border",
              isCurrent
                ? cn("bg-sky-50", isCards ? "border-sky-300" : "md:border-sky-300")
                : isComplete
                  ? cn(
                      "bg-emerald-50",
                      isCards ? "border-emerald-200" : "md:border-emerald-200"
                    )
                  : cn("bg-white", isCards ? "border-slate-200" : "md:border-slate-200")
            )}
          >
            {canSelectStep ? (
              <button
                type="button"
                className={cn(
                  "block min-h-11 w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                  getStepPaddingClass()
                )}
                onClick={() => onStepSelect?.(index)}
                aria-label={`Go to ${step.label} step`}
              >
                {stepContent}
              </button>
            ) : (
              stepContent
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Stepper(props: StepperProps) {
  return <ProgressStepper {...props} />;
}
