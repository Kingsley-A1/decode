import "server-only";

import {
  buildQRRenderPlan,
  type BuildQRRenderPlanInput,
  type QRFilledShape,
  type QRModuleShape,
  type QRPlacement,
  type QRRenderPlan,
} from "@/server/qr/geometry";

export type { StyledQRLogo } from "@/server/qr/geometry";
export type BuildStyledQRSvgInput = BuildQRRenderPlanInput;

/**
 * Renders a fully styled QR code as an SVG string — honouring dot style,
 * corner (finder) style, colors, quiet zone, an optional centered logo, and
 * a frame. The geometry comes from `buildQRRenderPlan`, the single source of
 * truth shared with the vector PDF writer, so every export format matches the
 * design the user selected.
 */
export function buildStyledQRSvg(input: BuildStyledQRSvgInput): string {
  return serializeQRPlanToSvg(buildQRRenderPlan(input));
}

export function serializeQRPlanToSvg(plan: QRRenderPlan): string {
  const content =
    plan.underlay.map(filledShapeToSvg).join("") +
    qrPlacementToSvg(plan.qr) +
    plan.overlay.map(filledShapeToSvg).join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.width}" height="${plan.height}" ` +
    `viewBox="0 0 ${plan.width} ${plan.height}">${content}</svg>`
  );
}

function qrPlacementToSvg(qr: QRPlacement): string {
  const inner =
    `<rect width="${qr.dim}" height="${qr.dim}" fill="${qr.background}"/>` +
    `<g fill="${qr.foreground}">${qr.modules.map(moduleShapeToSvg).join("")}</g>` +
    qr.eyes.map(filledShapeToSvg).join("") +
    qr.logo.map(filledShapeToSvg).join("");

  return `<g transform="translate(${n2(qr.x)} ${n2(qr.y)}) scale(${n2(qr.scale)})">${inner}</g>`;
}

function moduleShapeToSvg(shape: QRModuleShape): string {
  if (shape.kind === "module-dot") {
    return `<circle cx="${n2(shape.cx)}" cy="${n2(shape.cy)}" r="0.5"/>`;
  }

  return shape.radius > 0
    ? `<rect x="${shape.x}" y="${shape.y}" width="1" height="1" rx="${shape.radius}" ry="${shape.radius}"/>`
    : `<rect x="${shape.x}" y="${shape.y}" width="1" height="1"/>`;
}

function filledShapeToSvg(shape: QRFilledShape): string {
  switch (shape.kind) {
    case "eye-circle":
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.fill}"/>`;
    case "plain-rect":
      return shape.radius > 0
        ? `<rect x="${n2(shape.x)}" y="${n2(shape.y)}" width="${shape.width}" height="${shape.height}" rx="${shape.radius}" ry="${shape.radius}" fill="${shape.fill}"/>`
        : `<rect x="${n2(shape.x)}" y="${n2(shape.y)}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}"/>`;
    case "stroked-rect": {
      const strokeAttrs =
        shape.strokeWidth > 0
          ? ` stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"`
          : "";

      return (
        `<rect x="${n2(shape.x)}" y="${n2(shape.y)}" ` +
        `width="${n2(shape.width)}" height="${n2(shape.height)}" ` +
        `rx="${shape.radius}" ry="${shape.radius}" fill="${shape.fill}"${strokeAttrs}/>`
      );
    }
    case "caption":
      return (
        `<text x="${n2(shape.x)}" y="${n2(shape.y)}" fill="${shape.fill}" ` +
        `font-family="Arial, Helvetica, sans-serif" font-size="${shape.fontSize}" ` +
        `font-weight="700" letter-spacing="0.5" text-anchor="middle" ` +
        `dominant-baseline="central">${escapeXml(shape.text)}</text>`
      );
    case "logo-image":
      return (
        `<image href="${escapeAttribute(shape.dataUrl)}" ` +
        `x="${n2(shape.x)}" y="${n2(shape.y)}" ` +
        `width="${n2(shape.width)}" height="${n2(shape.height)}" ` +
        `preserveAspectRatio="xMidYMid meet"/>`
      );
  }
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
