"use client";

import { X } from "lucide-react";
import { useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

export default function RssSourceFormModal({ source, onClose, onUpdated }) {
  const [name, setName] = useState(source?.name || "");
  const [url, setUrl] = useState(source?.url || "");
  const [itemsPerPage, setItemsPerPage] = useState(source?.itemsPerPage || 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await fetchAction(
      "/api/admin/news/sources",
      {
        method: source ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source?.id, name, url, itemsPerPage }),
      },
      { fallbackError: "Fehler beim Speichern" },
    );
    if (result.ok) {
      onUpdated();
      onClose();
    }
    return result;
  };

  const handleDelete = async () => {
    if (!confirm("Quelle wirklich löschen?"))
      return { ok: false, error: "Abgebrochen" };
    const result = await fetchAction(
      `/api/admin/news/sources?id=${source.id}`,
      { method: "DELETE" },
      { fallbackError: "Fehler beim Löschen" },
    );
    if (result.ok) {
      onUpdated();
      onClose();
    }
    return result;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-sidebar border border-sidebar-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <h3 className="text-lg font-semibold">
            {source ? "Quelle bearbeiten" : "Neue RSS-Quelle"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="source-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="source-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="z.B. Tagesschau"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="source-url" className="text-sm font-medium">
              RSS-URL
            </label>
            <input
              id="source-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="source-items" className="text-sm font-medium">
              Artikel pro Ladegang
            </label>
            <input
              id="source-items"
              type="number"
              min="1"
              max="50"
              required
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {source && (
              <SubmitButton
                type="button"
                onClick={handleDelete}
                label="Löschen"
                successDuration={0}
                showInlineError={false}
                className="flex-1 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
              />
            )}
            <SubmitButton
              type="submit"
              onClick={handleSubmit}
              label="Speichern"
              savingLabel="Wird gespeichert..."
              successDuration={0}
              showInlineError={false}
              className="flex-[2] px-4 py-2"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
