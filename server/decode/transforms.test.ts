import { describe, expect, it } from "vitest";
import { DECODE_ALGORITHM, DECODE_DIRECTION } from "@/server/decode/constants";
import { DecodeTransformError } from "@/server/decode/errors";
import { transformDecodeInput } from "@/server/decode/transforms";

describe("transformDecodeInput", () => {
  it("encodes and decodes base64 deterministically", () => {
    const encoded = transformDecodeInput({
      algorithm: DECODE_ALGORITHM.BASE64,
      direction: DECODE_DIRECTION.ENCODE,
      input: "Decode",
    });
    const decoded = transformDecodeInput({
      algorithm: DECODE_ALGORITHM.BASE64,
      direction: DECODE_DIRECTION.DECODE,
      input: encoded.output,
    });

    expect(encoded.output).toBe("RGVjb2Rl");
    expect(decoded.output).toBe("Decode");
  });

  it("runs Caesar and ROT13 transforms", () => {
    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.CAESAR,
        direction: DECODE_DIRECTION.ENCODE,
        input: "abc",
        shift: 3,
      }).output
    ).toBe("def");

    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.ROT13,
        direction: DECODE_DIRECTION.ENCODE,
        input: "uryyb",
      }).output
    ).toBe("hello");
  });

  it("runs reverse, Morse, binary, hex, and URL transforms", () => {
    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.REVERSE,
        direction: DECODE_DIRECTION.ENCODE,
        input: "abc",
      }).output
    ).toBe("cba");
    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.MORSE,
        direction: DECODE_DIRECTION.DECODE,
        input: "-.. . -.-. --- -.. .",
      }).output
    ).toBe("DECODE");
    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.BINARY,
        direction: DECODE_DIRECTION.DECODE,
        input: "01001000 01101001",
      }).output
    ).toBe("Hi");
    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.HEX,
        direction: DECODE_DIRECTION.DECODE,
        input: "48 69",
      }).output
    ).toBe("Hi");
    expect(
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.URL,
        direction: DECODE_DIRECTION.DECODE,
        input: "Decode%20Platform",
      }).output
    ).toBe("Decode Platform");
  });

  it("throws explicit errors for invalid encoded input", () => {
    expect(() =>
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.BINARY,
        direction: DECODE_DIRECTION.DECODE,
        input: "0101",
      })
    ).toThrow(DecodeTransformError);
    expect(() =>
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.HEX,
        direction: DECODE_DIRECTION.DECODE,
        input: "abc",
      })
    ).toThrow("Hex input must contain an even number");
    expect(() =>
      transformDecodeInput({
        algorithm: DECODE_ALGORITHM.URL,
        direction: DECODE_DIRECTION.DECODE,
        input: "%E0%A4%A",
      })
    ).toThrow("URL encoded input is invalid.");
  });
});
