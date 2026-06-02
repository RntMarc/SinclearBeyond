"use client";

import {
  Calendar,
  Clapperboard,
  Plus,
  RefreshCcw,
  Share2,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import SubPageHeader from "@/components/layout/SubPageHeader";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewModal from "@/components/reviews/ReviewModal";
import Button from "@/components/ui/Button";

export default function MovieDetailPageClient({
  movie: initialMovie,
  reviews: initialReviews,
  userId,
}) {
  const t = useTranslations("Reviews");

  const [movie, setMovie] = useState(initialMovie);
  const [reviews, setReviews] = useState(initialReviews);
  const [userEpisodeReviews, setUserEpisodeReviews] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

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
        setIsEditing(false);
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

  async function handleDeleteReview(reviewId) {
    if (!confirm(t("deleteReviewConfirm"))) return;
    try {
      const res = await fetch(`/api/kritik/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const [reviewsRes, movieRes] = await Promise.all([
          fetch(`/api/kritik/reviews?itemId=${movie.id}`),
          fetch(`/api/kritik/items/${movie.id}`),
        ]);
        setReviews(await reviewsRes.json());
        setMovie(await movieRes.json());
      }
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  }

  function handleEditReview(review) {
    setNewReview({
      rating: review.rating,
      comment: review.comment,
    });
    setIsEditing(true);
    setShowReviewModal(true);
  }

  async function refreshData() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/kritik/items/${movie.id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        const movieRes = await fetch(`/api/kritik/items/${movie.id}`);
        setMovie(await movieRes.json());
      }
    } catch (err) {
      console.error("Failed to refresh data", err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleEpisodeRate(episodeId, rating) {
    try {
      const res = await fetch("/api/kritik/reviews/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId, rating }),
      });
      if (res.ok) {
        // Refresh movie data to get new averages
        const movieRes = await fetch(`/api/kritik/items/${movie.id}`);
        setMovie(await movieRes.json());
        setUserEpisodeReviews((prev) => ({ ...prev, [episodeId]: rating }));
      }
    } catch (err) {
      console.error("Failed to rate episode", err);
    }
  }

  useEffect(() => {
    if (movie.episodes) {
      const episodeRatings = {};
      movie.episodes.forEach((ep) => {
        if (ep.userRating) {
          episodeRatings[ep.id] = ep.userRating;
        }
      });
      setUserEpisodeReviews(episodeRatings);
    }
  }, [movie.episodes.forEach, movie.episodes]);

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
        subtitle={movie.format === "series" ? t("series") : t("movies")}
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
                {movie.image ? (
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Clapperboard
                      className="text-muted-foreground/20"
                      size={64}
                    />
                  </div>
                )}
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

              {movie.needsUpdate && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{t("outdatedData")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("outdatedDataMovieHint")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={refreshData}
                    disabled={updating}
                    size="icon"
                    className="rounded-lg"
                  >
                    <RefreshCcw
                      size={16}
                      className={updating ? "animate-spin" : ""}
                    />
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Episodes List for Series */}
          {movie.format === "series" && movie.episodes && (
            <section className="space-y-8">
              <h2 className="text-2xl font-black">{t("episodes")}</h2>
              {Object.entries(
                movie.episodes.reduce((acc, ep) => {
                  const s = ep.seasonNumber;
                  if (!acc[s]) acc[s] = [];
                  acc[s].push(ep);
                  return acc;
                }, {}),
              ).map(([season, episodes]) => {
                const seasonAvg =
                  episodes.reduce(
                    (sum, ep) => sum + (Number(ep.avgRating) || 0),
                    0,
                  ) / episodes.length;
                return (
                  <div
                    key={season}
                    className="bg-muted/30 rounded-3xl overflow-hidden border border-border"
                  >
                    <div className="p-6 bg-muted/50 flex justify-between items-center border-b border-border">
                      <h3 className="text-xl font-bold">
                        {t("season")} {season}
                      </h3>
                      <div className="flex items-center gap-2 text-orange-500 font-bold">
                        <Star size={18} fill="currentColor" />
                        <span>{seasonAvg.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {episodes.map((ep) => (
                        <div
                          key={ep.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-bold">
                              {ep.episodeNumber}. {ep.title}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Star
                                  size={12}
                                  className={
                                    ep.avgRating ? "text-orange-500" : ""
                                  }
                                  fill={ep.avgRating ? "currentColor" : "none"}
                                />
                                {ep.avgRating
                                  ? Number(ep.avgRating).toFixed(1)
                                  : "-"}
                              </span>
                              <span>
                                {ep.reviewCount} {t("reviews")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() =>
                                  handleEpisodeRate(
                                    ep.id,
                                    userEpisodeReviews[ep.id] === star
                                      ? 0
                                      : star,
                                  )
                                }
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  size={24}
                                  className={
                                    (userEpisodeReviews[ep.id] || 0) >= star
                                      ? "text-orange-500"
                                      : "text-muted-foreground/30"
                                  }
                                  fill={
                                    (userEpisodeReviews[ep.id] || 0) >= star
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Reviews List */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              {t("reviews")}
            </h2>
            <ReviewList
              reviews={reviews}
              currentUserId={userId}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
            />
          </section>
        </div>
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        isEditing={isEditing}
        onClose={() => {
          setShowReviewModal(false);
          setIsEditing(false);
          setNewReview({ rating: 5, comment: "" });
        }}
        onSubmit={handleSubmitReview}
        loading={loading}
        newReview={newReview}
        setNewReview={setNewReview}
        type="movie"
      />
    </div>
  );
}
