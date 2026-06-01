"use client";

import { Edit2, Loader2, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import Button from "@/components/ui/Button";

export default function RecipeReviewSection({
  recipeId,
  reviews: initialReviews,
  currentUserId,
  onReviewsChange,
}) {
  const t = useTranslations("Recipes");
  const tc = useTranslations("Common");

  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId
        ? `/api/rezepte/reviews/${editingId}`
        : "/api/rezepte/reviews";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, rating, comment }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setRating(5);
        setComment("");
        const reviewsRes = await fetch(
          `/api/rezepte/reviews?recipeId=${recipeId}`,
        );
        const newReviews = await reviewsRes.json();
        setReviews(newReviews);
        if (onReviewsChange) onReviewsChange(newReviews);
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId) {
    if (!confirm(t("deleteReviewConfirm"))) return;
    try {
      const res = await fetch(`/api/rezepte/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const reviewsRes = await fetch(
          `/api/rezepte/reviews?recipeId=${recipeId}`,
        );
        const newReviews = await reviewsRes.json();
        setReviews(newReviews);
        if (onReviewsChange) onReviewsChange(newReviews);
      }
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  }

  function startEdit(review) {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment || "");
    setShowForm(true);
  }

  const userReview = reviews.find((r) => r.userId === currentUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-3">
          {t("rating")}
        </h2>
        {!userReview && (
          <Button
            type="button"
            onClick={() => {
              setEditingId(null);
              setRating(5);
              setComment("");
              setShowForm(true);
            }}
            size="compact"
          >
            {t("addReview")}
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-muted/30 border border-border rounded-3xl space-y-4"
        >
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRating(val)}
                className={`p-1.5 rounded-lg transition-all ${rating >= val ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground bg-muted hover:bg-muted/80"}`}
              >
                <Star
                  size={22}
                  fill={rating >= val ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[80px] resize-none"
            placeholder="..."
          />
          <div className="flex gap-3">
            <Button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              variant="secondary"
              size="compact"
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="compact"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {t("saveRecipe")}
            </Button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="py-16 border-2 border-dashed border-border rounded-3xl text-center">
          <p className="text-muted-foreground italic">{t("noReviews")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-5 bg-card border border-border rounded-3xl shadow-sm space-y-3"
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
                  <span className="text-sm font-black">{review.rating}</span>
                </div>
              </div>

              {review.comment && (
                <p className="text-foreground leading-relaxed text-sm">
                  {review.comment}
                </p>
              )}

              {currentUserId === review.userId && (
                <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => startEdit(review)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
