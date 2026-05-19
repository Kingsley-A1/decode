"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, RefreshCw, Send, Star } from "lucide-react";
import { Alert, Button, EmptyState, Input, Skeleton, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ApiResponse<TData> {
  readonly ok: boolean;
  readonly data?: TData;
  readonly error?: {
    readonly message: string;
    readonly fields?: Record<string, readonly string[]>;
  };
}

interface ReviewRecord {
  readonly id: string;
  readonly userId?: string | null;
  readonly name: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly helpfulCount: number;
  readonly createdAt: string;
}

interface ReviewSummary {
  readonly totalReviews: number;
  readonly averageRating: number;
  readonly fiveStarReviews: number;
  readonly recommendPercent: number;
}

interface ReviewsResponse {
  readonly reviews: readonly ReviewRecord[];
  readonly summary: ReviewSummary;
  readonly nextCursor: string | null;
}

interface CreateReviewResponse {
  readonly review: ReviewRecord;
  readonly summary: ReviewSummary;
}

interface ReviewFormState {
  readonly name: string;
  readonly email: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
}

const emptySummary: ReviewSummary = {
  totalReviews: 0,
  averageRating: 0,
  fiveStarReviews: 0,
  recommendPercent: 0,
};

const initialFormState: ReviewFormState = {
  name: "",
  email: "",
  rating: 0,
  title: "",
  body: "",
};

export function ReviewClient() {
  const [reviews, setReviews] = useState<readonly ReviewRecord[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(emptySummary);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, readonly string[]>
  >({});
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasReviews = reviews.length > 0;
  const orderedReviews = useMemo(() => [...reviews], [reviews]);

  const loadInitialReviews = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const payload = await requestReviews(null);

      setSummary(payload.summary);
      setNextCursor(payload.nextCursor);
      setReviews(payload.reviews);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load reviews.";
      setNotice(message);
      setReviews([]);
      setSummary(emptySummary);
      setNextCursor(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreReviews = async () => {
    if (!nextCursor) return;

    setIsLoadingMore(true);

    try {
      const payload = await requestReviews(nextCursor);

      setSummary(payload.summary);
      setNextCursor(payload.nextCursor);
      setReviews((currentReviews) => [...currentReviews, ...payload.reviews]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load more reviews.";
      setNotice(message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadInitialReviews();
  }, [loadInitialReviews]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);
    setFieldErrors({});

    try {
      const data = await fetchJson<ApiResponse<CreateReviewResponse>>(
        "/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      if (!data.ok || !data.data) {
        setFieldErrors(data.error?.fields ?? {});
        throw new Error(data.error?.message ?? "Could not submit review.");
      }

      const payload = data.data;

      setReviews((currentReviews) => [payload.review, ...currentReviews]);
      setSummary(payload.summary);
      setForm(initialFormState);
      setNotice("Review submitted. Thank you for helping improve Decode.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not submit review.";
      setNotice(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange =
    (field: keyof ReviewFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "rating"
          ? Number(event.currentTarget.value)
          : event.currentTarget.value;
      setForm((currentForm) => ({ ...currentForm, [field]: value }));
    };

  const handleRatingChange = (rating: number) => {
    setForm((currentForm) => ({ ...currentForm, rating }));
  };

  return (
    <div className="space-y-6">
      {notice && (
        <Alert
          variant={notice.startsWith("Review submitted") ? "success" : "warning"}
          title={notice.startsWith("Review submitted") ? "Saved" : "Review notice"}
        >
          {notice}
        </Alert>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 sm:h-28" />
            ))
          : [
              ["Average rating", summary.averageRating.toFixed(1)],
              ["Total reviews", summary.totalReviews.toLocaleString()],
              ["Recommend", `${summary.recommendPercent}%`],
              ["5-star reviews", summary.fiveStarReviews.toLocaleString()],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
              >
                <p className="text-xs font-medium leading-5 text-slate-600 sm:text-sm">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 sm:mt-3 sm:text-2xl">
                  {value}
                </p>
              </article>
            ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-4" aria-labelledby="reviews-list-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="reviews-list-title"
                className="text-lg font-semibold text-slate-950"
              >
                Product reviews
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Every review shown here is read from the database.
              </p>
            </div>
              <Button
                variant="secondary"
                onClick={loadInitialReviews}
                isLoading={isLoading}
                leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
              >
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-56" />
              ))}
            </div>
          ) : hasReviews ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {orderedReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              {nextCursor && (
                <Button
                  variant="secondary"
                  onClick={loadMoreReviews}
                  isLoading={isLoadingMore}
                  className="w-full"
                >
                  Load more reviews
                </Button>
              )}
            </div>
          ) : (
            <EmptyState
              title="No reviews in the database yet"
              description="Submit the first review below. This page does not use seeded testimonials or client-side mock data."
              icon={
                <MessageSquareQuote className="h-6 w-6" aria-hidden="true" />
              }
            />
          )}
        </section>

        <section
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="review-form-title"
        >
          <h2 id="review-form-title" className="text-lg font-semibold text-slate-950">
            Write a review
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Reviews are persisted through the `/api/reviews` endpoint.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-800">
                Rating
              </legend>
              <div className="flex flex-wrap gap-1" role="radiogroup">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    role="radio"
                    aria-checked={form.rating === rating}
                    aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                    onClick={() => handleRatingChange(rating)}
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-colors",
                      rating <= form.rating
                        ? "border-amber-300 bg-amber-50 text-amber-600"
                        : "border-slate-200 bg-white text-slate-400 hover:border-sky-300 hover:text-sky-700"
                    )}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5",
                        rating <= form.rating && "fill-current"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
              {fieldErrors.rating?.[0] && (
                <p className="text-sm text-rose-700">{fieldErrors.rating[0]}</p>
              )}
            </fieldset>

            <Input
              label="Name"
              value={form.name}
              onChange={handleFieldChange("name")}
              error={fieldErrors.name?.[0]}
              autoComplete="name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={handleFieldChange("email")}
              error={fieldErrors.email?.[0]}
              hint="Used for review integrity. It is not shown publicly."
              autoComplete="email"
              required
            />
            <Input
              label="Review title"
              value={form.title}
              onChange={handleFieldChange("title")}
              error={fieldErrors.title?.[0]}
              maxLength={90}
              required
            />
            <Textarea
              label="Review"
              value={form.body}
              onChange={handleFieldChange("body")}
              error={fieldErrors.body?.[0]}
              rows={5}
              maxLength={1000}
              required
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
              className="w-full"
            >
              Submit review
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { readonly review: ReviewRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-950">{review.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {review.name} · {formatDate(review.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                star <= review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {review.body}
      </p>
      <p className="mt-4 text-xs font-medium text-slate-500">
        Helpful votes: {review.helpfulCount.toLocaleString()}
      </p>
    </article>
  );
}

async function fetchJson<TData>(
  input: RequestInfo,
  init?: RequestInit
): Promise<TData> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as TData | null;

  if (!data) throw new Error(`Request failed with ${response.status}.`);

  return data;
}

async function requestReviews(cursor: string | null): Promise<ReviewsResponse> {
  const query = new URLSearchParams({ take: "12" });
  if (cursor) query.set("cursor", cursor);

  const data = await fetchJson<ApiResponse<ReviewsResponse>>(
    `/api/reviews?${query.toString()}`
  );

  if (!data.ok || !data.data) {
    throw new Error(data.error?.message ?? "Could not load reviews.");
  }

  return data.data;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
