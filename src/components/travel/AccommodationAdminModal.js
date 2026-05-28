"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";
import Notification from "@/components/Notification";
import AccommodationForm from "./AccommodationForm";

export default function AccommodationAdminModal({
  accommodation,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState({
    ...accommodation,
    isHotel: accommodation.isHotel === 1,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const res = await fetch(
        `/api/travel/accommodations/${accommodation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      setSaving(false);
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Fehler beim Speichern.");
        return;
      }

      onUpdated();
      onClose();
    } catch (_error) {
      setSaving(false);
      setFormError("Ein unerwarteter Fehler ist aufgetreten.");
    }
  }

  async function handleDelete() {
    if (!confirm("Möchtest du diese Unterkunft wirklich löschen?")) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/travel/accommodations/${accommodation.id}`,
        {
          method: "DELETE",
        },
      );

      setSaving(false);
      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json();
        setNotification({
          type: "error",
          message: data.error || "Fehler beim Löschen.",
        });
      }
    } catch (_error) {
      setSaving(false);
      setNotification({
        type: "error",
        message: "Ein unerwarteter Fehler ist aufgetreten.",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-foreground">
              Unterkunft bearbeiten
            </h3>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title="Unterkunft löschen"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <AccommodationForm
          form={form}
          setForm={setForm}
          saving={saving}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
