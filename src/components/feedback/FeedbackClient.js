"use client";
import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import SuggestionForm from "@/components/feedback/SuggestionForm";
import SuggestionList from "@/components/feedback/SuggestionList";
import PageHeader from "@/components/layout/PageHeader";

export default function FeedbackClient({ user }) {
  const t = useTranslations("Feedback");
  const commonT = useTranslations("Common");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSuggestion, setEditingSuggestion] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleVote = async (id) => {
    try {
      const res = await fetch(`/api/feedback/suggestions/${id}/vote`, {
        method: "POST",
      });
      if (res.ok) {
        fetchSuggestions();
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`/api/feedback/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchSuggestions();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/feedback/suggestions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSuggestions();
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  return (
    <>
      <PageHeader
        subtitle={t("subtitle")}
        title={
          <span className="flex items-center gap-3">
            <MessageSquarePlus className="text-primary" size={32} />
            {t("title")}
          </span>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FeedbackForm />
              <SuggestionForm
                onSuggestionAdded={fetchSuggestions}
                editSuggestion={editingSuggestion}
                onCancelEdit={() => setEditingSuggestion(null)}
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-6">{t("suggestions")}</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground">{commonT("loading")}</p>
              </div>
            ) : (
              <SuggestionList
                suggestions={suggestions}
                user={user}
                onVote={handleVote}
                onDelete={handleDelete}
                onEdit={setEditingSuggestion}
                onStatusChange={handleStatusChange}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
