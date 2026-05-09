"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Notification from "@/components/Notification";
import FeedFilters from "./FeedFilters";
import FeedFormModal from "./FeedFormModal";
import FeedList from "./FeedList";

export default function FeedDashboard() {
  const t = useTranslations("Feed");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [onlyCloseFriends, setOnlyCloseFriends] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        category,
        onlyCloseFriends: onlyCloseFriends.toString(),
      });
      const res = await fetch(`/api/feed?${query}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (_error) {
      setNotification({
        type: "error",
        message: t("loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [category, onlyCloseFriends, t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleSuccess = (message) => {
    setNotification({ type: "success", message });
    fetchPosts();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {t("subtitle")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {t("title")}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleCreatePost}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 w-fit"
          >
            <Plus size={18} />
            {t("newPost")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          <FeedFilters
            activeCategory={category}
            onCategoryChange={setCategory}
            onlyCloseFriends={onlyCloseFriends}
            onOnlyCloseFriendsChange={setOnlyCloseFriends}
          />

          <FeedList
            posts={posts}
            loading={loading}
            onEdit={handleEditPost}
            onDeleteSuccess={() => handleSuccess(t("deleteSuccess"))}
          />
        </div>
      </div>

      {isModalOpen && (
        <FeedFormModal
          post={editingPost}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(msg) => {
            setIsModalOpen(false);
            handleSuccess(msg);
          }}
        />
      )}
    </div>
  );
}
