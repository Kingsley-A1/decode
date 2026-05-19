import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  apiError,
  apiSuccess,
  apiValidationError,
  createRequestId,
} from "@/server/api/response";
import {
  createReview,
  getReviewSummary,
  listPublishedReviews,
} from "@/server/reviews/repository";
import {
  createReviewRequestSchema,
  listReviewsQuerySchema,
} from "@/server/reviews/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);

  try {
    const query = listReviewsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const [reviews, summary] = await Promise.all([
      listPublishedReviews({
        take: query.take,
        cursorId: query.cursor,
      }),
      getReviewSummary(),
    ]);

    return apiSuccess({
      data: {
        reviews,
        summary,
        nextCursor:
          reviews.length < query.take
            ? null
            : (reviews[reviews.length - 1]?.id ?? null),
      },
      requestId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: "REVIEWS_LOAD_FAILED",
      message: getSafeErrorMessage(error, "Could not load product reviews."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId(request);

  try {
    const session = await auth();
    const body = await request.json();
    const createRequest = createReviewRequestSchema.parse(body);

    if (!session?.user?.id && !createRequest.email) {
      return apiError({
        code: "REVIEW_EMAIL_REQUIRED",
        message: "Enter an email address or sign in before submitting a review.",
        requestId,
        status: 400,
        fields: { email: ["Enter an email address or sign in."] },
      });
    }

    const review = await createReview({
      request: createRequest,
      userId: session?.user?.id,
      sessionName: session?.user?.name,
      sessionEmail: session?.user?.email,
    });
    const summary = await getReviewSummary();

    return apiSuccess({
      data: { review, summary },
      requestId,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError({ error, requestId });
    }

    return apiError({
      code: "REVIEW_CREATE_FAILED",
      message: getSafeErrorMessage(error, "Could not submit this review."),
      requestId,
      status: 500,
      cause: error,
    });
  }
}

function getSafeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
