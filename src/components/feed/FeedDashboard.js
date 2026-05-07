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
    <div className="max-w-3xl mx-auto w-full px-6 py-10">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
            {t("subtitle")}
          </p>
          <h1 className="text-4xl font-light text-foreground">{t("title")}</h1>
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
