"use client";

import {
  ArrowBigUp,
  Edit2,
  ExternalLink,
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
import { useFeedPreview } from "@/hooks/forum/useFeedPreview";
import { unvotePost, votePost } from "@/lib/forums/actions";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { cn } from "@/lib/utils";

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
      month: "short",
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
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleteSuccess?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Löschen fehlgeschlagen.");
      }
    } catch {
      setDeleteError("Verbindungsfehler beim Löschen.");
    }
  };

  return (
    <div className="bg-transparent overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <Avatar
              src={post.user.image}
              displayName={post.user.displayName}
              size="sm"
              className="ring-2 ring-white/5"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">
                  {post.user.displayName}
                </span>
                {post.user.isCloseFriend && (
                  <Heart size={12} className="fill-accent text-accent" />
                )}
                {post.visibility === 2 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Nur enge Kontakte" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>

          {post.canEdit && (
            <div className="relative" ref={optionsRef}>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground"
              >
                <MoreVertical size={18} />
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit?.(post);
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Edit2 size={16} /> {t("editPost")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleting(true);
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors border-t border-white/5"
                  >
                    <Trash2 size={16} /> {t("deletePost")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {deleteError && (
          <p className="text-destructive text-xs mb-3 px-1">{deleteError}</p>
        )}

        {/* Content Section */}
        <div className="space-y-4">
          {previewLoading ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
          ) : (
            previewImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem] bg-black/20 border border-white/5 shadow-2xl">
                <img
                  src={previewImage}
                  alt={post.title || post.newsTitle || post.otherTitle || "Preview"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>
            )
          )}

          {/* Main Info */}
          <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
            {post.category === "music" && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight text-white">
                      {post.title}
                    </h3>
                    <p className="text-primary font-black uppercase text-xs tracking-widest mt-1">{post.artist}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Music size={20} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: "Spotify", url: post.spotifyUrl },
                    { label: "YouTube Music", url: post.youtubeMusicUrl },
                    { label: "YouTube", url: post.youtubeUrl },
                    { label: "SoundCloud", url: post.soundcloudUrl }
                  ].filter(link => link.url).map(link => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {post.category === "video" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="sticker sticker-lime text-[8px]">{post.videoPlatform}</span>
                </div>
                <a
                  href={post.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4"
                >
                  <span className="font-bold text-lg hover:text-primary transition-colors truncate">
                    {post.videoUrl}
                  </span>
                  <ExternalLink
                    size={18}
                    className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </a>
              </div>
            )}

            {post.category === "news" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="sticker text-[8px] bg-electric-purple text-white">{post.newsSite}</span>
                </div>
                <a
                  href={post.newsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <h3 className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
                    {post.newsTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-black uppercase tracking-widest text-primary">
                    <ExternalLink size={12} /> {t("newsOpenLink")}
                  </div>
                </a>
              </div>
            )}

            {post.category === "other" && (
              <div className="space-y-3">
                <a
                  href={post.otherUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <h3 className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {post.otherTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground break-all truncate">
                    <ExternalLink size={12} className="shrink-0" />{" "}
                    {post.otherUrl}
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Comment */}
          {post.content && (
            <div className="px-2">
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed font-medium">
                {post.content}
              </p>
            </div>
          )}

          {/* Footer / Votes */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleVote}
              disabled={isVoting}
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95",
                hasVoted
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(135,255,157,0.3)]"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
            >
              <ArrowBigUp
                size={18}
                className={hasVoted ? "fill-primary-foreground" : ""}
              />
              <span>{voteCount}</span>
            </button>
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
