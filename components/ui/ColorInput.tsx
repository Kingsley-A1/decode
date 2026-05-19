import { useId } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
}

export function ColorInput({
  label,
  value,
  onChange,
  hint,
  className,
}: ColorInputProps) {
  const generatedId = useId();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-[4rem,1fr]", className)}>
      <div className="space-y-2">
        <label
          htmlFor={`${generatedId}-picker`}
          className="text-sm font-medium text-slate-800"
        >
          Color
        </label>
        <input
          id={`${generatedId}-picker`}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          aria-label={`${label} color picker`}
        />
      </div>
      <Input
        id={`${generatedId}-hex`}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        hint={hint}
        inputMode="text"
      />
    </div>
  );
}
