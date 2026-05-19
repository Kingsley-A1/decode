import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  leftIcon,
  rightSlot,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-950 shadow-sm transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm",
            leftIcon && "pl-10",
            rightSlot && "pr-11",
            error && "border-rose-300 focus:border-rose-500",
            className
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
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
