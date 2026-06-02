"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { fetchAction } from "@/lib/asyncAction";
import AccommodationForm from "./AccommodationForm";

const EMPTY_FORM = {
  name: "",
  description: "",
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
  mail: "",
  osmId: "",
  isHotel: false,
};

export default function AccommodationFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const result = await fetchAction(
      "/api/travel/accommodations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
      { fallbackError: "Fehler beim Speichern." },
    );

    if (result.ok) {
      onCreated(result.data);
      onClose();
      return { ok: true };
    }
    setFormError(result.error || "Fehler beim Speichern.");
    return { ok: false, error: result.error };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            Neue Unterkunft
          </h3>
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
