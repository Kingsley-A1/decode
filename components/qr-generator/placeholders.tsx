import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  getScanabilityBadgeVariant,
  getScanabilityIconClassName,
  getScanabilityPanelClassName,
} from "./scanability";
import type { LogoChoiceOption, QRMode, ScanabilityResult } from "./types";

export function QRPayloadPlaceholder({
  mode,
  compact = false,
}: {
  readonly mode: QRMode;
  readonly compact?: boolean;
}) {
  const isDynamic = mode === "dynamic";

  return (
    <div
      className={
        compact
          ? "flex aspect-square w-full min-w-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sky-700"
          : "flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center"
      }
      data-testid="qr-payload-placeholder"
    >
      <span
        className={
          compact
            ? "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
            : "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200"
        }
      >
        <AlertTriangle
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          aria-hidden="true"
        />
      </span>
      {!compact && (
        <>
          <p className="text-sm font-semibold text-slate-900">
            {isDynamic ? "Add destination" : "Add content"}
          </p>
          <p className="max-w-48 text-xs leading-5 text-slate-600">
            {isDynamic
              ? "Enter a valid destination URL to preview before publishing."
              : "Complete the content step to render a QR preview."}
          </p>
        </>
      )}
    </div>
  );
}

export function LogoChoicePreview({
  option,
}: {
  readonly option: LogoChoiceOption;
}) {
  const Icon = option.icon;
  const isNone = option.value === "none";

  return (
    <span
      className={[
        "mx-auto flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm",
        isNone
          ? "border-slate-200 bg-white text-slate-600"
          : "border-slate-200 bg-white",
      ].join(" ")}
      style={isNone ? undefined : { color: option.iconColor ?? option.color }}
      aria-hidden="true"
    >
      {option.logoAssetPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.logoAssetPath}
          alt=""
          className="h-8 w-8 object-contain"
          loading="lazy"
        />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </span>
  );
}

export function ScanabilityMeter({
  scanability,
}: {
  readonly scanability: ScanabilityResult;
}) {
  const isReady = scanability.state === "ready";
  const icon = isReady ? (
    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
  ) : (
    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
  );

  return (
    <section
      aria-live="polite"
      aria-label="Scanability meter"
      className={`rounded-xl border p-4 ${getScanabilityPanelClassName(
        scanability.state
      )}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={`mt-0.5 shrink-0 ${getScanabilityIconClassName(
              scanability.state
            )}`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {scanability.label}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-700">
              {scanability.description}
            </p>
          </div>
        </div>
        <Badge
          variant={getScanabilityBadgeVariant(scanability.state)}
          className="self-start"
        >
          {scanability.label}
        </Badge>
      </div>
      {scanability.reasons.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm leading-5 text-slate-700">
          {scanability.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true">-</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
