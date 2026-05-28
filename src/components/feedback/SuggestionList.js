"use client";
import { Edit2, ThumbsUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/Avatar";

const STATUS_COLORS = {
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  planned: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  next: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  in_progress: "bg-blue-600/10 text-blue-600 border-blue-600/20",
  done: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  rejected: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  later: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const FROZEN_STATUSES = ["done", "cancelled", "rejected"];

export default function SuggestionList({
  suggestions,
  user,
  onVote,
  onDelete,
  onEdit,
  onStatusChange,
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

  const activeSuggestions = suggestions.filter(
    (s) => !FROZEN_STATUSES.includes(s.status),
  );
  const frozenSuggestions = suggestions.filter((s) =>
    FROZEN_STATUSES.includes(s.status),
  );

  const renderSuggestion = (suggestion, isFrozen = false) => {
    const isVotingDisabled = FROZEN_STATUSES.includes(suggestion.status);

    return (
      <div
        key={suggestion.id}
        className={`bg-card border border-border rounded-2xl p-6 shadow-sm flex gap-6 transition-opacity ${
          isFrozen ? "opacity-60 grayscale-[0.5]" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => !isVotingDisabled && onVote(suggestion.id)}
            disabled={isVotingDisabled}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              suggestion.hasUpvoted
                ? "bg-primary text-primary-foreground"
                : isVotingDisabled
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            title={isVotingDisabled ? "" : t("upvote")}
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  src={suggestion.userImage}
                  displayName={suggestion.userDisplayName}
                  size="xs"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {suggestion.userDisplayName}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold leading-tight truncate">
                  {suggestion.title}
                </h3>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                    STATUS_COLORS[suggestion.status] ||
                    "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {t(`status.${suggestion.status}`)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user?.isAdmin && (
                <select
                  value={suggestion.status}
                  onChange={(e) =>
                    onStatusChange(suggestion.id, e.target.value)
                  }
                  className="text-xs bg-muted border-none rounded-lg p-1 px-2 focus:ring-1 focus:ring-primary"
                >
                  {Object.keys(STATUS_COLORS).map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`)}
                    </option>
                  ))}
                </select>
              )}

              {suggestion.userId === user?.id &&
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
          </div>
          {suggestion.description && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              {suggestion.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {activeSuggestions.length > 0 && (
        <div className="space-y-4">
          {activeSuggestions.map((s) => renderSuggestion(s, false))}
        </div>
      )}

      {frozenSuggestions.length > 0 && (
        <div className="space-y-4">
          <hr className="border-border" />
          {frozenSuggestions.map((s) => renderSuggestion(s, true))}
        </div>
      )}
    </div>
  );
}
