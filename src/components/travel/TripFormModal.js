"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import TripForm from "@/components/travel/TripForm";
import { toUTCISOString } from "@/lib/dateUtils";

const EMPTY_FORM = {
  name: "",
  description: "",
  start: "",
  end: "",
};

export default function TripFormModal({ onClose, onCreated, timezone }) {
  const t = useTranslations("Travel");
  const tc = useTranslations("Common");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        start: toUTCISOString(form.start, timezone),
        end: toUTCISOString(form.end, timezone),
      };

      const res = await fetch("/api/travel/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSaving(false);
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || tc("saveError"));
        return;
      }

      const result = await res.json();
      onCreated(result);
      onClose();
    } catch (_error) {
      setSaving(false);
      setFormError(tc("error"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            {t("newTrip")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <TripForm
          form={form}
          setForm={setForm}
          saving={saving}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={onClose}
          timezone={timezone}
        />
      </div>
    </div>
  );
}
