"use client";

import { useTranslations } from "next-intl";
import FeedItem from "./FeedItem";

export default function FeedList({ posts, loading, onEdit, onDeleteSuccess }) {
  const t = useTranslations("Feed");
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-sidebar-accent/50 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-sidebar-accent/30 rounded-3xl border border-dashed border-sidebar-border">
        <p className="text-muted-foreground">{t("noPosts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <FeedItem
          key={post.id}
          post={post}
          onEdit={onEdit}
          onDeleteSuccess={onDeleteSuccess}
        />
      ))}
    </div>
  );
}
