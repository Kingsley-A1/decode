import { z } from "zod";
import { DECODE_ALGORITHM, DECODE_DIRECTION } from "@/server/decode/constants";

export const decodeRequestSchema = z.object({
  algorithm: z.enum([
    DECODE_ALGORITHM.CAESAR,
    DECODE_ALGORITHM.BASE64,
    DECODE_ALGORITHM.ROT13,
    DECODE_ALGORITHM.REVERSE,
    DECODE_ALGORITHM.MORSE,
    DECODE_ALGORITHM.BINARY,
    DECODE_ALGORITHM.HEX,
    DECODE_ALGORITHM.URL,
  ]),
  direction: z.enum([DECODE_DIRECTION.ENCODE, DECODE_DIRECTION.DECODE]),
  input: z.string().max(10000, "Input must be 10,000 characters or less."),
  shift: z.number().int().min(1).max(25).default(3),
});

export type DecodeRequest = z.infer<typeof decodeRequestSchema>;
