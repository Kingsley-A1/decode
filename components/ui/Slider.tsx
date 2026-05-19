import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  valueLabel?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function Slider({
  id,
  label,
  valueLabel,
  minLabel,
  maxLabel,
  className,
  ...props
}: SliderProps) {
  const generatedId = useId();
  const sliderId = id ?? generatedId;

  return (
    <div className="space-y-2">
      <label
        htmlFor={sliderId}
        className="flex items-center justify-between gap-3 text-sm font-medium text-slate-800"
      >
        <span>{label}</span>
        {valueLabel && <span className="text-slate-600">{valueLabel}</span>}
      </label>
      <input
        id={sliderId}
        type="range"
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-sky-600",
          className
        )}
        {...props}
      />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-slate-600">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
