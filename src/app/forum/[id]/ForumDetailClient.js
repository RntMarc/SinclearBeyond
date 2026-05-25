"use client";

import {
  Hash,
  Loader2,
  Plus,
  Users,
  ArrowLeft,
  Info,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import SubPageHeader from "@/components/layout/SubPageHeader";
import FeedList from "@/components/forum/FeedList";
import FeedFormModal from "@/components/forum/FeedFormModal";
import LeaveConfirmModal from "@/components/forum/LeaveConfirmModal";
import { joinForum, leaveForum, markForumAsRead } from "@/lib/forums/actions";
import Avatar from "@/components/Avatar";

export default function ForumDetailClient({ forumId, userId }) {
  const t = useTranslations("Feed");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' or 'info'

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/forums/${forumId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Mark as read when entering
        markForumAsRead(forumId);
      }
    } catch (error) {
      console.error("Failed to fetch forum data:", error);
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleJoin() {
    try {
      if (data.isMember) {
        setShowLeaveModal(true);
      } else {
        await joinForum(forumId);
        fetchData();
      }
    } catch (error) {
      console.error("Join/Leave failed:", error);
    }
  }

  async function handleConfirmLeave() {
    try {
      await leaveForum(forumId);
      setShowLeaveModal(false);
      fetchData();
    } catch (error) {
      console.error("Leave failed:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!data?.forum) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Forum nicht gefunden.</p>
        <Link
          href="/forum"
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const InfoSidebar = () => (
    <div className="bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden">
      <div className="aspect-video w-full bg-muted">
        {data.forum.image ? (
          <img
            src={data.forum.image}
            alt={data.forum.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Hash size={40} />
          </div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold">{data.forum.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {data.forum.description || "Keine Beschreibung vorhanden."}
          </p>
        </div>

        <div className="pt-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users size={14} />
              {data.members.length} {t("members")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.members.slice(0, 10).map((member) => (
              <Avatar
                key={member.id}
                src={member.image}
                displayName={member.displayName}
                size="sm"
              />
            ))}
            {data.members.length > 10 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                +{data.members.length - 10}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-sidebar-border">
          <button
            onClick={handleToggleJoin}
            className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              data.isMember
                ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {data.isMember ? t("leave") : t("join")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-background relative">
      <SubPageHeader title={data.forum.name} subtitle="Forum" backHref="/forum">
        <div className="hidden md:flex items-center gap-3">
          {data.isMember && (
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              {t("newPost")}
            </button>
          )}
        </div>
      </SubPageHeader>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-border bg-card sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === "posts"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          <MessageSquare size={18} />
          {t("tabs.posts")}
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === "info"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          <Info size={18} />
          {t("tabs.info")}
        </button>
      </div>

      <div className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Info Tab Content */}
          <div
            className={`${activeTab === "info" ? "block" : "hidden"} lg:block lg:col-span-1 space-y-6`}
          >
            <InfoSidebar />
          </div>

          {/* Feed / Posts Tab Content */}
          <div
            className={`${activeTab === "posts" ? "block" : "hidden"} lg:block lg:col-span-3`}
          >
            <FeedList
              posts={data.posts}
              onEdit={(post) => {
                setEditingPost(post);
                setShowFormModal(true);
              }}
              onDeleteSuccess={fetchData}
            />
          </div>
        </div>
      </div>

      {/* FAB for Mobile */}
      {data.isMember && (
        <button
          onClick={() => setShowFormModal(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {showFormModal && (
        <FeedFormModal
          forumId={forumId}
          editPost={editingPost}
          onClose={() => {
            setShowFormModal(false);
            setEditingPost(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingPost(null);
            fetchData();
          }}
        />
      )}

      {showLeaveModal && (
        <LeaveConfirmModal
          onConfirm={handleConfirmLeave}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}
    </div>
  );
}
