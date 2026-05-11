"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import SaveButton from "@/components/SaveButton";

export default function SuggestionForm({
  onSuggestionAdded,
  editSuggestion,
  onCancelEdit,
}) {
  const t = useTranslations("Feedback");
  const commonT = useTranslations("Common");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (editSuggestion) {
      setTitle(editSuggestion.title);
      setDescription(editSuggestion.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [editSuggestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setStatus("saving");
    try {
      const url = editSuggestion
        ? `/api/feedback/suggestions/${editSuggestion.id}`
        : "/api/feedback";

      const method = editSuggestion ? "PATCH" : "POST";
      const body = editSuggestion
        ? { title, description }
        : { type: "suggestion", title, description };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStatus("saved");
        setTitle("");
        setDescription("");
        onSuggestionAdded();
        if (onCancelEdit) onCancelEdit();
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
      }
    } catch (_err) {
      setStatus("error");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-2">
        {editSuggestion ? t("editSuggestion") : t("newSuggestion")}
      </h2>
      {!editSuggestion && (
        <p className="text-sm text-muted-foreground mb-6">
          {t("suggestionsDesc")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="suggestion-title"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block"
          >
            {t("suggestionTitle")}
          </label>
          <input
            id="suggestion-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("suggestionTitlePlaceholder")}
            className="w-full p-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            required
          />
        </div>
        <div>
          <label
            htmlFor="suggestion-description"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block"
          >
            {t("suggestionDescription")}
          </label>
          <textarea
            id="suggestion-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("suggestionDescriptionPlaceholder")}
            className="w-full min-h-[100px] p-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          {editSuggestion && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
            >
              {commonT("cancel")}
            </button>
          )}
          <SaveButton
            type="submit"
            pending={status === "saving"}
            state={{
              ok: status === "saved" ? true : status === "error" ? false : null,
            }}
            label={
              editSuggestion ? t("updateSuggestion") : t("submitSuggestion")
            }
          />
        </div>
        {status === "saved" && (
          <p className="text-sm text-green-500 text-center mt-2">
            {t("suggestionSuccess")}
          </p>
        )}
      </form>
    </div>
  );
}
