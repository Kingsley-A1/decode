import "server-only";

import QRCode from "qrcode";
import type { QRDesignConfig } from "@/server/qr/schemas";

export interface StyledQRLogo {
  /** A `data:` URL for the logo image (png/jpeg/webp/svg). */
  readonly dataUrl: string;
}

export interface BuildStyledQRSvgInput {
  readonly value: string;
  readonly design: QRDesignConfig;
  readonly logo?: StyledQRLogo | null;
  readonly title?: string;
}

const FINDER_SIZE = 7;

/**
 * Renders a fully styled QR code as an SVG string — honouring dot style,
 * corner (finder) style, colors, quiet zone, an optional centered logo, and
 * a frame. This is the single source of truth for exports so the downloaded
 * file matches the design the user selected.
 */
export function buildStyledQRSvg(input: BuildStyledQRSvgInput): string {
  const { design } = input;
  const matrix = QRCode.create(input.value, {
    errorCorrectionLevel: design.errorCorrectionLevel,
  }).modules;
  const moduleCount = matrix.size;
  const quietZone = clampQuietZone(design.margin);
  const dim = moduleCount + quietZone * 2;

  const foreground = design.foregroundColor;
  const background = design.backgroundColor;

  const body = buildBodyModules({
    matrix,
    moduleCount,
    quietZone,
    dotStyle: design.dotStyle,
  });
  const eyes = buildEyes({
    moduleCount,
    quietZone,
    cornerStyle: design.cornerStyle,
    foreground,
    background,
  });
  const logo = buildLogoOverlay({
    logo: input.logo,
    logoSizeRatio: design.logoSizeRatio,
    moduleCount,
    quietZone,
    background,
  });

  const inner =
    `<rect width="${dim}" height="${dim}" fill="${background}"/>` +
    `<g fill="${foreground}">${body}</g>` +
    eyes +
    logo;

  return composeWithFrame({
    inner,
    dim,
    design,
    title: input.title,
  });
}

function clampQuietZone(margin: number): number {
  if (!Number.isFinite(margin)) return 4;

  return Math.min(Math.max(Math.round(margin), 0), 16);
}

function buildBodyModules({
  matrix,
  moduleCount,
  quietZone,
  dotStyle,
}: {
  readonly matrix: { get(row: number, col: number): number };
  readonly moduleCount: number;
  readonly quietZone: number;
  readonly dotStyle: QRDesignConfig["dotStyle"];
}): string {
  const shapes: string[] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!matrix.get(row, col)) continue;
      if (isFinderModule(row, col, moduleCount)) continue;

      shapes.push(moduleShape(dotStyle, col + quietZone, row + quietZone));
    }
  }

  return shapes.join("");
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
): string {
  if (dotStyle === "dots") {
    // Fill the cell (diameter 1) so the dot style keeps enough dark area to
    // stay reliably scannable while still reading as separated dots.
    return `<circle cx="${n2(x + 0.5)}" cy="${n2(y + 0.5)}" r="0.5"/>`;
  }

  const radius =
    dotStyle === "rounded"
      ? 0.25
      : dotStyle === "classy"
        ? 0.4
        : dotStyle === "extra-rounded"
          ? 0.5
          : 0;

  return radius > 0
    ? `<rect x="${x}" y="${y}" width="1" height="1" rx="${radius}" ry="${radius}"/>`
    : `<rect x="${x}" y="${y}" width="1" height="1"/>`;
}

function buildEyes({
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
}): string {
  const origins: ReadonlyArray<readonly [number, number]> = [
    [quietZone, quietZone],
    [quietZone, quietZone + moduleCount - FINDER_SIZE],
    [quietZone + moduleCount - FINDER_SIZE, quietZone],
  ];

  return origins
    .map(([y, x]) => eye(x, y, cornerStyle, foreground, background))
    .join("");
}

function eye(
  x: number,
  y: number,
  cornerStyle: QRDesignConfig["cornerStyle"],
  foreground: string,
  background: string
): string {
  if (cornerStyle === "dot") {
    const cx = x + 3.5;
    const cy = y + 3.5;

    return (
      `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${foreground}"/>` +
      `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${background}"/>` +
      `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${foreground}"/>`
    );
  }

  const isRounded = cornerStyle === "rounded";
  const outerRadius = isRounded ? 1.75 : 0;
  const middleRadius = isRounded ? 1.2 : 0;
  const innerRadius = isRounded ? 0.85 : 0;

  return (
    svgRect(x, y, 7, 7, outerRadius, foreground) +
    svgRect(x + 1, y + 1, 5, 5, middleRadius, background) +
    svgRect(x + 2, y + 2, 3, 3, innerRadius, foreground)
  );
}

function buildLogoOverlay({
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
}): string {
  if (!logo || logoSizeRatio <= 0) return "";

  const logoSide = logoSizeRatio * moduleCount;
  const center = quietZone + moduleCount / 2;
  // Clear a slightly larger area behind the logo so it reads cleanly. The QR's
  // error correction covers the obscured modules.
  const clearSide = logoSide + 2;
  const clearX = center - clearSide / 2;
  const clearY = center - clearSide / 2;
  const logoX = center - logoSide / 2;
  const logoY = center - logoSide / 2;

  return (
    svgRect(clearX, clearY, clearSide, clearSide, 1, background) +
    `<image href="${escapeAttribute(logo.dataUrl)}" ` +
    `x="${n2(logoX)}" y="${n2(logoY)}" ` +
    `width="${n2(logoSide)}" height="${n2(logoSide)}" ` +
    `preserveAspectRatio="xMidYMid meet"/>`
  );
}

function composeWithFrame({
  inner,
  dim,
  design,
  title,
}: {
  readonly inner: string;
  readonly dim: number;
  readonly design: QRDesignConfig;
  readonly title?: string;
}): string {
  const qrPx = clampSize(design.size);
  const scale = qrPx / dim;
  const accent = design.frameColor;
  const frameStyle = design.frameStyle;

  if (frameStyle === "none") {
    return svgDocument({
      width: qrPx,
      height: qrPx,
      content: placeQr({ inner, x: 0, y: 0, scale }),
    });
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
    const card = roundedRect(0, 0, width, height, radius, "#FFFFFF", accent, border);
    const bar =
      `<rect x="${border}" y="${border}" width="${width - border * 2}" height="${captionHeight}" fill="${accent}"/>` +
      centeredText(width / 2, border + captionHeight / 2, caption, fontSize, "#FFFFFF");
    const qr = placeQr({ inner, x: gap, y: border + captionHeight + pad, scale });

    return svgDocument({ width, height, content: card + bar + qr });
  }

  if (frameStyle === "badge") {
    const width = qrPx + gap * 2;
    const height = qrPx + gap * 2 + captionHeight;
    const card = roundedRect(0, 0, width, height, radius, accentSoft(accent), accent, 2);
    const plate = roundedRect(
      gap - pad / 2,
      gap - pad / 2,
      qrPx + pad,
      qrPx + pad,
      0,
      "#FFFFFF",
      accent,
      2
    );
    const qr = placeQr({ inner, x: gap, y: gap, scale });
    const label = centeredText(
      width / 2,
      gap + qrPx + captionHeight / 2,
      caption,
      fontSize,
      accent
    );

    return svgDocument({ width, height, content: card + plate + qr + label });
  }

  if (frameStyle === "minimal") {
    const width = qrPx + gap * 2;
    const height = captionHeight + qrPx + gap * 2;
    const card = roundedRect(0, 0, width, height, radius, "#FFFFFF", accentSoft(accent), 2);
    const label = centeredText(width / 2, border + captionHeight / 2, caption, fontSize, accent);
    const qr = placeQr({ inner, x: gap, y: captionHeight + gap, scale });

    return svgDocument({ width, height, content: card + label + qr });
  }

  // scan-me and ticket: QR on top, accent caption below.
  const width = qrPx + gap * 2;
  const height = qrPx + gap * 2 + captionHeight;
  const card = roundedRect(0, 0, width, height, radius, "#FFFFFF", accent, border);
  const qr = placeQr({ inner, x: gap, y: gap, scale });
  const chipWidth = Math.round(qrPx * 0.5);
  const chipHeight = Math.round(captionHeight * 0.78);
  const chip =
    roundedRect(
      (width - chipWidth) / 2,
      gap + qrPx + (captionHeight - chipHeight) / 2,
      chipWidth,
      chipHeight,
      0,
      accent,
      accent,
      0
    ) +
    centeredText(
      width / 2,
      gap + qrPx + captionHeight / 2,
      caption,
      fontSize,
      "#FFFFFF"
    );

  return svgDocument({ width, height, content: card + qr + chip });
}

function placeQr({
  inner,
  x,
  y,
  scale,
}: {
  readonly inner: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}): string {
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(scale)})">${inner}</g>`;
}

function svgDocument({
  width,
  height,
  content,
}: {
  readonly width: number;
  readonly height: number;
  readonly content: string;
}): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${content}</svg>`
  );
}

function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
  strokeWidth: number
): string {
  const strokeAttrs =
    strokeWidth > 0
      ? ` stroke="${stroke}" stroke-width="${strokeWidth}"`
      : "";
  const inset = strokeWidth / 2;

  return (
    `<rect x="${n2(x + inset)}" y="${n2(y + inset)}" ` +
    `width="${n2(width - strokeWidth)}" height="${n2(height - strokeWidth)}" ` +
    `rx="${radius}" ry="${radius}" fill="${fill}"${strokeAttrs}/>`
  );
}

function centeredText(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  fill: string
): string {
  return (
    `<text x="${n2(x)}" y="${n2(y)}" fill="${fill}" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" ` +
    `font-weight="700" letter-spacing="0.5" text-anchor="middle" ` +
    `dominant-baseline="central">${escapeXml(text)}</text>`
  );
}

function svgRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string
): string {
  return radius > 0
    ? `<rect x="${n2(x)}" y="${n2(y)}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${fill}"/>`
    : `<rect x="${n2(x)}" y="${n2(y)}" width="${width}" height="${height}" fill="${fill}"/>`;
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

function n2(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
