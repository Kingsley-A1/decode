import { describe, expect, it } from "vitest";
import { buildStyledQRSvg } from "@/server/qr/svg";
import type { QRDesignConfig } from "@/server/qr/schemas";

const VALUE = "https://decode.com.ng/r/qr-parity";

function makeDesign(overrides: Partial<QRDesignConfig> = {}): QRDesignConfig {
  return {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#2563EB",
    margin: 4,
    logoSizeRatio: 0,
    dotStyle: "square",
    cornerStyle: "square",
    errorCorrectionLevel: "Q",
    size: 1024,
    frameStyle: "none",
    ...overrides,
  };
}

// Parity harness for the geometry/serializer refactor: these snapshots were
// captured from the pre-refactor string builder and must stay byte-identical.
describe("buildStyledQRSvg parity snapshots", () => {
  it.each(["none", "scan-me", "classic", "ticket", "badge", "minimal"] as const)(
    "renders the %s frame byte-stably",
    (frameStyle) => {
      const svg = buildStyledQRSvg({
        value: VALUE,
        design: makeDesign({ frameStyle }),
        title: "Spring Menu",
      });

      expect(svg).toMatchSnapshot();
    }
  );

  it.each(["square", "rounded", "dots", "classy", "extra-rounded"] as const)(
    "renders the %s dot style byte-stably",
    (dotStyle) => {
      const svg = buildStyledQRSvg({
        value: VALUE,
        design: makeDesign({ dotStyle }),
      });

      expect(svg).toMatchSnapshot();
    }
  );

  it.each(["square", "rounded", "dot"] as const)(
    "renders the %s corner style byte-stably",
    (cornerStyle) => {
      const svg = buildStyledQRSvg({
        value: VALUE,
        design: makeDesign({ cornerStyle }),
      });

      expect(svg).toMatchSnapshot();
    }
  );

  it("renders a logo overlay byte-stably", () => {
    const svg = buildStyledQRSvg({
      value: VALUE,
      design: makeDesign({ logoSizeRatio: 0.26 }),
      logo: { dataUrl: "data:image/png;base64,AAAA" },
    });

    expect(svg).toMatchSnapshot();
  });

  it("renders a framed logo design byte-stably", () => {
    const svg = buildStyledQRSvg({
      value: VALUE,
      design: makeDesign({
        frameStyle: "badge",
        logoSizeRatio: 0.2,
        dotStyle: "rounded",
        cornerStyle: "rounded",
        frameColor: "#D01616",
        size: 512,
      }),
      logo: { dataUrl: "data:image/png;base64,AAAA" },
      title: "Launch Party",
    });

    expect(svg).toMatchSnapshot();
  });

  it("renders a zero-margin design byte-stably", () => {
    const svg = buildStyledQRSvg({
      value: VALUE,
      design: makeDesign({ margin: 0 }),
    });

    expect(svg).toMatchSnapshot();
  });

  it("scales the quiet zone with the export geometry", () => {
    const design = makeDesign({ margin: 4 });
    const svg = buildStyledQRSvg({ value: VALUE, design });
    const backgroundMatch = svg.match(
      /<rect width="(\d+)" height="\1" fill="#FFFFFF"\/>/
    );

    expect(backgroundMatch).not.toBeNull();
    // dim = moduleCount + 2 * quietZone; the payload above produces a
    // 33-module matrix at EC level Q.
    expect(Number(backgroundMatch?.[1])).toBe(33 + 8);
  });
});
