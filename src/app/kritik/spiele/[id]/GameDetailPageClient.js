"use client";

import {
  Calendar,
  Gamepad2,
  Loader2,
  MessageSquare,
  Plus,
  Share2,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import SubPageHeader from "@/components/layout/SubPageHeader";

export default function GameDetailPageClient({
  game: initialGame,
  reviews: initialReviews,
}) {
  const t = useTranslations("Reviews");
  const tc = useTranslations("Common");

  const [game, setGame] = useState(initialGame);
  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    platform: "pc_windows",
  });

  const platforms = [
    "pc_linux",
    "pc_windows",
    "pc_mac",
    "nintendo_switch",
    "playstation",
    "xbox",
    "android",
    "ios",
    "web",
    "other_emulator",
  ];

  async function handleSubmitReview(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/kritik/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: game.id,
          ...newReview,
        }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        // Refresh reviews and game data
        const [reviewsRes, gameRes] = await Promise.all([
          fetch(`/api/kritik/reviews?itemId=${game.id}`),
          fetch(`/api/kritik/items/${game.id}`),
        ]);
        setReviews(await reviewsRes.json());
        setGame(await gameRes.json());
        setNewReview({ rating: 5, comment: "", platform: "pc_windows" });
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setLoading(false);
    }
  }

  const share = () => {
    if (navigator.share) {
      navigator.share({
        title: game.title,
        text: `Schau dir meine Bewertung zu ${game.title} auf Sinclear Beyond an!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link kopiert!");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <SubPageHeader
        title={game.title}
        subtitle={t("games")}
        backHref="/kritik/spiele"
      >
        <button
          onClick={share}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <Share2 size={20} />
        </button>
      </SubPageHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12">
          {/* Game Header / Cover */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-muted shadow-xl border border-border">
                {game.image
                  ? <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2
                        className="text-muted-foreground/20"
                        size={64}
                      />
                    </div>}
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  {game.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {game.releaseDate && (
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar size={16} />
                      {game.releaseDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-orange-500">
                    <Star size={32} fill="currentColor" />
                    <span className="text-3xl font-black">
                      {game.avgRating ? Number(game.avgRating).toFixed(1) : "-"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    {game.reviewCount} {t("reviews")}
                  </p>
                </div>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  <Plus size={20} />
                  {t("addReview")}
                </button>
              </div>

              {game.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {game.description}
                </p>
              )}
            </div>
          </section>

          {/* Reviews List */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <MessageSquare className="text-primary" size={24} />
              {t("reviews")}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {reviews.length > 0
                ? reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={review.user.image}
                            displayName={review.user.displayName}
                            size="sm"
                          />
                          <div>
                            <p className="font-bold text-sm">
                              {review.user.displayName}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm font-black">
                            {review.rating}
                          </span>
                        </div>
                      </div>

                      {review.platform && (
                        <div className="inline-block px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold uppercase">
                          {t(`platforms.${review.platform}`)}
                        </div>
                      )}

                      <p className="text-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))
                : <div className="py-20 border-2 border-dashed border-border rounded-3xl text-center">
                    <p className="text-muted-foreground italic">
                      {t("noReviews")}
                    </p>
                  </div>}
            </div>
          </section>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setShowReviewModal(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-black">{t("addReview")}</h3>
            </div>
            <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
                  htmlFor="rating-group"
                >
                  {t("rating")}
                </label>
                <div id="rating-group" className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setNewReview({ ...newReview, rating: val })
                      }
                      className={`p-2 rounded-xl transition-all ${newReview.rating >= val ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground bg-muted hover:bg-muted/80"}`}
                    >
                      <Star
                        size={24}
                        fill={newReview.rating >= val ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
                  htmlFor="platform-select"
                >
                  {t("platform")}
                </label>
                <select
                  id="platform-select"
                  value={newReview.platform}
                  onChange={(e) =>
                    setNewReview({ ...newReview, platform: e.target.value })
                  }
                  className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {t(`platforms.${p}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
                  htmlFor="comment-textarea"
                >
                  {t("comment")}
                </label>
                <textarea
                  id="comment-textarea"
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  className="w-full p-4 bg-muted border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] text-sm resize-none"
                  placeholder="..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {t("saveReview")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
