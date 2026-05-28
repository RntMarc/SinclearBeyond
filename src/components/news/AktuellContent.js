"use client";

import {
  Archive,
  ArrowBigUp,
  Clock,
  ExternalLink,
  Newspaper,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

function getNumCols(isMobile) {
  if (typeof window === "undefined") return 1;
  if (isMobile) return 1;
  if (window.innerWidth >= 1280) return 3;
  if (window.innerWidth >= 1024) return 2;
  return 1;
}

const columnIds = ["primary", "secondary", "tertiary"];

function distribute(items, n) {
  const list = Array.isArray(items) ? items : [];
  const cols = Array.from({ length: n }, (_, index) => ({
    id: columnIds[index] || `column-${index + 1}`,
    items: [],
  }));
  list.forEach((item, i) => {
    cols[i % n].items.push(item);
  });
  return cols;
}

export default function AktuellContent({ _userId }) {
  const isMobile = useIsMobile();
  const t = useTranslations("News");
  const [activeTab, setActiveTab] = useState("new"); // "new", "archive"
  const [items, setItems] = useState([]);
  const [importantItems, setImportantItems] = useState([]);
  const [columns, setColumns] = useState([{ id: columnIds[0], items: [] }]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchImportant = useCallback(async () => {
    try {
      const { getImportantNews } = await import("@/lib/news/actions");
      const data = await getImportantNews();
      setImportantItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching important news:", error);
    }
  }, []);

  const fetchArchived = useCallback(async () => {
    try {
      const { getArchivedNews } = await import("@/lib/news/actions");
      const data = await getArchivedNews();
      setItems(Array.isArray(data) ? data : []);
      setHasMore(false);
    } catch (error) {
      console.error("Error fetching archived news:", error);
    }
  }, []);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news?page=1");
      const data = await res.json();
      const articles = res.ok && Array.isArray(data) ? data : [];
      setItems(articles);
      setPage(1);
      setHasMore(articles.length > 0);
    } catch (error) {
      console.error("Error fetching initial news:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "new") {
      fetchImportant();
      fetchInitial();
    } else {
      fetchArchived();
    }
  }, [activeTab, fetchImportant, fetchInitial, fetchArchived]);

  useEffect(() => {
    const n = getNumCols(isMobile);
    setColumns(distribute(items, n));
  }, [items, isMobile]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || activeTab === "archive") return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/news?page=${nextPage}`);
      const data = await res.json();
      const articles = res.ok && Array.isArray(data) ? data : [];
      if (articles.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...articles]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Error loading more news:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, activeTab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading, hasMore, loadMore]);

  const handleUpvote = async (article) => {
    try {
      const res = await fetch("/api/news/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      });
      if (res.ok) {
        // Optimistic update
        setItems((prev) =>
          prev.map((item) =>
            item.link === article.link
              ? { ...item, isUpvoted: true, upvotes: (item.upvotes || 0) + 1 }
              : item,
          ),
        );
        setImportantItems((prev) => {
          const existing = prev.find((p) => p.url === article.link);
          if (existing) {
            return prev.map((p) =>
              p.url === article.link
                ? { ...p, upvoteCount: (p.upvoteCount || 0) + 1 }
                : p,
            );
          }
          return prev; // Important list might need full refresh or just wait for revalidate
        });
        fetchImportant();
      }
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-sidebar border border-sidebar-border rounded-[2rem] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2rem] text-sm font-medium transition-all ${
            activeTab === "new"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          }`}
        >
          <Newspaper size={16} />
          {t("newArticles")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archive")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2rem] text-sm font-medium transition-all ${
            activeTab === "archive"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          }`}
        >
          <Archive size={16} />
          {t("archive")}
        </button>
      </div>

      {activeTab === "new" && importantItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 px-2 text-primary">
            <ArrowBigUp className="fill-current" size={24} />
            {t("important")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {importantItems.map((article) => (
              <NewsItem
                key={article.id}
                article={{
                  title: article.title,
                  link: article.url,
                  sourceName: article.sourceName,
                  sourceIcon: article.sourceIcon,
                  pubDate: article.savedAt,
                  upvotes: article.upvoteCount,
                  isUpvoted: true, // If it's in this list, we assume it's upvoted by someone, but we might want personal state
                }}
                onUpvote={() => {}} // Already upvoted or from DB
                isSaved={true}
              />
            ))}
          </div>
          <div className="h-px bg-border my-8" />
        </section>
      )}

      <div className="flex gap-6 items-start">
        {columns.map((col) => (
          <div key={col.id} className="flex-1 flex flex-col gap-6">
            {col.items.map((item) => (
              <NewsItem
                key={`${item.sourceId || item.sourceName || "news"}-${
                  item.link || item.id || item.title
                }`}
                article={item}
                onUpvote={() => handleUpvote(item)}
              />
            ))}
          </div>
        ))}
      </div>

      <div ref={loaderRef} className="flex justify-center py-12">
        {loading && (
          <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="w-2 h-2 bg-primary rounded-full animation-delay-200" />
            <div className="w-2 h-2 bg-primary rounded-full animation-delay-400" />
            <span className="ml-2 text-sm uppercase tracking-widest font-medium">
              {t("loading")}
            </span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-xs text-muted-foreground uppercase tracking-widest bg-sidebar px-4 py-2 rounded-full border border-sidebar-border">
            {t("allLoaded")}
          </p>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center p-12 bg-sidebar border border-sidebar-border rounded-xl-custom w-full">
            <p className="text-muted-foreground italic">{t("noArticles")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsItem({ article, onUpvote, _isSaved }) {
  const t = useTranslations("News");
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="group bg-sidebar border border-sidebar-border rounded-xl-custom overflow-hidden flex flex-col hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1">
      {article.previewImage && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={article.previewImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => (e.target.parentElement.style.display = "none")}
          />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {article.sourceIcon && (
              <img
                src={article.sourceIcon}
                alt=""
                className="w-5 h-5 rounded flex-shrink-0"
              />
            )}
            <span className="text-xs font-medium text-muted-foreground truncate">
              {article.sourceName}
            </span>
          </div>
          {date && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
              <Clock size={12} />
              {date}
            </div>
          )}
        </div>

        <h3 className="font-semibold text-lg leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>

        {article.content && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {article.content.replace(/<[^>]*>?/gm, "")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUpvote();
            }}
            disabled={article.isUpvoted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2rem] transition-all ${
              article.isUpvoted
                ? "bg-primary/10 text-primary"
                : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
            }`}
          >
            <ArrowBigUp
              className={article.isUpvoted ? "fill-current" : ""}
              size={20}
            />
            <span className="text-sm font-bold">{article.upvotes || 0}</span>
          </button>

          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-sidebar-accent text-sidebar-accent-foreground rounded-[2rem] text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {t("read")}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
