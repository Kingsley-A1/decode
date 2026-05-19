import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { CreateReviewRequest } from "@/server/reviews/schemas";
import { REVIEW_STATUS } from "@/server/reviews/schemas";

const reviewSelect = {
  id: true,
  userId: true,
  name: true,
  rating: true,
  title: true,
  body: true,
  helpfulCount: true,
  createdAt: true,
} satisfies Prisma.ReviewSelect;

const publishedReviewWhere = {
  status: REVIEW_STATUS.PUBLISHED,
  deletedAt: null,
} satisfies Prisma.ReviewWhereInput;

export type PublicReview = Prisma.ReviewGetPayload<{
  select: typeof reviewSelect;
}>;

export interface ListPublishedReviewsInput {
  readonly take: number;
  readonly cursorId?: string;
}

export interface CreateReviewInput {
  readonly request: CreateReviewRequest;
  readonly userId?: string;
  readonly sessionName?: string | null;
  readonly sessionEmail?: string | null;
}

export interface ReviewSummary {
  readonly totalReviews: number;
  readonly averageRating: number;
  readonly fiveStarReviews: number;
  readonly recommendPercent: number;
}

export async function listPublishedReviews({
  take,
  cursorId,
}: ListPublishedReviewsInput): Promise<readonly PublicReview[]> {
  return prisma.review.findMany({
    where: publishedReviewWhere,
    orderBy: { createdAt: "desc" },
    take,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: reviewSelect,
  });
}

export function createReview({
  request,
  userId,
  sessionName,
  sessionEmail,
}: CreateReviewInput): Promise<PublicReview> {
  return prisma.review.create({
    data: {
      userId,
      name: sessionName?.trim() || request.name,
      email: sessionEmail?.trim() || request.email,
      rating: request.rating,
      title: request.title,
      body: request.body,
      status: REVIEW_STATUS.PUBLISHED,
    },
    select: reviewSelect,
  });
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  const [ratingStats, fiveStarReviews, recommendedReviews] = await Promise.all([
    prisma.review.aggregate({
      where: publishedReviewWhere,
      _count: { _all: true },
      _avg: { rating: true },
    }),
    prisma.review.count({
      where: { ...publishedReviewWhere, rating: 5 },
    }),
    prisma.review.count({
      where: { ...publishedReviewWhere, rating: { gte: 4 } },
    }),
  ]);
  const totalReviews = ratingStats._count._all;
  const averageRating = roundRating(ratingStats._avg.rating ?? 0);

  return {
    totalReviews,
    averageRating,
    fiveStarReviews,
    recommendPercent:
      totalReviews > 0
        ? Math.round((recommendedReviews / totalReviews) * 100)
        : 0,
  };
}

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}
