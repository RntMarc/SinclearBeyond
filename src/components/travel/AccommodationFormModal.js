"use client";

import { X } from "lucide-react";
import { useState } from "react";
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
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const res = await fetch("/api/travel/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setSaving(false);
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Fehler beim Speichern.");
        return;
      }

      const result = await res.json();
      onCreated(result);
      onClose();
    } catch (_error) {
      setSaving(false);
      setFormError("Ein unerwarteter Fehler ist aufgetreten.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col">
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
          saving={saving}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
