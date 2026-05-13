"use client";

import { Edit2, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/Avatar";

export default function ReviewList({
  reviews,
  currentUserId,
  onEdit,
  onDelete,
}) {
  const t = useTranslations("Reviews");

  if (reviews.length === 0) {
    return (
      <div className="py-20 border-2 border-dashed border-border rounded-3xl text-center">
        <p className="text-muted-foreground italic">{t("noReviews")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {reviews.map((review) => (
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
                <p className="font-bold text-sm">{review.user.displayName}</p>
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

          {review.platform && (
            <div className="inline-block px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold uppercase">
              {t(`platforms.${review.platform}`)}
            </div>
          )}

          <p className="text-foreground leading-relaxed">{review.comment}</p>

          {currentUserId === review.user.id && (
            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                aria-label={t("edit")}
              >
                <Edit2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(review.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={t("delete")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
