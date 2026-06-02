"use client";

import {
  ArrowBigUp,
  Edit2,
  ExternalLink,
  Feather,
  Heart,
  MoreVertical,
  Music,
  Newspaper,
  Play,
  SquarePlay,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/ui/SubmitButton";
import { useFeedPreview } from "@/hooks/forum/useFeedPreview";
import { fetchAction } from "@/lib/asyncAction";
import { unvotePost, votePost } from "@/lib/forums/actions";
import DeleteConfirmModal from "./DeleteConfirmModal";

export default function FeedItem({
  post,
  onEdit,
  onDeleteSuccess,
  onVoteUpdate,
}) {
  const { image: previewImage, loading: previewLoading } = useFeedPreview(post);
  const t = useTranslations("Feed");
  const locale = useLocale();
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const optionsRef = useRef(null);

  const formattedDate = new Date(post.createdAt).toLocaleString(
    locale === "en" ? "en-GB" : "de-DE",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  useEffect(() => {
    if (!showOptions) return;
    function handleOutsideClick(e) {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showOptions]);

  const categoryIcons = {
    text: Feather,
    music: Music,
    video: Play,
    news: Newspaper,
    other: SquarePlay,
  };

  const Icon = categoryIcons[post.category] || SquarePlay;

  const [isVoting, setIsVoting] = useState(false);
  const [voteCount, setVoteCount] = useState(post.voteCount || 0);
  const [hasVoted, setHasVoted] = useState(post.hasVoted || false);

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      if (hasVoted) {
        await unvotePost(post.id);
        setVoteCount((prev) => prev - 1);
        setHasVoted(false);
      } else {
        await votePost(post.id);
        setVoteCount((prev) => prev + 1);
        setHasVoted(true);
      }
      onVoteUpdate?.();
    } catch (error) {
      console.error("Voting failed:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    const result = await fetchAction(
      `/api/posts/${post.id}`,
      { method: "DELETE" },
      { fallbackError: "Verbindungsfehler beim Löschen." },
    );
    if (result.ok) {
      onDeleteSuccess?.();
      return { ok: true };
    }
    setDeleteError(result.error || "Löschen fehlgeschlagen.");
    return { ok: false, error: result.error };
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.user.image}
              displayName={post.user.displayName}
              fallbackIcon={Icon}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {post.user.displayName}
                </span>
                {post.user.isCloseFriend && (
                  <Heart size={14} className="fill-primary text-primary" />
                )}
                {post.visibility === 2 && (
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Nur enge Kontakte"
                  />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {formattedDate}
              </p>
            </div>
          </div>

          {post.canEdit && (
            <div className="relative" ref={optionsRef}>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
              >
                <MoreVertical size={18} />
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-2 w-40 bg-popover border border-border rounded-xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit?.(post);
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <Edit2 size={14} /> {t("editPost")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleting(true);
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                  >
                    <Trash2 size={14} /> {t("deletePost")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {deleteError && (
          <p className="text-destructive text-xs mb-3">{deleteError}</p>
        )}

        {/* Content Section */}
        <div className="space-y-4">
          {previewLoading ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted animate-pulse border border-border" />
          ) : (
            previewImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border">
                <img
                  src={previewImage}
                  alt={
                    post.title || post.newsTitle || post.otherTitle || "Preview"
                  }
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
            )
          )}

          {/* Main Info */}
          {post.category !== "text" && (
            <div className="bg-sidebar-accent/30 rounded-xl p-4 border border-sidebar-border">
              {post.category === "music" && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-lg leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {post.artist}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {post.spotifyUrl && (
                      <a
                        href={post.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[11px] font-medium transition-colors"
                      >
                        Spotify
                      </a>
                    )}
                    {post.youtubeMusicUrl && (
                      <a
                        href={post.youtubeMusicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[11px] font-medium transition-colors"
                      >
                        YouTube Music
                      </a>
                    )}
                    {post.youtubeUrl && (
                      <a
                        href={post.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[11px] font-medium transition-colors"
                      >
                        YouTube
                      </a>
                    )}
                    {post.soundcloudUrl && (
                      <a
                        href={post.soundcloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[11px] font-medium transition-colors"
                      >
                        SoundCloud
                      </a>
                    )}
                  </div>
                </div>
              )}

              {post.category === "video" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-bold">
                    <span>{post.videoPlatform}</span>
                  </div>
                  <a
                    href={post.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4"
                  >
                    <span className="font-medium hover:underline break-all">
                      {post.videoUrl}
                    </span>
                    <ExternalLink
                      size={16}
                      className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  </a>
                </div>
              )}

              {post.category === "news" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-bold">
                    <span>{post.newsSite}</span>
                  </div>
                  <a
                    href={post.newsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <h3 className="font-medium text-lg group-hover:underline leading-snug">
                      {post.newsTitle}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <ExternalLink size={12} /> {t("newsOpenLink")}
                    </div>
                  </a>
                </div>
              )}

              {post.category === "other" && (
                <div className="space-y-2">
                  <a
                    href={post.otherUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <h3 className="font-medium text-lg group-hover:underline leading-snug">
                      {post.otherTitle}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground break-all">
                      <ExternalLink size={12} className="shrink-0" />{" "}
                      {post.otherUrl}
                    </div>
                  </a>
                </div>
              )}
            </div>
          )}

          {post.category === "text" && post.otherTitle && (
            <div className="px-1">
              <h3 className="font-semibold text-lg leading-tight">
                {post.otherTitle}
              </h3>
            </div>
          )}

          {/* Comment */}
          {post.content && (
            <div className="px-1">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>
          )}

          {/* Footer / Votes */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <SubmitButton
              type="button"
              onClick={handleVote}
              loading={isVoting}
              showInlineError={false}
              successDuration={0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                hasVoted
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <ArrowBigUp
                size={20}
                className={hasVoted ? "fill-primary" : ""}
              />
              <span className="text-sm font-medium">{voteCount}</span>
            </SubmitButton>
          </div>
        </div>
      </div>

      {isDeleting && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}
