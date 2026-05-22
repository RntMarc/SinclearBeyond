"use client";

import { ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { useState, useRef } from "react";
import { createForum, updateForum, deleteForum } from "@/lib/forums/actions";

export default function ForumFormModal({ forum, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(forum?.image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    if (removeImage) {
      formData.set("removeImage", "true");
    }

    try {
      if (forum) {
        await updateForum(forum.id, formData);
      } else {
        await createForum(formData);
      }
      onUpdated();
      onClose();
    } catch (error) {
      console.error("Failed to save forum:", error);
      alert("Fehler beim Speichern des Forums.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Bist du sicher, dass du dieses Forum löschen willst? Alle Posts darin werden ebenfalls gelöscht!")) return;

    setLoading(true);
    try {
      await deleteForum(forum.id);
      onUpdated();
      onClose();
    } catch (error) {
      console.error("Failed to delete forum:", error);
      alert("Fehler beim Löschen des Forums.");
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-sidebar border border-sidebar-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">
          <h2 className="text-lg font-medium">
            {forum ? "Forum bearbeiten" : "Neues Forum anlegen"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-sidebar-accent rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-muted overflow-hidden border-2 border-dashed border-sidebar-border flex items-center justify-center">
                  {imagePreview && !removeImage ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-muted-foreground" size={32} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl text-xs font-medium"
                >
                  Bild wählen
                </button>
              </div>

              {imagePreview && !removeImage && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setRemoveImage(true);
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Bild entfernen
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                Name
              </label>
              <input
                required
                name="name"
                defaultValue={forum?.name}
                placeholder="z.B. Gaming, Musik, News..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">
                Beschreibung
              </label>
              <textarea
                name="description"
                defaultValue={forum?.description}
                placeholder="Worum geht es in diesem Forum?"
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {forum && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="p-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-transparent hover:border-destructive/20"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium hover:bg-sidebar-accent rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[120px]"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Speichern"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
