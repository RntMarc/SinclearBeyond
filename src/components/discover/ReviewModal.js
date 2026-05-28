"use client";

import { Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import SaveButton from "@/components/SaveButton";
import Button from "@/components/ui/Button";

export default function ReviewModal({
  placeId,
  onClose,
  onAdded,
  initialData = null,
}) {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");

  const [rating, setRating] = useState(initialData?.rating || 5);
  const [comment, setComment] = useState(initialData?.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = initialData
        ? `/api/discover/reviews/${initialData.id}`
        : "/api/discover/reviews";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, rating, comment }),
      });

      if (res.ok) {
        onAdded();
        handleClose();
      } else {
        const data = await res.json();
        setError(data.error || t("errorUpdate"));
      }
    } catch (_err) {
      setError(t("errorUpdate"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0"
        onClick={handleClose}
        aria-label={tCommon("close")}
      />

      <div
        className={`relative w-full max-w-lg bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold">
              {initialData ? t("editReview") : t("addReview")}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[2rem] text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">
              {t("rating")}
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`p-1 transition-colors ${rating >= s ? "text-orange-500" : "text-muted-foreground/30"}`}
                >
                  <Star
                    size={32}
                    fill={rating >= s ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="review-comment"
              className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1"
            >
              {t("comment")}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="..."
              rows={4}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-[2rem] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              onClick={handleClose}
              variant="ghost"
              className="px-4"
            >
              {tCommon("cancel")}
            </Button>
            <SaveButton loading={saving} onClick={handleSubmit}>
              {tCommon("save")}
            </SaveButton>
          </div>
        </form>
      </div>
    </div>
  );
}
