"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChoiceRailOption<TValue extends string> {
  value: TValue;
  label: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface ChoiceRailProps<
  TValue extends string,
  TOption extends ChoiceRailOption<TValue> = ChoiceRailOption<TValue>,
> {
  value: TValue;
  options: readonly TOption[];
  onChange: (value: TValue) => void;
  label: string;
  size?: "sm" | "md" | "lg" | "icon";
  desktopColumns?: 2 | 3 | 4;
  renderPreview?: (
    option: TOption,
    isSelected: boolean
  ) => ReactNode;
  getDescription?: (
    option: TOption,
    isSelected: boolean
  ) => ReactNode;
  className?: string;
  railClassName?: string;
  optionClassName?: string;
  "data-testid"?: string;
  railTestId?: string;
}

const sizeClasses = {
  sm: "min-h-11 min-w-24 px-3 py-2",
  icon: "min-h-[86px] min-w-[88px] max-w-[96px] px-2 py-2",
  md: "min-h-16 min-w-[180px] px-3 py-3",
  lg: "min-h-[148px] min-w-[156px] max-w-[156px] p-2 sm:min-h-[184px] sm:min-w-0 sm:max-w-none sm:p-3",
};

const desktopColumnClasses = {
  2: "sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0",
  3: "sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0",
  4: "sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0",
};

export function ChoiceRail<
  TValue extends string,
  TOption extends ChoiceRailOption<TValue> = ChoiceRailOption<TValue>,
>({
  value,
  options,
  onChange,
  label,
  size = "sm",
  desktopColumns = 3,
  renderPreview,
  getDescription,
  className,
  railClassName,
  optionClassName,
  "data-testid": testId,
  railTestId,
}: ChoiceRailProps<TValue, TOption>) {
  const generatedId = useId();
  const descriptionId = `${generatedId}-description`;
  const railRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<TValue, HTMLButtonElement>());
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];
  const selectedDescription = selectedOption
    ? getDescription?.(selectedOption, true)
    : null;

  useEffect(() => {
    const rail = railRef.current;
    const selectedButton = buttonRefs.current.get(value);
    if (!rail || !selectedButton) return;

    const railBox = rail.getBoundingClientRect();
    const buttonBox = selectedButton.getBoundingClientRect();
    const leftOverflow = buttonBox.left - railBox.left;
    const rightOverflow = buttonBox.right - railBox.right;

    if (leftOverflow < 0) {
      rail.scrollBy({ left: leftOverflow });
      return;
    }

    if (rightOverflow > 0) {
      rail.scrollBy({ left: rightOverflow });
    }
  }, [value]);

  const moveSelection = (currentValue: TValue, direction: 1 | -1) => {
    const currentIndex = options.findIndex(
      (option) => option.value === currentValue
    );
    if (currentIndex < 0) return;

    for (let offset = 1; offset <= options.length; offset += 1) {
      const nextIndex =
        (currentIndex + offset * direction + options.length) % options.length;
      const nextOption = options[nextIndex];

      if (!nextOption.disabled) {
        onChange(nextOption.value);
        window.requestAnimationFrame(() => {
          buttonRefs.current.get(nextOption.value)?.focus({ preventScroll: true });
        });
        return;
      }
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    option: TOption
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(option.value, 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(option.value, -1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      const firstOption = options.find((item) => !item.disabled);
      if (!firstOption) return;
      onChange(firstOption.value);
      window.requestAnimationFrame(() => {
        buttonRefs.current.get(firstOption.value)?.focus({ preventScroll: true });
      });
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastOption = [...options].reverse().find((item) => !item.disabled);
      if (!lastOption) return;
      onChange(lastOption.value);
      window.requestAnimationFrame(() => {
        buttonRefs.current.get(lastOption.value)?.focus({ preventScroll: true });
      });
    }
  };

  return (
    <fieldset className={cn("min-w-0 space-y-3", className)} data-testid={testId}>
      <legend className="text-sm font-medium text-slate-800">{label}</legend>
      <div
        ref={railRef}
        role="radiogroup"
        aria-label={label}
        aria-describedby={selectedDescription ? descriptionId : undefined}
        className={cn(
          "flex min-w-0 gap-2 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory]",
          desktopColumnClasses[desktopColumns],
          size === "lg" && "gap-3",
          railClassName
        )}
        data-testid={railTestId}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const preview = renderPreview?.(option, isSelected);

          return (
            <button
              key={option.value}
              ref={(node) => {
                if (node) {
                  buttonRefs.current.set(option.value, node);
                } else {
                  buttonRefs.current.delete(option.value);
                }
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.ariaLabel ?? option.label}
              disabled={option.disabled}
              tabIndex={isSelected || (!value && option === options[0]) ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, option)}
              className={cn(
                "group relative flex snap-start flex-col rounded-lg border text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                sizeClasses[size],
                isSelected
                  ? "border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50",
                optionClassName
              )}
            >
              {preview && <span className="mb-2 block grow">{preview}</span>}
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {option.label}
                </span>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isSelected
                      ? "border-sky-700 bg-sky-700 text-white"
                      : "border-slate-200 bg-white text-transparent group-hover:border-sky-300"
                  )}
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {selectedDescription && (
        <p id={descriptionId} className="text-sm leading-5 text-slate-600">
          {selectedDescription}
        </p>
      )}
    </fieldset>
  );
}
