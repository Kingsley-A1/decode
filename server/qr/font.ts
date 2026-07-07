import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import opentype, { type Font } from "opentype.js";

/**
 * Frame captions ("SCAN ME", a menu title, …) are rasterised to PNG/JPG by
 * sharp/librsvg, which depends on whatever fonts the host happens to have
 * installed. Serverless runtimes ship none, so SVG `<text>` renders as tofu
 * boxes in the downloaded image. To make every export self-contained, captions
 * are converted to vector `<path>` outlines here using a bundled font — so the
 * artwork carries its own glyphs and renders identically in every viewer,
 * rasteriser, and PDF, with no runtime font dependency.
 */

// Liberation Sans is metric-compatible with Arial (the family the previous
// `<text>` captions requested) and is redistributable under the SIL Open Font
// License 1.1 — see the accompanying `.LICENSE.txt`.
const FONT_PATH = join(
  process.cwd(),
  "server",
  "qr",
  "assets",
  "LiberationSans-Bold.ttf"
);

let cachedFont: Font | null = null;

function getFont(): Font {
  if (!cachedFont) {
    cachedFont = opentype.parse(toArrayBuffer(readFileSync(FONT_PATH)));
  }

  return cachedFont;
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

export interface CaptionPathInput {
  readonly text: string;
  /** Horizontal center the glyphs are laid out around (SVG `text-anchor="middle"`). */
  readonly centerX: number;
  /** Vertical center the glyphs are centered on (SVG `dominant-baseline="central"`). */
  readonly centerY: number;
  readonly fontSize: number;
  /** Extra tracking between glyphs, in the same user units as `fontSize`. */
  readonly letterSpacing?: number;
}

/**
 * Returns SVG path data for `text`, laid out horizontally and centered on
 * (`centerX`, `centerY`) using the glyphs' true bounding box — so the visual
 * center is exact regardless of font metrics. Returns an empty string for
 * empty text so callers can skip emitting a path.
 */
export function captionToPathData({
  text,
  centerX,
  centerY,
  fontSize,
  letterSpacing = 0,
}: CaptionPathInput): string {
  if (!text) return "";

  const font = getFont();
  const scale = fontSize / font.unitsPerEm;
  const path = new opentype.Path();

  // Lay glyphs out along the baseline (y = 0), applying tracking between them.
  let penX = 0;
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((glyph, index) => {
    path.extend(glyph.getPath(penX, 0, fontSize));
    penX += (glyph.advanceWidth ?? 0) * scale;
    if (index < glyphs.length - 1) penX += letterSpacing;
  });

  const box = path.getBoundingBox();
  if (!Number.isFinite(box.x1) || !Number.isFinite(box.y1)) return "";

  // Translate the laid-out glyphs so their bounding box centers on the target
  // point — the font-independent equivalent of anchor "middle" + baseline
  // "central".
  const dx = centerX - (box.x1 + box.x2) / 2;
  const dy = centerY - (box.y1 + box.y2) / 2;
  for (const command of path.commands) {
    if ("x" in command && command.x !== undefined) {
      command.x += dx;
      command.y += dy;
    }
    if ("x1" in command && command.x1 !== undefined) {
      command.x1 += dx;
      command.y1 += dy;
    }
    if ("x2" in command && command.x2 !== undefined) {
      command.x2 += dx;
      command.y2 += dy;
    }
  }

  return path.toPathData(2);
}
