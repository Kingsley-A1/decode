import "server-only";

import QRCode from "qrcode";
import { captionToPathData } from "@/server/qr/font";
import type { QRDesignConfig } from "@/server/qr/schemas";

export interface StyledQRLogo {
  /** A `data:` URL for the logo image (png/jpeg/webp/svg). */
  readonly dataUrl: string;
}

export interface BuildQRRenderPlanInput {
  readonly value: string;
  readonly design: QRDesignConfig;
  readonly logo?: StyledQRLogo | null;
  readonly title?: string;
}

/** Data modules, drawn in the QR foreground color inherited from the group. */
export type QRModuleShape =
  | {
      readonly kind: "module-rect";
      readonly x: number;
      readonly y: number;
      readonly radius: number;
    }
  | { readonly kind: "module-dot"; readonly cx: number; readonly cy: number };

/** Self-colored shapes: finder eyes, frame chrome, captions, and the logo. */
export type QRFilledShape =
  | {
      readonly kind: "eye-circle";
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
      readonly fill: string;
    }
  | {
      readonly kind: "plain-rect";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly radius: number;
      readonly fill: string;
    }
  | {
      readonly kind: "stroked-rect";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly radius: number;
      readonly fill: string;
      readonly stroke: string;
      readonly strokeWidth: number;
    }
  | {
      readonly kind: "caption";
      /** Glyph outlines as SVG path data, so captions need no runtime font. */
      readonly d: string;
      readonly fill: string;
      /** Source text, preserved for the accessible name of the rendered path. */
      readonly label: string;
    }
  | {
      readonly kind: "logo-image";
      readonly dataUrl: string;
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    };

/** The QR matrix block placed (translated + scaled) inside the document. */
export interface QRPlacement {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  /** Side of the matrix block in module units, quiet zone included. */
  readonly dim: number;
  readonly background: string;
  readonly foreground: string;
  readonly modules: readonly QRModuleShape[];
  readonly eyes: readonly QRFilledShape[];
  readonly logo: readonly QRFilledShape[];
}

/**
 * Renderer-agnostic description of a styled QR export. The SVG serializer
 * (`server/qr/svg.ts`) and the vector PDF writer (`server/qr/pdf.ts`) both
 * consume this plan, so the geometry math lives in exactly one place.
 */
export interface QRRenderPlan {
  readonly width: number;
  readonly height: number;
  /** Frame chrome drawn beneath the QR block. */
  readonly underlay: readonly QRFilledShape[];
  readonly qr: QRPlacement;
  /** Frame chrome drawn above the QR block. */
  readonly overlay: readonly QRFilledShape[];
}

const FINDER_SIZE = 7;

export function buildQRRenderPlan(input: BuildQRRenderPlanInput): QRRenderPlan {
  const { design } = input;
  const matrix = QRCode.create(input.value, {
    errorCorrectionLevel: design.errorCorrectionLevel,
  }).modules;
  const moduleCount = matrix.size;
  const quietZone = clampQuietZone(design.margin);
  const dim = moduleCount + quietZone * 2;

  const block = {
    dim,
    background: design.backgroundColor,
    foreground: design.foregroundColor,
    modules: buildModuleShapes({
      matrix,
      moduleCount,
      quietZone,
      dotStyle: design.dotStyle,
    }),
    eyes: buildEyeShapes({
      moduleCount,
      quietZone,
      cornerStyle: design.cornerStyle,
      foreground: design.foregroundColor,
      background: design.backgroundColor,
    }),
    logo: buildLogoShapes({
      logo: input.logo,
      logoSizeRatio: design.logoSizeRatio,
      moduleCount,
      quietZone,
      background: design.backgroundColor,
    }),
  };

  return composeWithFrame({ block, dim, design, title: input.title });
}

function clampQuietZone(margin: number): number {
  if (!Number.isFinite(margin)) return 4;

  return Math.min(Math.max(Math.round(margin), 0), 16);
}

function buildModuleShapes({
  matrix,
  moduleCount,
  quietZone,
  dotStyle,
}: {
  readonly matrix: { get(row: number, col: number): number };
  readonly moduleCount: number;
  readonly quietZone: number;
  readonly dotStyle: QRDesignConfig["dotStyle"];
}): QRModuleShape[] {
  const shapes: QRModuleShape[] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!matrix.get(row, col)) continue;
      if (isFinderModule(row, col, moduleCount)) continue;

      shapes.push(moduleShape(dotStyle, col + quietZone, row + quietZone));
    }
  }

  return shapes;
}

function isFinderModule(
  row: number,
  col: number,
  moduleCount: number
): boolean {
  const inTopLeft = row < FINDER_SIZE && col < FINDER_SIZE;
  const inTopRight = row < FINDER_SIZE && col >= moduleCount - FINDER_SIZE;
  const inBottomLeft = row >= moduleCount - FINDER_SIZE && col < FINDER_SIZE;

  return inTopLeft || inTopRight || inBottomLeft;
}

function moduleShape(
  dotStyle: QRDesignConfig["dotStyle"],
  x: number,
  y: number
): QRModuleShape {
  if (dotStyle === "dots") {
    // Fill the cell (diameter 1) so the dot style keeps enough dark area to
    // stay reliably scannable while still reading as separated dots.
    return { kind: "module-dot", cx: x + 0.5, cy: y + 0.5 };
  }

  const radius =
    dotStyle === "rounded"
      ? 0.25
      : dotStyle === "classy"
        ? 0.4
        : dotStyle === "extra-rounded"
          ? 0.5
          : 0;

  return { kind: "module-rect", x, y, radius };
}

function buildEyeShapes({
  moduleCount,
  quietZone,
  cornerStyle,
  foreground,
  background,
}: {
  readonly moduleCount: number;
  readonly quietZone: number;
  readonly cornerStyle: QRDesignConfig["cornerStyle"];
  readonly foreground: string;
  readonly background: string;
}): QRFilledShape[] {
  const origins: ReadonlyArray<readonly [number, number]> = [
    [quietZone, quietZone],
    [quietZone, quietZone + moduleCount - FINDER_SIZE],
    [quietZone + moduleCount - FINDER_SIZE, quietZone],
  ];

  return origins.flatMap(([y, x]) =>
    eye(x, y, cornerStyle, foreground, background)
  );
}

function eye(
  x: number,
  y: number,
  cornerStyle: QRDesignConfig["cornerStyle"],
  foreground: string,
  background: string
): QRFilledShape[] {
  if (cornerStyle === "dot") {
    const cx = x + 3.5;
    const cy = y + 3.5;

    return [
      { kind: "eye-circle", cx, cy, r: 3.5, fill: foreground },
      { kind: "eye-circle", cx, cy, r: 2.5, fill: background },
      { kind: "eye-circle", cx, cy, r: 1.5, fill: foreground },
    ];
  }

  const isRounded = cornerStyle === "rounded";
  const outerRadius = isRounded ? 1.75 : 0;
  const middleRadius = isRounded ? 1.2 : 0;
  const innerRadius = isRounded ? 0.85 : 0;

  return [
    plainRect(x, y, 7, 7, outerRadius, foreground),
    plainRect(x + 1, y + 1, 5, 5, middleRadius, background),
    plainRect(x + 2, y + 2, 3, 3, innerRadius, foreground),
  ];
}

function buildLogoShapes({
  logo,
  logoSizeRatio,
  moduleCount,
  quietZone,
  background,
}: {
  readonly logo: StyledQRLogo | null | undefined;
  readonly logoSizeRatio: number;
  readonly moduleCount: number;
  readonly quietZone: number;
  readonly background: string;
}): QRFilledShape[] {
  if (!logo || logoSizeRatio <= 0) return [];

  const logoSide = logoSizeRatio * moduleCount;
  const center = quietZone + moduleCount / 2;
  // Clear a slightly larger area behind the logo so it reads cleanly. The QR's
  // error correction covers the obscured modules.
  const clearSide = logoSide + 2;
  const clearX = center - clearSide / 2;
  const clearY = center - clearSide / 2;
  const logoX = center - logoSide / 2;
  const logoY = center - logoSide / 2;

  return [
    plainRect(clearX, clearY, clearSide, clearSide, 1, background),
    {
      kind: "logo-image",
      dataUrl: logo.dataUrl,
      x: logoX,
      y: logoY,
      width: logoSide,
      height: logoSide,
    },
  ];
}

function composeWithFrame({
  block,
  dim,
  design,
  title,
}: {
  readonly block: Omit<QRPlacement, "x" | "y" | "scale">;
  readonly dim: number;
  readonly design: QRDesignConfig;
  readonly title?: string;
}): QRRenderPlan {
  const qrPx = clampSize(design.size);
  const scale = qrPx / dim;
  const accent = design.frameColor;
  const frameStyle = design.frameStyle;

  if (frameStyle === "none") {
    return {
      width: qrPx,
      height: qrPx,
      underlay: [],
      qr: { ...block, x: 0, y: 0, scale },
      overlay: [],
    };
  }

  const border = Math.max(Math.round(qrPx * 0.022), 6);
  const pad = Math.round(qrPx * 0.045);
  const captionHeight = Math.round(qrPx * 0.15);
  const radius = 0;
  const fontSize = Math.round(captionHeight * 0.4);
  const gap = border + pad;
  const caption = getFrameCaption(frameStyle, title);

  // Layouts share a white card with the accent expressed differently per style.
  if (frameStyle === "classic") {
    const width = qrPx + gap * 2;
    const height = captionHeight + qrPx + gap * 2;

    return {
      width,
      height,
      underlay: [
        strokedRect(0, 0, width, height, radius, "#FFFFFF", accent, border),
        plainRect(
          border,
          border,
          width - border * 2,
          captionHeight,
          0,
          accent
        ),
        captionShape(width / 2, border + captionHeight / 2, caption, fontSize, "#FFFFFF"),
      ],
      qr: { ...block, x: gap, y: border + captionHeight + pad, scale },
      overlay: [],
    };
  }

  if (frameStyle === "badge") {
    const width = qrPx + gap * 2;
    const height = qrPx + gap * 2 + captionHeight;

    return {
      width,
      height,
      underlay: [
        strokedRect(0, 0, width, height, radius, accentSoft(accent), accent, 2),
        strokedRect(
          gap - pad / 2,
          gap - pad / 2,
          qrPx + pad,
          qrPx + pad,
          0,
          "#FFFFFF",
          accent,
          2
        ),
      ],
      qr: { ...block, x: gap, y: gap, scale },
      overlay: [
        captionShape(
          width / 2,
          gap + qrPx + captionHeight / 2,
          caption,
          fontSize,
          accent
        ),
      ],
    };
  }

  if (frameStyle === "minimal") {
    const width = qrPx + gap * 2;
    const height = captionHeight + qrPx + gap * 2;

    return {
      width,
      height,
      underlay: [
        strokedRect(0, 0, width, height, radius, "#FFFFFF", accentSoft(accent), 2),
        captionShape(width / 2, border + captionHeight / 2, caption, fontSize, accent),
      ],
      qr: { ...block, x: gap, y: captionHeight + gap, scale },
      overlay: [],
    };
  }

  // scan-me and ticket: QR on top, accent caption below.
  const width = qrPx + gap * 2;
  const height = qrPx + gap * 2 + captionHeight;
  const chipWidth = Math.round(qrPx * 0.5);
  const chipHeight = Math.round(captionHeight * 0.78);

  return {
    width,
    height,
    underlay: [
      strokedRect(0, 0, width, height, radius, "#FFFFFF", accent, border),
    ],
    qr: { ...block, x: gap, y: gap, scale },
    overlay: [
      strokedRect(
        (width - chipWidth) / 2,
        gap + qrPx + (captionHeight - chipHeight) / 2,
        chipWidth,
        chipHeight,
        0,
        accent,
        accent,
        0
      ),
      captionShape(
        width / 2,
        gap + qrPx + captionHeight / 2,
        caption,
        fontSize,
        "#FFFFFF"
      ),
    ],
  };
}

function plainRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string
): QRFilledShape {
  return { kind: "plain-rect", x, y, width, height, radius, fill };
}

/**
 * Rect drawn through the stroked emitter. SVG strokes are centered on the
 * path, so the drawn rect is inset by half the stroke width and shrunk by a
 * full stroke width — precomputed here so the PDF writer draws the exact same
 * geometry with a centered line width.
 */
function strokedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): QRFilledShape {
  const inset = strokeWidth / 2;

  return {
    kind: "stroked-rect",
    x: x + inset,
    y: y + inset,
    width: width - strokeWidth,
    height: height - strokeWidth,
    radius,
    fill,
    stroke,
    strokeWidth,
  };
}

// Matches the tracking the previous `<text>` caption applied via
// `letter-spacing`, now baked into the glyph layout.
const CAPTION_LETTER_SPACING = 0.5;

function captionShape(
  centerX: number,
  centerY: number,
  text: string,
  fontSize: number,
  fill: string
): QRFilledShape {
  return {
    kind: "caption",
    d: captionToPathData({
      text,
      centerX,
      centerY,
      fontSize,
      letterSpacing: CAPTION_LETTER_SPACING,
    }),
    fill,
    label: text,
  };
}

function getFrameCaption(
  frameStyle: QRDesignConfig["frameStyle"],
  title?: string
): string {
  if (frameStyle === "scan-me" || frameStyle === "ticket") return "SCAN ME";
  if (frameStyle === "minimal") return "SCAN";

  const trimmed = (title ?? "").trim();
  if (!trimmed) return "SCAN ME";

  return trimmed.length > 24 ? `${trimmed.slice(0, 23)}…` : trimmed;
}

function accentSoft(hex: string): string {
  // 10% accent over white, computed so the soft plate reads as a tint.
  const [r, g, b] = parseHex(hex);
  const mix = (channel: number) => Math.round(channel * 0.1 + 255 * 0.9);

  return rgbToHex(mix(r), mix(g), mix(b));
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");

  return [
    Number.parseInt(value.slice(0, 2), 16) || 0,
    Number.parseInt(value.slice(2, 4), 16) || 0,
    Number.parseInt(value.slice(4, 6), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    Math.min(Math.max(channel, 0), 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clampSize(size: number): number {
  if (!Number.isFinite(size)) return 1024;

  return Math.min(Math.max(Math.round(size), 128), 4096);
}
