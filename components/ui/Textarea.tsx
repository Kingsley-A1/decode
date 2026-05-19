import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  id,
  label,
  hint,
  error,
  className,
  containerClassName,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-800">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-base leading-6 text-slate-950 shadow-sm transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm",
          error && "border-rose-300 focus:border-rose-500",
          className
        )}
        {...props}
      />
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
