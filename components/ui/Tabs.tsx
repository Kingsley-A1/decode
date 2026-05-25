"use client";

import {
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
  const generatedId = useId();
  const tabRefs = useRef(new Map<TValue, HTMLButtonElement>());
  const activeItem = items.find((item) => item.value === value);
  const activeIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0
  );

  const selectAndFocus = (index: number) => {
    const item = items[index];
    if (!item) return;

    onChange(item.value);
    window.requestAnimationFrame(() => {
      tabRefs.current.get(item.value)?.focus({ preventScroll: true });
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectAndFocus((activeIndex + 1) % items.length);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectAndFocus((activeIndex - 1 + items.length) % items.length);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      selectAndFocus(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      selectAndFocus(items.length - 1);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory]"
        role="tablist"
        aria-label={label}
      >
        {items.map((item) => {
          const isSelected = item.value === value;
          const tabId = `${generatedId}-${item.value}-tab`;
          const panelId = `${generatedId}-${item.value}-panel`;

          return (
            <button
              key={item.value}
              ref={(node) => {
                if (node) {
                  tabRefs.current.set(item.value, node);
                } else {
                  tabRefs.current.delete(item.value);
                }
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-controls={panelId}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-11 shrink-0 scroll-mx-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
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
      {activeItem && (
        <div
          id={`${generatedId}-${activeItem.value}-panel`}
          role="tabpanel"
          aria-labelledby={`${generatedId}-${activeItem.value}-tab`}
        >
          {activeItem.panel}
        </div>
      )}
    </div>
  );
}
