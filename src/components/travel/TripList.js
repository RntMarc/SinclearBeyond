"use client";
import { ChevronRight, MapPin, Plane } from "lucide-react";
import { useState } from "react";

function TripCard({ trip, onClick }) {
  const start = new Date(trip.start);
  const end = new Date(trip.end);

  const formatDate = (d) =>
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const statusLabel = trip.isActive
    ? "Aktuell"
    : trip.isUpcoming
      ? "Bevorstehend"
      : "Vergangen";

  const statusClass = trip.isActive
    ? "bg-primary/15 text-primary"
    : trip.isUpcoming
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-muted text-muted-foreground";

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group text-left w-full"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
  );
}

export default function TripList({ initialTrips }) {
  // placeholder — detail modal added in next step
  const [selected, setSelected] = useState(null);

  if (!initialTrips || initialTrips.length === 0) {
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
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      : null;

  return (
    <div className="space-y-8">
      <Section title="Aktuell" trips={active} />
      <Section title="Bevorstehend" trips={upcoming} />
      <Section title="Vergangen" trips={past} />
    </div>
  );
}
