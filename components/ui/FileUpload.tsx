import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  error?: string;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  function FileUpload(
    { id, label, hint, error, className, ...props },
    ref
  ) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        type="file"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full cursor-pointer rounded-lg border border-slate-200 bg-white text-sm text-slate-700 shadow-sm file:mr-4 file:min-h-11 file:border-0 file:bg-sky-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-sky-800 hover:file:bg-sky-100",
          error && "border-rose-300",
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
);
