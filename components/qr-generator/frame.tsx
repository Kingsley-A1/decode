import { ChoiceRail } from "@/components/ui";
import {
  frameOptions,
  initialDesignState,
  thumbnailQrActiveCells,
} from "./constants";
import { getSafeHex, hexToRgba } from "./design";
import { getShortFrameTitle } from "./labels";
import type { FrameStyle } from "./types";

export function FramePicker({
  value,
  frameColor,
  onChange,
}: {
  readonly value: FrameStyle;
  readonly frameColor: string;
  readonly onChange: (value: FrameStyle) => void;
}) {
  return (
    <ChoiceRail
      value={value}
      options={frameOptions.map((option) => ({
        value: option.value,
        label: option.label,
        ariaLabel: `Select ${option.label} frame`,
      }))}
      onChange={onChange}
      label="QR frame"
      size="frame"
      layout="horizontal"
      desktopColumns={3}
      data-testid="frame-picker"
      railTestId="frame-picker-rail"
      railClassName="pb-3"
      renderPreview={(option) => (
        <FrameThumbnail
          frameStyle={option.value as FrameStyle}
          frameColor={frameColor}
        />
      )}
      getDescription={(option) => {
        const frameOption = frameOptions.find(
          (item) => item.value === option.value
        );

        return (
          <>
            <span className="font-medium text-slate-800">
              {frameOption?.label ?? option.label}:
            </span>{" "}
            {frameOption?.description} Best for{" "}
            {frameOption?.bestFor.toLowerCase()}.
          </>
        );
      }}
    />
  );
}

function FrameThumbnail({
  frameStyle,
  frameColor,
}: {
  readonly frameStyle: FrameStyle;
  readonly frameColor: string;
}) {
  return (
    <div className="flex h-20 items-center justify-center overflow-hidden border border-slate-100 bg-white p-1.5">
      <QRFrame
        frameStyle={frameStyle}
        frameColor={frameColor}
        title="Scan me"
        isThumbnail
      >
        <MiniQRCode />
      </QRFrame>
    </div>
  );
}

function MiniQRCode() {
  return (
    <div className="grid aspect-square w-full grid-cols-9 gap-0.5 bg-white p-1 shadow-sm ring-1 ring-slate-100">
      {Array.from({ length: 81 }, (_, index) => (
        <span
          key={index}
          className={
            thumbnailQrActiveCells.has(index) ? "bg-slate-950" : "bg-slate-100"
          }
        />
      ))}
    </div>
  );
}

export function QRFrame({
  frameStyle,
  frameColor,
  title,
  isThumbnail = false,
  children,
}: {
  readonly frameStyle: FrameStyle;
  readonly frameColor: string;
  readonly title: string;
  readonly isThumbnail?: boolean;
  readonly children: React.ReactNode;
}) {
  const safeTitle = title.trim() || "Scan me";
  const displayTitle = getShortFrameTitle(safeTitle);
  const accentColor = getSafeHex(frameColor, initialDesignState.frameColor);
  const accentSoft = hexToRgba(accentColor, 0.1);
  const accentSofter = hexToRgba(accentColor, 0.06);
  const qrSlotClass = isThumbnail
    ? "mx-auto w-11"
    : "mx-auto w-[84%] max-w-[208px]";
  const frameWidthClass = isThumbnail
    ? "w-full max-w-[104px]"
    : "w-full max-w-[248px]";

  if (frameStyle === "none") {
    return (
      <div
        className={
          isThumbnail
            ? "mx-auto w-14 bg-white p-1 ring-1 ring-slate-100"
            : "mx-auto w-full max-w-[232px] bg-white p-1 ring-1 ring-slate-100"
        }
      >
        {children}
      </div>
    );
  }

  if (frameStyle === "scan-me") {
    return (
      <div
        className={`${frameWidthClass} mx-auto border-4 bg-white text-center shadow-sm`}
        style={{ borderColor: accentColor }}
      >
        <div className={isThumbnail ? "px-3 pt-2" : "px-4 pt-4"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
        <p
          className={
            isThumbnail
              ? "mx-auto my-1 inline-flex px-2 py-0.5 text-[7px] font-semibold uppercase"
              : "mx-auto my-2.5 inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-normal"
          }
          style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
        >
          Scan me
        </p>
      </div>
    );
  }

  if (frameStyle === "classic") {
    return (
      <div
        className={`${frameWidthClass} mx-auto overflow-hidden border-4 bg-white text-center shadow-sm`}
        style={{ borderColor: accentColor }}
      >
        <p
          title={safeTitle}
          className={
            isThumbnail
              ? "truncate px-3 py-1 text-[7px] font-bold uppercase"
              : "truncate px-5 py-2 text-xs font-bold uppercase tracking-normal"
          }
          style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
        >
          {displayTitle}
        </p>
        <div className={isThumbnail ? "p-2" : "p-4"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
      </div>
    );
  }

  if (frameStyle === "ticket") {
    return (
      <div
        className={`${frameWidthClass} mx-auto border-4 bg-white text-center shadow-sm`}
        style={{ borderColor: accentColor }}
      >
        <div className={isThumbnail ? "px-3 pt-2" : "px-4 pt-4"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
        <span
          className={
            isThumbnail
              ? "mx-auto block h-0 w-0 border-x-[7px] border-b-[7px] border-x-transparent"
              : "mx-auto block h-0 w-0 border-x-[11px] border-b-[11px] border-x-transparent"
          }
          style={{ borderBottomColor: accentColor }}
          aria-hidden="true"
        />
        <p
          className={
            isThumbnail
              ? "px-3 py-1 text-[7px] font-bold uppercase"
              : "px-5 py-2 text-[11px] font-bold uppercase tracking-normal"
          }
          style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
        >
          Scan me
        </p>
      </div>
    );
  }

  if (frameStyle === "badge") {
    return (
      <div
        className={`${frameWidthClass} mx-auto border bg-white text-center shadow-sm`}
        style={{ borderColor: accentSoft, backgroundColor: accentSofter }}
      >
        <div className={isThumbnail ? "p-2 pb-1" : "p-4 pb-2"}>
          <div
            className="bg-white p-2 ring-1"
            style={{ boxShadow: `inset 0 0 0 1px ${accentSoft}` }}
          >
            <div className={qrSlotClass}>{children}</div>
          </div>
        </div>
        <p
          title={safeTitle}
          className={
            isThumbnail
              ? "truncate px-3 pb-2 text-[7px] font-bold uppercase"
              : "truncate px-4 pb-3 text-xs font-bold uppercase"
          }
          style={{ color: accentColor }}
        >
          {displayTitle}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${frameWidthClass} mx-auto border bg-white text-center shadow-sm`}
      style={{ borderColor: accentSoft }}
    >
      <p
        className={
          isThumbnail
            ? "px-3 pt-2 text-[7px] font-bold uppercase"
            : "px-5 pt-4 text-[11px] font-bold uppercase tracking-normal"
        }
        style={{ color: accentColor }}
      >
        Scan
      </p>
      <div className={isThumbnail ? "p-2 pt-1" : "p-4 pt-2"}>
        <div className={qrSlotClass}>{children}</div>
      </div>
    </div>
  );
}
