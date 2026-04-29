"use client";
import { ChevronRight, MapPin, Plane, Wrench } from "lucide-react";
import { useCallback, useState } from "react";
import TripAdminModal from "./TripAdminModal";

function TripCard({ trip, onClick, isAdmin, onAdminClick }) {
  const start = new Date(trip.start);
  const end = new Date(trip.end);

  const formatDate = (d) =>
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isGrey = isAdmin && !trip.isParticipant;

  const statusLabel = trip.isActive
    ? "Aktuell"
    : trip.isUpcoming
      ? "Bevorstehend"
      : "Vergangen";

  const statusClass = isGrey
    ? "bg-muted text-muted-foreground"
    : trip.isActive
      ? "bg-primary/15 text-primary"
      : trip.isUpcoming
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex gap-2">
      <button
        onClick={onClick}
        className={`flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group text-left w-full ${isGrey ? "opacity-60 grayscale-[0.5]" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isGrey ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
          >
            <Plane size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{trip.name}</span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(start)} – {formatDate(end)}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      </button>
      {isAdmin && (
        <button
          onClick={onAdminClick}
          className="flex items-center justify-center w-12 shrink-0 bg-sidebar border border-sidebar-border rounded-xl hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-primary"
          title="Verwalten"
        >
          <Wrench size={18} />
        </button>
      )}
    </div>
  );
}

export default function TripList({ initialTrips, isAdmin }) {
  const [trips, setTrips] = useState(initialTrips);
  const [selected, setSelected] = useState(null);
  const [adminTrip, setAdminTrip] = useState(null);

  const refreshTrips = useCallback(async () => {
    const res = await fetch("/api/reisen/data");
    if (res.ok) {
      setTrips(await res.json());
    }
  }, []);

  if (!trips || trips.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center">
        <MapPin className="mx-auto mb-3 text-muted-foreground" size={28} />
        <p className="text-muted-foreground">Keine Reisen gefunden.</p>
      </div>
    );
  }

  const active = initialTrips.filter((t) => t.isActive);
  const upcoming = initialTrips.filter((t) => t.isUpcoming);
  const past = initialTrips.filter((t) => t.isPast);

  const Section = ({ title, trips }) =>
    trips.length > 0
      ? <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            {title}
          </p>
          <div className="space-y-3">
            {trips.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                onClick={() => setSelected(t)}
                isAdmin={isAdmin}
                onAdminClick={() => setAdminTrip(t)}
              />
            ))}
          </div>
        </div>
      : null;

  return (
    <div className="space-y-8">
      <Section title="Aktuell" trips={active} />
      <Section title="Bevorstehend" trips={upcoming} />
      <Section title="Vergangen" trips={past} />

      {adminTrip && (
        <TripAdminModal
          trip={adminTrip}
          onClose={() => setAdminTrip(null)}
          onUpdated={refreshTrips}
        />
      )}
    </div>
  );
}
