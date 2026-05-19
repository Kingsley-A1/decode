import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  panel: ReactNode;
}

interface TabsProps<TValue extends string> {
  value: TValue;
  items: readonly TabItem<TValue>[];
  onChange: (value: TValue) => void;
  label: string;
  className?: string;
}

export function Tabs<TValue extends string>({
  value,
  items,
  onChange,
  label,
  className,
}: TabsProps<TValue>) {
  const activeItem = items.find((item) => item.value === value);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
        {items.map((item) => {
          const isSelected = item.value === value;

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onChange(item.value)}
              className={cn(
                "min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                isSelected
                  ? "border-sky-400 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{activeItem?.panel}</div>
    </div>
  );
}
