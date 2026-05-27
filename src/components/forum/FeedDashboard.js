"use client";

import { ArrowRight, Hash, Loader2, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { joinForum } from "@/lib/forums/actions";

export default function FeedDashboard() {
  const t = useTranslations("Feed");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchOverview() {
    try {
      const res = await fetch("/api/forums/overview");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch forums overview:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  async function handleJoin(forumId) {
    try {
      await joinForum(forumId);
      fetchOverview();
    } catch (error) {
      console.error("Failed to join forum:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader title="Unterhaltung" icon={MessageSquare} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={MessageSquare}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Joined Forums */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Hash className="text-primary" size={20} />
                {t("myForums")}
              </h2>
            </div>

            {data?.joined?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.joined.map((forum) => (
                  <Link
                    key={forum.id}
                    href={`/forum/${forum.id}`}
                    className="group relative bg-sidebar border border-sidebar-border rounded-lg-custom overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col"
                  >
                    <div className="aspect-[21/9] w-full bg-muted relative">
                      {forum.image ? (
                        <img
                          src={forum.image}
                          alt={forum.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Hash size={40} />
                        </div>
                      )}
                      {forum.hasUnread && (
                        <div className="absolute top-4 right-4">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{forum.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {forum.description || "Keine Beschreibung vorhanden."}
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            <span>
                              {t("newPostsCount", { count: forum.postCount })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight
                          size={18}
                          className="text-primary group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-sidebar border border-sidebar-border rounded-3xl text-muted-foreground">
                <p>{t("noForums")}</p>
              </div>
            )}
          </section>

          {/* Other Forums */}
          {data?.notJoined?.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Plus className="text-primary" size={20} />
                {t("discoverForums")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.notJoined.map((forum) => (
                  <div
                    key={forum.id}
                    className="bg-sidebar border border-sidebar-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {forum.image ? (
                        <img
                          src={forum.image}
                          alt={forum.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Hash size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {forum.name}
                      </h4>
                      <button
                        onClick={() => handleJoin(forum.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("join")}
                      </button>
                    </div>
                    <Link
                      href={`/forum/${forum.id}`}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
