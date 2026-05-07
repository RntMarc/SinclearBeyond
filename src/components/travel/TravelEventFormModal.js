"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";
import SaveButton from "@/components/SaveButton";

export default function TravelEventFormModal({
  event,
  tripId,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState(
    event
      ? {
          ...event,
          start: new Date(event.start).toISOString().slice(0, 16),
          end: new Date(event.end).toISOString().slice(0, 16),
        }
      : {
          tripId,
          name: "",
          description: "",
          start: "",
          end: "",
          hasTickets: "0",
          ticketId: "",
          ticketUrl: "",
          url: "",
          image: "",
          organizer: "",
          address: "",
          latitude: "",
          longitude: "",
          osmId: "",
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = event ? `/api/travel/events/${event.id}` : "/api/travel/events";
    const method = event ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Speichern.");
      }
    } catch (_err) {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Möchtest du dieses Event wirklich löschen?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/travel/events/${event.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onUpdated();
        onClose();
      }
    } catch (_err) {
      setError("Fehler beim Löschen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">
              {event ? "Event bearbeiten" : "Neues Event"}
            </h3>
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Name
            </label>
            <input
              required
              className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Start
              </label>
              <input
                required
                type="datetime-local"
                className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Ende
              </label>
              <input
                required
                type="datetime-local"
                className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Beschreibung
            </label>
            <textarea
              className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm min-h-[80px]"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Adresse
            </label>
            <input
              className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Lat
              </label>
              <input
                type="number"
                step="any"
                className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Lon
              </label>
              <input
                type="number"
                step="any"
                className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm"
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Abbrechen
            </button>
            <SaveButton loading={saving} type="submit">
              Speichern
            </SaveButton>
          </div>
        </form>
      </div>
    </div>
  );
}
