"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Button from "@/components/ui/Button";
import SubmitButton from "@/components/ui/SubmitButton";
import { createChangelogEntry } from "@/lib/changelog/actions";

export default function AddChangelogModal({ isOpen, onClose }) {
  const t = useTranslations("Changelog");
  const tc = useTranslations("Common");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "feature",
  });

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createChangelogEntry(formData);
      onClose();
      setFormData({ title: "", content: "", category: "feature" });
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error: tc("saveError") };
    }
  }

  const categories = [
    "feature",
    "bugfix",
    "improvement",
    "maintenance",
    "security",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label={tc("close")}
      />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-black">{t("newEntryTitle")}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="changelog-title"
              className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
            >
              {t("form.title")}
            </label>
            <input
              id="changelog-title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t("form.category")}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    formData.category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="changelog-content"
              className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
            >
              {t("form.content")}
            </label>
            <textarea
              id="changelog-content"
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full p-4 bg-muted border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px] text-sm resize-none"
              placeholder="..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              {tc("cancel")}
            </Button>
            <SubmitButton
              type="submit"
              onClick={handleSubmit}
              label={t("form.save")}
              savingLabel={tc("saving")}
              successDuration={0}
              showInlineError={false}
              className="flex-1 shadow-lg shadow-primary/20"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
