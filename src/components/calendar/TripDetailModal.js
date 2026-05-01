"use client";
import { Calendar as CalendarIcon, Globe, Info, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function TripDetailModal({ tripId, onClose }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrip() {
      const res = await fetch(`/api/travel/trips/${tripId}/details`);
      if (res.ok) {
        setTrip(await res.json());
      }
      setLoading(false);
    }
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-sidebar border border-sidebar-border w-full max-w-lg rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Reisedaten...</p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const start = new Date(trip.start);
  const end = new Date(trip.end);
  const formatDate = (d) =>
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 bg-trip/10 flex items-end px-6 pb-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-trip flex items-center justify-center text-white text-2xl font-semibold shadow-lg border-4 border-sidebar">
              <Globe size={32} />
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-semibold">{trip.name}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Reise
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                <Info size={16} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                  Beschreibung
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {trip.description || "Keine Beschreibung vorhanden."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                <CalendarIcon size={16} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                  Zeitraum
                </p>
                <p className="text-sm text-foreground">
                  {formatDate(start)} – {formatDate(end)}
                </p>
              </div>
            </div>

            {trip.userAccommodation && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    Deine Unterkunft
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {trip.userAccommodation.name}
                  </p>
                  {trip.userAccommodation.address && (
                    <p className="text-xs text-muted-foreground">
                      {trip.userAccommodation.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <a
              href={`/reisen/${trip.id}`}
              className="flex-1 py-3 bg-trip hover:bg-trip/90 text-white rounded-xl font-medium transition-colors text-center shadow-sm"
            >
              Details öffnen
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground rounded-xl font-medium transition-colors border border-sidebar-border"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
