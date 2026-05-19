import { describe, expect, it } from "vitest";
import { createReviewRequestSchema } from "@/server/reviews/schemas";

describe("review schemas", () => {
  it("accepts a valid anonymous review payload", () => {
    const result = createReviewRequestSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      rating: 5,
      title: "Clean QR workflow",
      body: "The generator, scanner, and verification flow are clear and useful.",
    });

    expect(result).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      rating: 5,
    });
  });

  it("allows signed-in review submissions without an email field", () => {
    const result = createReviewRequestSchema.parse({
      name: "Grace",
      rating: 4,
      title: "Useful dashboard",
      body: "The workspace dashboard keeps real data separate from demo data.",
    });

    expect(result.email).toBeUndefined();
  });

  it("rejects invalid ratings and short review bodies", () => {
    const result = createReviewRequestSchema.safeParse({
      name: "A",
      email: "not-an-email",
      rating: 6,
      title: "Ok",
      body: "Too short",
    });

    expect(result.success).toBe(false);
  });
});
