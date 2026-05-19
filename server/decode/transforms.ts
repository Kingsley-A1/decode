import {
  DECODE_ALGORITHM,
  DECODE_DIRECTION,
  type DecodeAlgorithm,
  type DecodeDirection,
} from "@/server/decode/constants";
import { DecodeTransformError } from "@/server/decode/errors";

export interface DecodeTransformInput {
  readonly algorithm: DecodeAlgorithm;
  readonly direction: DecodeDirection;
  readonly input: string;
  readonly shift?: number;
}

export interface DecodeTransformResult {
  readonly algorithm: DecodeAlgorithm;
  readonly direction: DecodeDirection;
  readonly output: string;
  readonly inputLength: number;
  readonly outputLength: number;
}

const MORSE_CODE_MAP: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  " ": "/",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "'": ".----.",
  '"': ".-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "/": "-..-.",
  _: "..--.-",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  "@": ".--.-.",
};

const REVERSE_MORSE_CODE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE_MAP).map(([key, value]) => [value, key])
);

export function transformDecodeInput({
  algorithm,
  direction,
  input,
  shift = 3,
}: DecodeTransformInput): DecodeTransformResult {
  const output =
    direction === DECODE_DIRECTION.ENCODE
      ? encodeValue({ algorithm, input, shift })
      : decodeValue({ algorithm, input, shift });

  return {
    algorithm,
    direction,
    output,
    inputLength: input.length,
    outputLength: output.length,
  };
}

function encodeValue({
  algorithm,
  input,
  shift,
}: {
  readonly algorithm: DecodeAlgorithm;
  readonly input: string;
  readonly shift: number;
}): string {
  switch (algorithm) {
    case DECODE_ALGORITHM.CAESAR:
      return caesarCipher(input, shift);
    case DECODE_ALGORITHM.BASE64:
      return Buffer.from(input, "utf8").toString("base64");
    case DECODE_ALGORITHM.ROT13:
      return caesarCipher(input, 13);
    case DECODE_ALGORITHM.REVERSE:
      return reverseString(input);
    case DECODE_ALGORITHM.MORSE:
      return toMorse(input);
    case DECODE_ALGORITHM.BINARY:
      return toBinary(input);
    case DECODE_ALGORITHM.HEX:
      return Buffer.from(input, "utf8").toString("hex");
    case DECODE_ALGORITHM.URL:
      return encodeURIComponent(input);
  }
}

function decodeValue({
  algorithm,
  input,
  shift,
}: {
  readonly algorithm: DecodeAlgorithm;
  readonly input: string;
  readonly shift: number;
}): string {
  switch (algorithm) {
    case DECODE_ALGORITHM.CAESAR:
      return caesarCipher(input, shift, true);
    case DECODE_ALGORITHM.BASE64:
      return fromBase64(input);
    case DECODE_ALGORITHM.ROT13:
      return caesarCipher(input, 13);
    case DECODE_ALGORITHM.REVERSE:
      return reverseString(input);
    case DECODE_ALGORITHM.MORSE:
      return fromMorse(input);
    case DECODE_ALGORITHM.BINARY:
      return fromBinary(input);
    case DECODE_ALGORITHM.HEX:
      return fromHex(input);
    case DECODE_ALGORITHM.URL:
      return fromUrlEncoded(input);
  }
}

function caesarCipher(input: string, shift: number, decrypt = false): string {
  const actualShift = decrypt ? 26 - (shift % 26) : shift % 26;

  return input.replace(/[a-zA-Z]/g, (char) => {
    const start = char <= "Z" ? 65 : 97;

    return String.fromCharCode(
      ((char.charCodeAt(0) - start + actualShift) % 26) + start
    );
  });
}

function reverseString(input: string): string {
  return [...input].reverse().join("");
}

function toMorse(input: string): string {
  return [...input.toUpperCase()]
    .map((char) => MORSE_CODE_MAP[char] ?? char)
    .join(" ");
}

function fromMorse(input: string): string {
  const codes = input.trim().split(/\s+/).filter(Boolean);

  return codes
    .map((code) => {
      const value = REVERSE_MORSE_CODE_MAP[code];
      if (!value) {
        throw new DecodeTransformError(`Invalid Morse code token: ${code}`);
      }

      return value;
    })
    .join("");
}

function toBinary(input: string): string {
  return [...Buffer.from(input, "utf8")]
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join(" ");
}

function fromBinary(input: string): string {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";

  const bytes = tokens.map((token) => {
    if (!/^[01]{8}$/.test(token)) {
      throw new DecodeTransformError(
        "Binary input must contain 8-bit groups separated by spaces."
      );
    }

    return Number.parseInt(token, 2);
  });

  return Buffer.from(bytes).toString("utf8");
}

function fromHex(input: string): string {
  const normalizedInput = input.replace(/\s+/g, "");
  if (normalizedInput.length === 0) return "";
  if (!/^[0-9a-fA-F]+$/.test(normalizedInput) || normalizedInput.length % 2) {
    throw new DecodeTransformError(
      "Hex input must contain an even number of hexadecimal characters."
    );
  }

  return Buffer.from(normalizedInput, "hex").toString("utf8");
}

function fromBase64(input: string): string {
  const normalizedInput = input.trim();
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedInput)) {
    throw new DecodeTransformError("Base64 input contains invalid characters.");
  }

  try {
    return Buffer.from(normalizedInput, "base64").toString("utf8");
  } catch {
    throw new DecodeTransformError("Base64 input could not be decoded.");
  }
}

function fromUrlEncoded(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new DecodeTransformError("URL encoded input is invalid.");
  }
}
