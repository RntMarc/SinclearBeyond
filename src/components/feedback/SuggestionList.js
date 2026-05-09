"use client";
import { Edit2, ThumbsUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SuggestionList({
  suggestions,
  currentUserId,
  onVote,
  onDelete,
  onEdit,
}) {
  const t = useTranslations("Feedback");
  const commonT = useTranslations("Common");

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
        <p className="text-muted-foreground">{t("noSuggestions")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm flex gap-6"
        >
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onVote(suggestion.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                suggestion.hasUpvoted
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
              title={t("upvote")}
            >
              <ThumbsUp
                size={20}
                fill={suggestion.hasUpvoted ? "currentColor" : "none"}
              />
            </button>
            <span className="text-xs font-bold mt-1 text-muted-foreground">
              {suggestion.upvotes}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold leading-tight truncate">
                {suggestion.title}
              </h3>
              {suggestion.userId === currentUserId &&
                suggestion.upvotes <= (suggestion.hasUpvoted ? 1 : 0) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEdit(suggestion)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      title={t("editSuggestion")}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t("deleteConfirm"))) {
                          onDelete(suggestion.id);
                        }
                      }}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                      title={commonT("delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
            </div>
            {suggestion.description && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                {suggestion.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
