// Client-safe mirror of the server export geometry (`server/qr/svg.ts`): the
// export scales `moduleCount + 2 * margin` modules into `size` pixels, so one
// quiet-zone module occupies `size / (moduleCount + 2 * margin)` pixels.
// qr-code-styling takes its margin in pixels, so previews must convert the
// module-based design margin through this same ratio to match exports.

const MIN_QUIET_ZONE_MODULES = 0;
const MAX_QUIET_ZONE_MODULES = 16;
const FALLBACK_QUIET_ZONE_MODULES = 4;

export function getQuietZonePx({
  marginModules,
  moduleCount,
  size,
}: {
  readonly marginModules: number;
  readonly moduleCount: number;
  readonly size: number;
}): number {
  if (!Number.isFinite(size) || size <= 0) return 0;
  if (!Number.isInteger(moduleCount) || moduleCount <= 0) return 0;

  const safeMargin = Math.min(
    Math.max(
      Math.round(
        Number.isFinite(marginModules)
          ? marginModules
          : FALLBACK_QUIET_ZONE_MODULES
      ),
      MIN_QUIET_ZONE_MODULES
    ),
    MAX_QUIET_ZONE_MODULES
  );

  return Math.round((safeMargin * size) / (moduleCount + 2 * safeMargin));
}
