"use client";

import { Edit2, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import Button from "@/components/ui/Button";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

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
    const url = editingId
      ? `/api/rezepte/reviews/${editingId}`
      : "/api/rezepte/reviews";
    const method = editingId ? "PATCH" : "POST";

    const result = await fetchAction(
      url,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, rating, comment }),
      },
      { fallbackError: tc("saveError") },
    );

    setLoading(false);
    if (!result.ok) return { ok: false, error: result.error };

    setShowForm(false);
    setEditingId(null);
    setRating(5);
    setComment("");
    const reviewsRes = await fetch(`/api/rezepte/reviews?recipeId=${recipeId}`);
    const newReviews = await reviewsRes.json();
    setReviews(newReviews);
    if (onReviewsChange) onReviewsChange(newReviews);
    return { ok: true };
  }

  async function handleDelete(reviewId) {
    if (!confirm(t("deleteReviewConfirm")))
      return { ok: false, error: "Abgebrochen" };

    const result = await fetchAction(
      `/api/rezepte/reviews/${reviewId}`,
      { method: "DELETE" },
      { fallbackError: tc("error") },
    );
    if (!result.ok) return { ok: false, error: result.error };

    const reviewsRes = await fetch(`/api/rezepte/reviews?recipeId=${recipeId}`);
    const newReviews = await reviewsRes.json();
    setReviews(newReviews);
    if (onReviewsChange) onReviewsChange(newReviews);
    return { ok: true };
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
          className="p-6 bg-sidebar-accent/20 border border-sidebar-border rounded-3xl space-y-6 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              {t("rating")}
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRating(val)}
                  className={`p-2 rounded-xl transition-all ${
                    rating >= val
                      ? "text-orange-500 bg-orange-500/10 border border-orange-500/20 shadow-sm"
                      : "text-muted-foreground bg-muted hover:bg-muted/80 border border-transparent"
                  }`}
                >
                  <Star
                    size={24}
                    fill={rating >= val ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="review-comment"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1"
            >
              {t("stepDescription")}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none"
              placeholder="..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {tc("cancel")}
            </button>
            <SubmitButton
              type="submit"
              loading={loading}
              label={t("saveRecipe")}
              successDuration={0}
              successToast={tc("saved")}
              errorToast={tc("saveError")}
              showInlineError={false}
              className="shadow-lg shadow-primary/20"
            />
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
                  <SubmitButton
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(review.id)}
                    icon={<Trash2 size={16} />}
                    showInlineError={false}
                    successDuration={0}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
