"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Send,
  MessageSquare,
  User,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
  Quote,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  message: string;
  avatar: string;
  helpful: number;
  isNew?: boolean;
}

const initialReviews: Review[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    rating: 5,
    date: "2024-12-01",
    message:
      "Absolutely love this QR generator! The customization options are incredible. I use it for all my business cards now.",
    avatar: "S",
    helpful: 24,
  },
  {
    id: 2,
    name: "Michael Chen",
    rating: 5,
    date: "2024-11-28",
    message:
      "The cipher tools are amazing. Finally a tool that supports multiple encryption algorithms in one place. Very user-friendly!",
    avatar: "M",
    helpful: 18,
  },
  {
    id: 3,
    name: "Emily Williams",
    rating: 4,
    date: "2024-11-25",
    message:
      "Great app! The mobile-first design is perfect. Would love to see more color presets for QR codes in the future.",
    avatar: "E",
    helpful: 12,
  },
  {
    id: 4,
    name: "David Rodriguez",
    rating: 5,
    date: "2024-11-20",
    message:
      "Been looking for a good Morse code converter for ages. This tool is perfect and the interface is beautiful!",
    avatar: "D",
    helpful: 15,
  },
  {
    id: 5,
    name: "Lisa Thompson",
    rating: 5,
    date: "2024-11-15",
    message:
      "Professional quality work. The PWA feature means I can use it offline too. Highly recommended!",
    avatar: "L",
    helpful: 21,
  },
];

function ReviewCard({
  review,
  onHelpful,
}: {
  review: Review;
  onHelpful: (id: number) => void;
}) {
  const [isHelpful, setIsHelpful] = useState(false);

  const handleHelpful = () => {
    if (!isHelpful) {
      setIsHelpful(true);
      onHelpful(review.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-xl p-4 space-y-3",
        review.isNew && "ring-2 ring-green-500/50 bg-green-500/5"
      )}
    >
      {review.isNew && (
        <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Just Added
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-orange-500/20">
            {review.avatar}
          </div>
          <div>
            <h4 className="font-medium text-white text-sm">{review.name}</h4>
            <p className="text-xs text-neutral-500">
              {new Date(review.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4",
                star <= review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-neutral-600"
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative pl-4 border-l-2 border-orange-500/30">
        <Quote className="absolute -left-2 -top-1 w-4 h-4 text-orange-500/50" />
        <p className="text-neutral-400 text-sm leading-relaxed">
          {review.message}
        </p>
      </div>

      <button
        onClick={handleHelpful}
        disabled={isHelpful}
        className={cn(
          "flex items-center gap-2 text-xs transition-colors",
          isHelpful
            ? "text-orange-400 cursor-default"
            : "text-neutral-500 hover:text-neutral-300"
        )}
      >
        <ThumbsUp
          className={cn("w-3.5 h-3.5", isHelpful && "fill-orange-400")}
        />
        Helpful ({review.helpful})
      </button>
    </motion.div>
  );
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [activeTab, setActiveTab] = useState<"read" | "write">("read");

  const stats = useMemo(() => {
    const total = reviews.length;
    const avgRating =
      total > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)
        : "0.0";
    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
    const recommendPercent =
      total > 0
        ? Math.round(
            (reviews.filter((r) => r.rating >= 4).length / total) * 100
          )
        : 0;
    return { total, avgRating, fiveStarCount, recommendPercent };
  }, [reviews]);

  const handleHelpful = (id: number) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !message || rating === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newReview: Review = {
        id: Date.now(),
        name: name,
        rating: rating,
        date: new Date().toISOString().split("T")[0],
        message: message,
        avatar: name.charAt(0).toUpperCase(),
        helpful: 0,
        isNew: true,
      };

      setReviews((prev) => [newReview, ...prev]);
      setSubmitStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setRating(0);

      setTimeout(() => {
        setActiveTab("read");
      }, 1500);

      setTimeout(() => {
        setReviews((prev) =>
          prev.map((r) => (r.id === newReview.id ? { ...r, isNew: false } : r))
        );
      }, 10000);
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="See what others say & share your experience"
      />

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 md:p-6"
      >
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {stats.avgRating}
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-4 h-4",
                    star <= Math.round(parseFloat(stats.avgRating))
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-neutral-600"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-1">
              {stats.total}
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-xs text-neutral-500 mt-1">Total Reviews</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-400">
              {stats.recommendPercent}%
            </div>
            <p className="text-xs text-neutral-500 mt-1">Recommend</p>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400">
              {stats.fiveStarCount}
            </div>
            <p className="text-xs text-neutral-500 mt-1">5-Star Reviews</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2"
      >
        <button
          onClick={() => setActiveTab("read")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium",
            activeTab === "read"
              ? "bg-orange-500/20 text-orange-300 border border-orange-500"
              : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Read Reviews ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab("write")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium",
            activeTab === "write"
              ? "bg-orange-500/20 text-orange-300 border border-orange-500"
              : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700"
          )}
        >
          <Send className="w-4 h-4" />
          Write Review
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "read" ? (
          <motion.div
            key="read"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onHelpful={handleHelpful}
                />
              ))}
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-3 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors text-sm"
            >
              Load More Reviews
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="write"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <AnimatePresence mode="wait">
              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-400">
                      Thank you for your feedback!
                    </p>
                    <p className="text-xs text-green-400/70">
                      We appreciate you taking the time to share your thoughts.
                    </p>
                  </div>
                </motion.div>
              )}
              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      Something went wrong
                    </p>
                    <p className="text-xs text-red-400/70">
                      Please try again or contact us directly.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-8 h-8 transition-colors",
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-neutral-600"
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-sm text-neutral-400 ml-2">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Great"}
                      {rating === 5 && "Excellent!"}
                    </span>
                  )}
                </div>
              </div>

              <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Your Review
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your experience with DECODE..."
                  required
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Screenshot (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 cursor-pointer"
                />
              </div>

              <motion.button
                type="submit"
                disabled={
                  isSubmitting || !name || !email || !message || rating === 0
                }
                className="w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-orange-500/25"
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </motion.button>
            </form>

            <div className="glass rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">
                📧 Direct Email
              </h2>
              <p className="text-neutral-400 text-sm">
                Prefer email? Send your detailed feedback, suggestions, or
                screenshots directly to{" "}
                <a
                  href="mailto:decoder.ng@gmail.com"
                  className="text-orange-400 hover:underline"
                >
                  decoder.ng@gmail.com
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
