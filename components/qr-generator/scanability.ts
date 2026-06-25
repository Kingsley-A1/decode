import { defaultLogoSizeRatio } from "./constants";
import {
  getContrastRatio,
  getRelativeLuminance,
  isValidHexColor,
} from "./design";
import type { DesignState, ScanabilityResult, ScanabilityState } from "./types";

export function getScanability({
  design,
  hasLogo,
}: {
  readonly design: DesignState;
  readonly hasLogo: boolean;
}): ScanabilityResult {
  const reasons: string[] = [];
  let isBlocked = false;
  const hasValidColors =
    isValidHexColor(design.foregroundColor) &&
    isValidHexColor(design.backgroundColor);

  if (!hasValidColors) {
    isBlocked = true;
    reasons.push("Enter valid 6-digit foreground and background hex colors.");
  } else {
    const contrastRatio = getContrastRatio(
      design.foregroundColor,
      design.backgroundColor
    );

    if (contrastRatio < 2) {
      isBlocked = true;
      reasons.push(
        "Increase foreground and background contrast before publishing."
      );
    } else if (contrastRatio < 3) {
      reasons.push(
        "Increase color contrast for more reliable scanning in low light."
      );
    }

    // Many scanners assume dark modules on a light background. An inverted code
    // can pass the absolute contrast check yet still fail to scan, so flag it.
    const foregroundLuminance = getRelativeLuminance(design.foregroundColor);
    const backgroundLuminance = getRelativeLuminance(design.backgroundColor);
    if (foregroundLuminance > backgroundLuminance) {
      reasons.push(
        "Use dark QR dots on a lighter background. Inverted codes scan unreliably on many readers."
      );
    }
  }

  if (design.margin < 2) {
    isBlocked = true;
    reasons.push("Increase the quiet zone (margin) before publishing.");
  } else if (design.margin < 4) {
    reasons.push("Quiet zone is small. Increase the margin for safer scanning.");
  }

  if (hasLogo && design.logoSizeRatio > 0.3) {
    isBlocked = true;
    reasons.push("Reduce logo size below 30% so it does not cover QR modules.");
  } else if (hasLogo && design.logoSizeRatio > defaultLogoSizeRatio) {
    reasons.push("Logo size is above 26% and may cover required QR modules.");
  }

  if (hasLogo && !["Q", "H"].includes(design.errorCorrectionLevel)) {
    reasons.push("Use quartile or high error correction when adding a logo.");
  }

  if (isBlocked) {
    return {
      state: "blocked",
      label: "Blocked for publish",
      description: "Resolve the required scanability fixes before publishing.",
      reasons,
      blocksPublish: true,
    };
  }

  if (reasons.length > 0) {
    return {
      state: "needs-attention",
      label: "Needs attention",
      description: "The QR can be exported, but these settings should be fixed.",
      reasons,
      blocksPublish: false,
    };
  }

  return {
    state: "ready",
    label: "Ready",
    description: "Design passes current scanability checks.",
    reasons,
    blocksPublish: false,
  };
}

export function getScanabilityBadgeVariant(
  state: ScanabilityState
): "success" | "warning" | "danger" {
  if (state === "blocked") return "danger";
  if (state === "needs-attention") return "warning";

  return "success";
}

export function getScanabilityPanelClassName(state: ScanabilityState): string {
  if (state === "blocked") return "border-rose-200 bg-rose-50";
  if (state === "needs-attention") return "border-amber-200 bg-amber-50";

  return "border-emerald-200 bg-emerald-50";
}

export function getScanabilityIconClassName(state: ScanabilityState): string {
  if (state === "blocked") return "text-rose-700";
  if (state === "needs-attention") return "text-amber-700";

  return "text-emerald-700";
}
