"use client";

import { Plus, SquarePlay } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Notification from "@/components/Notification";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useIsMobile";
import FeedFilters from "./FeedFilters";
import FeedFormModal from "./FeedFormModal";
import FeedList from "./FeedList";

export default function FeedDashboard() {
  const t = useTranslations("Feed");
  const isMobile = useIsMobile();
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
      } else {
        const errorData = await res.json();
        setNotification({
          type: "error",
          message: errorData.error || t("loadError"),
        });
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
      <PageHeader subtitle={t("subtitle")} title={t("title")} icon={SquarePlay}>
        {!isMobile && (
          <Button type="button" onClick={handleCreatePost}>
            <Plus size={18} />
            {t("newPost")}
          </Button>
        )}
      </PageHeader>

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

      {isMobile && (
        <Button
          type="button"
          onClick={handleCreatePost}
          className="fixed bottom-6 right-6 w-14 h-14 z-50 shadow-lg"
          size="icon"
          aria-label={t("newPost")}
        >
          <Plus size={24} />
        </Button>
      )}

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
