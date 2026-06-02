"use client";

import { ImageIcon, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { createForum, deleteForum, updateForum } from "@/lib/forums/actions";

export default function ForumFormModal({ forum, onClose, onUpdated }) {
  const [imagePreview, setImagePreview] = useState(forum?.image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();

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
      return { ok: true };
    } catch (error) {
      console.error("Failed to save forum:", error);
      return { ok: false, error: "Fehler beim Speichern des Forums." };
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Bist du sicher, dass du dieses Forum löschen willst? Alle Posts darin werden ebenfalls gelöscht!",
      )
    )
      return { ok: false, error: "Abgebrochen" };

    try {
      await deleteForum(forum.id);
      onUpdated();
      onClose();
      return { ok: true };
    } catch (error) {
      console.error("Failed to delete forum:", error);
      return { ok: false, error: "Fehler beim Löschen des Forums." };
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
            type="button"
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
                    // biome-ignore lint/performance/noImgElement: Data URL preview, can't use next/Image
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
              <label
                htmlFor="forum-name"
                className="text-sm font-medium text-muted-foreground ml-1"
              >
                Name
              </label>
              <input
                id="forum-name"
                required
                name="name"
                defaultValue={forum?.name}
                placeholder="z.B. Gaming, Musik, News..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="forum-description"
                className="text-sm font-medium text-muted-foreground ml-1"
              >
                Beschreibung
              </label>
              <textarea
                id="forum-description"
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
              <SubmitButton
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                icon={<Trash2 size={20} />}
                showInlineError={false}
                successDuration={0}
                className="p-2.5 text-destructive hover:bg-destructive/10 rounded-xl border border-transparent hover:border-destructive/20"
              />
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium hover:bg-sidebar-accent rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <SubmitButton
              type="submit"
              onClick={handleSubmit}
              label="Speichern"
              savingLabel="Wird gespeichert…"
              successDuration={0}
              showInlineError={false}
              className="px-6 py-2.5 min-w-[120px]"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
