"use client";

import { Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";

const PLATFORMS = [
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

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  newReview,
  setNewReview,
  type = "game",
}) {
  const t = useTranslations("Reviews");
  const tc = useTranslations("Common");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        aria-label={tc("close")}
      />
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-black">{t("addReview")}</h3>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="p-6 space-y-6"
        >
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
                  aria-label={`${val} ${t("rating")}`}
                  onClick={() => setNewReview({ ...newReview, rating: val })}
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

          {type === "game" && (
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
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {t(`platforms.${p}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              onClick={onClose}
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
  );
}
