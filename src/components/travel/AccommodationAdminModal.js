"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
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
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const result = await fetchAction(
      `/api/travel/accommodations/${accommodation.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
      { fallbackError: "Fehler beim Speichern." },
    );

    if (result.ok) {
      onUpdated();
      onClose();
      return { ok: true };
    }
    setFormError(result.error || "Fehler beim Speichern.");
    return { ok: false, error: result.error };
  }

  async function handleDelete() {
    if (!confirm("Möchtest du diese Unterkunft wirklich löschen?"))
      return { ok: false, error: "Abgebrochen." };

    const result = await fetchAction(
      `/api/travel/accommodations/${accommodation.id}`,
      { method: "DELETE" },
      { fallbackError: "Fehler beim Löschen." },
    );

    if (result.ok) {
      onUpdated();
      onClose();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-foreground">
              Unterkunft bearbeiten
            </h3>
            <SubmitButton
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              icon={<Trash2 size={16} />}
              errorToast="Fehler beim Löschen."
              showInlineError={false}
              className="p-1.5 text-muted-foreground hover:text-destructive"
              title="Unterkunft löschen"
            />
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
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
