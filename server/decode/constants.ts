export const DECODE_ALGORITHM = {
  CAESAR: "caesar",
  BASE64: "base64",
  ROT13: "rot13",
  REVERSE: "reverse",
  MORSE: "morse",
  BINARY: "binary",
  HEX: "hex",
  URL: "url",
} as const;

export const DECODE_DIRECTION = {
  ENCODE: "encode",
  DECODE: "decode",
} as const;

export type DecodeAlgorithm =
  (typeof DECODE_ALGORITHM)[keyof typeof DECODE_ALGORITHM];
export type DecodeDirection =
  (typeof DECODE_DIRECTION)[keyof typeof DECODE_DIRECTION];
