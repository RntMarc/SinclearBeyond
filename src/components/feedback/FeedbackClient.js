"use client";
import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import SuggestionForm from "@/components/feedback/SuggestionForm";
import SuggestionList from "@/components/feedback/SuggestionList";

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
      <header className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-8 md:px-10 md:py-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1 block">
            {t("subtitle")}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            <MessageSquarePlus className="text-primary" size={32} />
            {t("title")}
          </h1>
        </div>
      </header>

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
            {loading
              ? <div className="flex justify-center py-12">
                  <p className="text-muted-foreground">{commonT("loading")}</p>
                </div>
              : <SuggestionList
                  suggestions={suggestions}
                  currentUserId={user?.id}
                  onVote={handleVote}
                  onDelete={handleDelete}
                  onEdit={setEditingSuggestion}
                />}
          </section>
        </div>
      </main>
    </>
  );
}
