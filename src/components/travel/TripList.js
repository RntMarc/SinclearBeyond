"use client";
import { CalendarDays, ChevronRight, MapPin, Plane } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

function TripCard({ trip, isAdmin, isEvent }) {
  const t = useTranslations("Travel");
  const locale = useLocale();
  const start = new Date(trip.start);
  const end = new Date(trip.end);

  const formatDate = (d) =>
    d.toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isGrey = isAdmin && !trip.isParticipant;

  const statusLabel = trip.isActive
    ? t("status.active")
    : trip.isUpcoming
      ? t("status.upcoming")
      : t("status.past");

  const statusClass = isGrey
    ? "bg-muted text-muted-foreground"
    : trip.isActive
      ? "bg-primary/15 text-primary"
      : trip.isUpcoming
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-muted text-muted-foreground";

  const Content = (
    <div
      className={`flex items-center justify-between p-4 bg-sidebar ${!isEvent ? "hover:bg-sidebar-accent cursor-pointer" : ""} border border-sidebar-border rounded-xl transition-all group text-left w-full ${isGrey ? "opacity-60 grayscale-[0.5]" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isGrey ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
        >
          {isEvent ? <CalendarDays size={18} /> : <Plane size={18} />}
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
      {!isEvent && (
        <ChevronRight
          size={18}
          className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      )}
    </div>
  );

  return (
    <div className="flex gap-2">
      {isEvent ? (
        Content
      ) : (
        <Link href={`/reisen/${trip.id}`} className="w-full">
          {Content}
        </Link>
      )}
    </div>
  );
}

export default function TripList({ initialTrips, isAdmin, isEventList }) {
  const t = useTranslations("Travel");
  const [trips, setTrips] = useState(initialTrips);
  const _refreshTrips = useCallback(async () => {
    const res = await fetch("/api/reisen/data");
    if (res.ok) {
      setTrips(await res.json());
    }
  }, []);

  if (!trips || trips.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center">
        <MapPin className="mx-auto mb-3 text-muted-foreground" size={28} />
        <p className="text-muted-foreground">{t("noTrips")}</p>
      </div>
    );
  }

  const active = initialTrips.filter((t) => t.isActive);
  const upcoming = initialTrips.filter((t) => t.isUpcoming);
  const past = initialTrips.filter((t) => t.isPast);

  const Section = ({ title, trips }) =>
    trips.length > 0 ? (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
          {title}
        </p>
        <div className="space-y-3">
          {trips.map((t) => (
            <TripCard
              key={t.id}
              trip={t}
              isAdmin={isAdmin}
              isEvent={isEventList}
            />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-8">
      <Section title={t("status.active")} trips={active} />
      <Section title={t("status.upcoming")} trips={upcoming} />
      <Section title={t("status.past")} trips={past} />
    </div>
  );
}
