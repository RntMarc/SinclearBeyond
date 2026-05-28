"use client";
import { Calendar, MapPin, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Notification from "@/components/Notification";
import { toLocalDatetimeValue, toUTCISOString } from "@/lib/dateUtils";
import TravelEventFormModal from "./TravelEventFormModal";

export default function TripAdminModal({ trip, onClose, onUpdated, timezone }) {
  const [form, setForm] = useState({
    name: trip.name,
    description: trip.description || "",
    start: toLocalDatetimeValue(trip.start, timezone),
    end: toLocalDatetimeValue(trip.end, timezone),
  });
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("details");
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const fetchData = useCallback(async () => {
    const [partRes, usersRes, accRes, eventsRes] = await Promise.all([
      fetch(`/api/travel/trips/${trip.id}/participants`),
      fetch("/api/users"),
      fetch("/api/travel/accommodations"),
      fetch(`/api/travel/trips/${trip.id}/details`),
    ]);

    if (partRes.ok) setParticipants(await partRes.json());
    if (usersRes.ok) setAllUsers(await usersRes.json());
    if (accRes.ok) setAccommodations(await accRes.json());
    if (eventsRes.ok) {
      const tripData = await eventsRes.json();
      setEvents(tripData.events || []);
      // Sync participants with accommodation info from the rich trip data
      if (tripData.participants) {
        setParticipants(tripData.participants);
      }
    }
  }, [trip.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpdateTrip(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      start: toUTCISOString(form.start, timezone),
      end: toUTCISOString(form.end, timezone),
    };

    const res = await fetch(`/api/travel/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      fetchData();
      setSelectedUser("");
      onUpdated();
    } else {
      setNotification({ type: "error", message: "Fehler beim Hinzufügen." });
    }
  }

  async function removeParticipant(userId) {
    if (!confirm("Teilnehmer wirklich entfernen?")) return;
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
      fetchData();
      onUpdated();
    } else {
      setNotification({ type: "error", message: "Fehler beim Entfernen." });
    }
  }

  async function updateParticipantAccommodation(userId, accommodationId) {
    setLoading(true);
    const res = await fetch(
      `/api/travel/trips/${trip.id}/participants/${userId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accommodationId }),
      },
    );
    setLoading(false);
    if (res.ok) {
      fetchData();
    } else {
      setNotification({ type: "error", message: "Fehler beim Zuweisen." });
    }
  }

  const availableUsers = allUsers.filter(
    (u) => !participants.find((p) => p.id === u.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Reise verwalten
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {trip.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-border px-6 shrink-0 bg-muted/30">
          {[
            { id: "details", label: "Details" },
            { id: "participants", label: "Teilnehmer" },
            { id: "events", label: "Events" },
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeSubTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeSubTab === "details" && (
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
                  className="w-full bg-sidebar border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
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
                    onChange={(e) =>
                      setForm({ ...form, start: e.target.value })
                    }
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
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Änderungen speichern
              </button>
            </form>
          )}

          {activeSubTab === "participants" && (
            <div className="space-y-6">
              <div className="flex gap-2">
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
                  className="bg-primary/10 text-primary px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} />
                  Hinzufügen
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Teilnehmer ({participants.length})
                </h4>
                <div className="grid gap-3">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 p-4 bg-sidebar border border-sidebar-border rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {p.displayName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-sidebar-border/50">
                        <MapPin size={14} className="text-muted-foreground" />
                        <select
                          className="flex-1 bg-transparent text-xs focus:outline-none"
                          value={p.accommodation?.id || ""}
                          onChange={(e) =>
                            updateParticipantAccommodation(p.id, e.target.value)
                          }
                        >
                          <option value="">Keine Unterkunft</option>
                          {accommodations.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "events" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Events ({events.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddEvent(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Plus size={14} />
                  Event hinzufügen
                </button>
              </div>

              <div className="grid gap-3">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setEditingEvent(event)}
                      className="flex items-center justify-between p-4 bg-sidebar border border-sidebar-border rounded-xl cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(event.start).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Calendar size={16} className="text-muted-foreground" />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-muted/20 border border-dashed border-sidebar-border rounded-xl text-muted-foreground text-xs">
                    Keine Events geplant.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {(showAddEvent || editingEvent) && (
        <TravelEventFormModal
          tripId={trip.id}
          event={editingEvent}
          onClose={() => {
            setShowAddEvent(false);
            setEditingEvent(null);
          }}
          onUpdated={() => {
            fetchData();
            onUpdated();
          }}
          timezone={timezone}
        />
      )}

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
