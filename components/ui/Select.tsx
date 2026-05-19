import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Select({
  id,
  label,
  hint,
  error,
  className,
  containerClassName,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-800">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-950 shadow-sm transition-colors focus:border-sky-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm",
          error && "border-rose-300 focus:border-rose-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && (
        <p id={hintId} className="text-sm leading-5 text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm leading-5 text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
