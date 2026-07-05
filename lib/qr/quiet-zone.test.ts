import { describe, expect, it } from "vitest";
import { getQuietZonePx } from "@/lib/qr/quiet-zone";

describe("getQuietZonePx", () => {
  it("matches the server export ratio: margin * size / (moduleCount + 2 * margin)", () => {
    // 29-module matrix (a typical short URL) at the 4-module default.
    expect(
      getQuietZonePx({ marginModules: 4, moduleCount: 29, size: 1024 })
    ).toBe(Math.round((4 * 1024) / (29 + 8)));
  });

  it("returns 0 for a zero margin", () => {
    expect(
      getQuietZonePx({ marginModules: 0, moduleCount: 29, size: 1024 })
    ).toBe(0);
  });

  it("clamps margins above the 16-module schema maximum", () => {
    expect(
      getQuietZonePx({ marginModules: 40, moduleCount: 29, size: 1024 })
    ).toBe(Math.round((16 * 1024) / (29 + 32)));
  });

  it("clamps negative margins to 0", () => {
    expect(
      getQuietZonePx({ marginModules: -3, moduleCount: 29, size: 1024 })
    ).toBe(0);
  });

  it("falls back to the 4-module default for a non-finite margin", () => {
    expect(
      getQuietZonePx({ marginModules: Number.NaN, moduleCount: 29, size: 280 })
    ).toBe(Math.round((4 * 280) / (29 + 8)));
  });

  it("returns 0 when the module count or size is invalid", () => {
    expect(
      getQuietZonePx({ marginModules: 4, moduleCount: 0, size: 1024 })
    ).toBe(0);
    expect(
      getQuietZonePx({ marginModules: 4, moduleCount: 12.5, size: 1024 })
    ).toBe(0);
    expect(getQuietZonePx({ marginModules: 4, moduleCount: 29, size: 0 })).toBe(
      0
    );
  });
});
