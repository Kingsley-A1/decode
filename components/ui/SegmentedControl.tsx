import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<TValue extends string> {
  value: TValue;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<TValue extends string> {
  value: TValue;
  options: readonly SegmentedControlOption<TValue>[];
  onChange: (value: TValue) => void;
  label: string;
  columns?: "auto" | 2 | 3 | 4;
  className?: string;
}

const columnClasses = {
  auto: "grid-cols-1 sm:grid-cols-2",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function SegmentedControl<TValue extends string>({
  value,
  options,
  onChange,
  label,
  columns = "auto",
  className,
}: SegmentedControlProps<TValue>) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className={cn("grid gap-2", columnClasses[columns])} role="group" aria-label={label}>
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-11 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                isSelected
                  ? "border-sky-400 bg-sky-50 text-sky-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {option.icon}
                {option.label}
              </span>
              {option.description && (
                <span className="mt-1 hidden text-xs leading-5 text-slate-600 sm:block">
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
