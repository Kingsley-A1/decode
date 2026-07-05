import "server-only";

import { randomBytes } from "node:crypto";

/**
 * Mints a uniformly distributed random slug from an alphabet using rejection
 * sampling: only bytes below the largest integer multiple of the alphabet
 * size are accepted, so no character is more likely than another. Shared by
 * the short-link and dynamic-QR slug minters.
 */
export function generateRandomSlug({
  alphabet,
  length,
  randomBytesImpl = randomBytes,
}: {
  readonly alphabet: string;
  readonly length: number;
  readonly randomBytesImpl?: (size: number) => Buffer;
}): string {
  if (alphabet.length < 2 || alphabet.length > 256) {
    throw new Error("Slug alphabet must contain between 2 and 256 characters.");
  }
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("Slug length must be a positive integer.");
  }

  const alphabetSize = alphabet.length;
  const ceiling = Math.floor(256 / alphabetSize) * alphabetSize;
  const out: string[] = [];

  while (out.length < length) {
    const bytes = randomBytesImpl(length * 2);
    for (let i = 0; i < bytes.length && out.length < length; i++) {
      const value = bytes[i];
      if (value === undefined || value >= ceiling) continue;
      out.push(alphabet[value % alphabetSize] ?? "");
    }
  }

  return out.join("");
}
