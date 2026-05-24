import type { QRDesignConfig } from "@/server/qr/schemas";

export interface QRDesignWarning {
  readonly code:
    | "LOW_CONTRAST"
    | "QUIET_ZONE_TOO_SMALL"
    | "LOGO_TOO_LARGE"
    | "LOW_ERROR_CORRECTION_WITH_LOGO";
  readonly message: string;
  readonly severity: "warning";
}

export function getQRDesignWarnings(
  design: QRDesignConfig
): QRDesignWarning[] {
  return [
    getContrastWarning(design),
    getQuietZoneWarning(design),
    getLogoSizeWarning(design),
    getLogoErrorCorrectionWarning(design),
  ].filter((warning): warning is QRDesignWarning => Boolean(warning));
}

function getContrastWarning(
  design: QRDesignConfig
): QRDesignWarning | null {
  const contrastRatio = getContrastRatio(
    design.foregroundColor,
    design.backgroundColor
  );

  if (contrastRatio >= 4.5) return null;

  return {
    code: "LOW_CONTRAST",
    severity: "warning",
    message:
      "Foreground and background colors may not have enough contrast for reliable scanning.",
  };
}

function getQuietZoneWarning(
  design: QRDesignConfig
): QRDesignWarning | null {
  if (design.margin >= 4) return null;

  return {
    code: "QUIET_ZONE_TOO_SMALL",
    severity: "warning",
    message:
      "QR quiet zone is smaller than recommended. Use margin 4 or higher for reliable scanning.",
  };
}

function getLogoSizeWarning(
  design: QRDesignConfig
): QRDesignWarning | null {
  if (design.logoSizeRatio <= 0.26) return null;

  return {
    code: "LOGO_TOO_LARGE",
    severity: "warning",
    message:
      "Logo size is above 26% of the QR area and may cover required modules.",
  };
}

function getLogoErrorCorrectionWarning(
  design: QRDesignConfig
): QRDesignWarning | null {
  if (
    design.logoSizeRatio <= 0 ||
    design.errorCorrectionLevel === "Q" ||
    design.errorCorrectionLevel === "H"
  ) {
    return null;
  }

  return {
    code: "LOW_ERROR_CORRECTION_WITH_LOGO",
    severity: "warning",
    message:
      "Use quartile or high error correction when adding a logo to improve scan reliability.",
  };
}

function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color: string): number {
  const [red, green, blue] = parseHexColor(color).map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function parseHexColor(color: string): [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}
