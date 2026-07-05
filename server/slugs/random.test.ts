import { describe, expect, it } from "vitest";
import { generateRandomSlug } from "@/server/slugs/random";

describe("generateRandomSlug", () => {
  it("maps bytes onto the alphabet uniformly via rejection sampling", () => {
    // Alphabet of 31 chars → ceiling 248: bytes 248-255 must be rejected.
    const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
    const fed = [255, 250, 0, 1, 30, 31, 247];
    const randomBytesImpl = () => Buffer.from(fed);

    // 255/250 rejected; 0→"2", 1→"3", 30→"z", 31→31%31=0→"2", 247→247%31=30→"z"
    expect(
      generateRandomSlug({ alphabet, length: 5, randomBytesImpl })
    ).toBe("23z2z");
  });

  it("produces the requested length from the requested alphabet", () => {
    const slug = generateRandomSlug({ alphabet: "ab", length: 16 });

    expect(slug).toMatch(/^[ab]{16}$/);
  });

  it("rejects invalid alphabets and lengths", () => {
    expect(() => generateRandomSlug({ alphabet: "a", length: 4 })).toThrow();
    expect(() => generateRandomSlug({ alphabet: "ab", length: 0 })).toThrow();
    expect(() => generateRandomSlug({ alphabet: "ab", length: 1.5 })).toThrow();
  });
});
