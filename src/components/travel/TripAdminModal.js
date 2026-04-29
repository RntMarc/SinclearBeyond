"use client";
import { Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import Notification from "@/components/Notification";
import { toLocalDatetimeValue } from "@/lib/calendar/calendarUtils";

export default function TripAdminModal({ trip, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: trip.name,
    description: trip.description || "",
    start: toLocalDatetimeValue(new Date(trip.start)),
    end: toLocalDatetimeValue(new Date(trip.end)),
  });
  const [participants, setParticipants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchParticipants();
    fetchAllUsers();
  }, [trip.id]);

  async function fetchParticipants() {
    const res = await fetch(`/api/travel/trips/${trip.id}/participants`);
    if (res.ok) setParticipants(await res.json());
  }

  async function fetchAllUsers() {
    const res = await fetch("/api/users");
    if (res.ok) setAllUsers(await res.json());
  }

  async function handleUpdateTrip(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/travel/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setNotification({
        type: "success",
        message: "Reise erfolgreich aktualisiert.",
      });
      onUpdated();
    } else {
      setNotification({ type: "error", message: "Fehler beim Aktualisieren." });
    }
  }

  async function addParticipant() {
    if (!selectedUser) return;
    setLoading(true);
    const res = await fetch(`/api/travel/trips/${trip.id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser }),
    });
    setLoading(false);
    if (res.ok) {
      setNotification({ type: "success", message: "Nutzer hinzugefügt." });
      fetchParticipants();
      setSelectedUser("");
      onUpdated(); // Refresh main list to update isParticipant flag
    } else {
      setNotification({ type: "error", message: "Fehler beim Hinzufügen." });
    }
  }

  async function removeParticipant(userId) {
    setLoading(true);
    const res = await fetch(
      `/api/travel/trips/${trip.id}/participants/${userId}`,
      {
        method: "DELETE",
      },
    );
    setLoading(false);
    if (res.ok) {
      setNotification({ type: "success", message: "Nutzer entfernt." });
      fetchParticipants();
      onUpdated();
    } else {
      setNotification({ type: "error", message: "Fehler beim Entfernen." });
    }
  }

  const availableUsers = allUsers.filter(
    (u) => !participants.find((p) => p.id === u.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            Reise verwalten
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form onSubmit={handleUpdateTrip} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">
                Titel
              </label>
              <input
                className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">
                Beschreibung
              </label>
              <textarea
                className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">
                  Von
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">
                  Bis
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Änderungen speichern
            </button>
          </form>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs uppercase tracking-widest font-bold text-foreground">
              Teilnehmer ({participants.length})
            </h4>
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 bg-sidebar border border-sidebar-border rounded-lg"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{p.displayName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.email}
                    </span>
                  </div>
                  <button
                    onClick={() => removeParticipant(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <select
                className="flex-1 bg-sidebar border border-sidebar-border rounded-xl px-3 py-2 text-sm focus:outline-none"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Nutzer wählen...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={addParticipant}
                disabled={!selectedUser || loading}
                className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <UserPlus size={18} />
              </button>
            </div>
          </div>
        </div>
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
