"use client";

import { Calendar, Clapperboard, Plus, Share2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import SubPageHeader from "@/components/layout/SubPageHeader";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewModal from "@/components/reviews/ReviewModal";

export default function MovieDetailPageClient({
  movie: initialMovie,
  reviews: initialReviews,
}) {
  const t = useTranslations("Reviews");

  const [movie, setMovie] = useState(initialMovie);
  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });

  async function handleSubmitReview() {
    setLoading(true);
    try {
      const res = await fetch("/api/kritik/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: movie.id,
          ...newReview,
        }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        // Refresh reviews and movie data
        const [reviewsRes, movieRes] = await Promise.all([
          fetch(`/api/kritik/reviews?itemId=${movie.id}`),
          fetch(`/api/kritik/items/${movie.id}`),
        ]);
        setReviews(await reviewsRes.json());
        setMovie(await movieRes.json());
        setNewReview({ rating: 5, comment: "" });
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setLoading(false);
    }
  }

  const share = () => {
    const text = t("shareText", { title: movie.title });
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t("linkCopied"));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <SubPageHeader
        title={movie.title}
        subtitle={t("movies")}
        backHref="/kritik/filme"
      >
        <button
          type="button"
          onClick={share}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Share"
        >
          <Share2 size={20} />
        </button>
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="aspect-[2/3] rounded-3xl overflow-hidden bg-muted shadow-xl border border-border">
                {movie.image
                  ? <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Clapperboard
                        className="text-muted-foreground/20"
                        size={64}
                      />
                    </div>}
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {movie.releaseDate && (
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar size={16} />
                      {movie.releaseDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-orange-500">
                    <Star size={32} fill="currentColor" />
                    <span className="text-3xl font-black">
                      {movie.avgRating
                        ? Number(movie.avgRating).toFixed(1)
                        : "-"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    {movie.reviewCount} {t("reviews")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  <Plus size={20} />
                  {t("addReview")}
                </button>
              </div>

              {movie.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {movie.description}
                </p>
              )}
            </div>
          </section>

          {/* Reviews List */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              {t("reviews")}
            </h2>
            <ReviewList reviews={reviews} />
          </section>
        </div>
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        loading={loading}
        newReview={newReview}
        setNewReview={setNewReview}
        type="movie"
      />
    </div>
  );
}
