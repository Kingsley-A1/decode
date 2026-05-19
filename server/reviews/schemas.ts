import { z } from "zod";

export const REVIEW_STATUS = {
  PUBLISHED: "published",
  HIDDEN: "hidden",
} as const;

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Enter a valid email address.").max(160).optional()
);

export const createReviewRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or less."),
  email: optionalEmailSchema,
  rating: z.coerce
    .number()
    .int("Choose a whole-star rating.")
    .min(1, "Choose at least 1 star.")
    .max(5, "Choose no more than 5 stars."),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(90, "Title must be 90 characters or less."),
  body: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters.")
    .max(1000, "Review must be 1000 characters or less."),
});

export const listReviewsQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  take: z.coerce.number().int().min(1).max(50).default(12),
});

export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
