import { frameOptions, typeOptions } from "./constants";
import type { FrameStyle, QRType } from "./types";

export function getTypeLabel(type: QRType): string {
  return typeOptions.find((option) => option.value === type)?.label ?? type;
}

export function getFrameLabel(frameStyle: FrameStyle): string {
  return (
    frameOptions.find((option) => option.value === frameStyle)?.label ??
    frameStyle
  );
}

export function getFrameExportLabel(frameStyle: FrameStyle): string {
  if (frameStyle === "none") return "No frame";

  return `${getFrameLabel(frameStyle)} frame`;
}

export function getShortFrameTitle(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= 28) return normalizedValue;

  return `${normalizedValue.slice(0, 25)}...`;
}
