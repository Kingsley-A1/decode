import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_EC_SHORT_PAYLOAD_MAX_LENGTH,
  getAdaptiveErrorCorrectionLevel,
} from "@/lib/qr/error-correction";

describe("getAdaptiveErrorCorrectionLevel", () => {
  it.each([
    // [isDynamic, hasLogo, payloadLength, expected]
    [true, false, 40, "H"], // dynamic redirect URL
    [true, false, 4000, "H"], // dynamic stays H regardless of length
    [false, true, 4000, "H"], // logo always forces H
    [false, false, 40, "H"], // short static payload
    [false, false, ADAPTIVE_EC_SHORT_PAYLOAD_MAX_LENGTH, "H"], // boundary
    [false, false, ADAPTIVE_EC_SHORT_PAYLOAD_MAX_LENGTH + 1, "Q"], // long vCard-ish
    [false, false, 2000, "Q"], // long WiFi/text payload keeps density
  ] as const)(
    "isDynamic=%s hasLogo=%s length=%s -> %s",
    (isDynamic, hasLogo, payloadLength, expected) => {
      expect(
        getAdaptiveErrorCorrectionLevel({ isDynamic, hasLogo, payloadLength })
      ).toBe(expected);
    }
  );
});
