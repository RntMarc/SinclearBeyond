"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FeedFilters({
  activeCategory,
  onCategoryChange,
  onlyCloseFriends,
  onOnlyCloseFriendsChange,
}) {
  const t = useTranslations("Feed");

  const CATEGORIES = [
    { id: "all", label: t("categories.all") },
    { id: "music", label: t("categories.music") },
    { id: "video", label: t("categories.video") },
    { id: "news", label: t("categories.news") },
    { id: "other", label: t("categories.other") },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-1 bg-sidebar-accent/50 p-1 rounded-[2rem] border border-sidebar-border max-w-full overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`px-4 py-1.5 rounded-[2rem] text-sm font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onOnlyCloseFriendsChange(!onlyCloseFriends)}
        className={`flex items-center gap-2 px-4 py-2 rounded-[2rem] border transition-all text-sm font-medium ${
          onlyCloseFriends
            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
            : "bg-sidebar-accent/50 border-sidebar-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <Heart size={16} fill={onlyCloseFriends ? "currentColor" : "none"} />
        <span className="hidden xs:inline">{t("onlyCloseFriends")}</span>
        <span className="xs:hidden font-light">{t("closeFriendsShort")}</span>
      </button>
    </div>
  );
}
