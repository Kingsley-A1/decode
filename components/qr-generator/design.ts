import type { QROptions } from "@/hooks/useQRCode";
import { initialDesignState } from "./constants";
import type { CornerStyle, DesignState } from "./types";

export function getCornerSquareType(
  cornerStyle: CornerStyle
): QROptions["cornersSquareType"] {
  if (cornerStyle === "rounded") return "extra-rounded";
  if (cornerStyle === "dot") return "dot";

  return "square";
}

export function normalizeHexDraft(value: string): string {
  const sanitizedValue = value.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(sanitizedValue)) return sanitizedValue;

  return sanitizedValue.startsWith("#") ? sanitizedValue : `#${sanitizedValue}`;
}

export function getSafeHex(value: string, fallback: string): string {
  const normalizedValue = normalizeHexDraft(value);

  return isValidHexColor(normalizedValue) ? normalizedValue : fallback;
}

export function hexToRgba(value: string, alpha: number): string {
  const safeValue = getSafeHex(value, initialDesignState.frameColor);
  const red = Number.parseInt(safeValue.slice(1, 3), 16);
  const green = Number.parseInt(safeValue.slice(3, 5), 16);
  const blue = Number.parseInt(safeValue.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function getContrastRatio(foreground: string, background: string): number {
  if (!isValidHexColor(foreground) || !isValidHexColor(background)) {
    return 1;
  }

  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getRelativeLuminance(color: string): number {
  const [red, green, blue] = [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getApiDesign(design: DesignState, logoUrl: string) {
  const hasLogo = Boolean(logoUrl);

  return {
    foregroundColor: getSafeHex(
      design.foregroundColor,
      initialDesignState.foregroundColor
    ),
    backgroundColor: getSafeHex(
      design.backgroundColor,
      initialDesignState.backgroundColor
    ),
    frameColor: getSafeHex(design.frameColor, initialDesignState.frameColor),
    margin: design.margin,
    logoSizeRatio: hasLogo ? design.logoSizeRatio : 0,
    dotStyle: design.dotStyle,
    cornerStyle: design.cornerStyle,
    errorCorrectionLevel: design.errorCorrectionLevel,
    size: design.size,
    frameStyle: design.frameStyle,
    ...(hasLogo ? { logo: logoUrl } : {}),
  };
}
