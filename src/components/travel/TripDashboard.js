"use client";

import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
  MapPin,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

function StatusBadge({ isActive, isUpcoming, isPast }) {
  const label = isActive
    ? "Aktuell"
    : isUpcoming
      ? "Bevorstehend"
      : "Vergangen";
  const colorClass = isActive
    ? "bg-primary/15 text-primary"
    : isUpcoming
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClass}`}
    >
      {label}
    </span>
  );
}

function SectionBox({ title, icon: Icon, children }) {
  return (
    <div className="bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-sidebar-border flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={16} />
          </div>
        )}
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EventCard({ event }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const formatDate = (d) =>
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4 bg-background border border-sidebar-border rounded-xl flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-foreground leading-tight">
          {event.name}
        </h4>
        <StatusBadge
          isActive={event.isActive}
          isUpcoming={event.isUpcoming}
          isPast={event.isPast}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar size={14} />
        <span>
          {formatDate(start)} – {formatDate(end)}
        </span>
      </div>
      {event.address && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={14} />
          <span className="truncate">{event.address}</span>
        </div>
      )}
    </div>
  );
}

export default function TripDashboard({ trip }) {
  const [expandOtherAccomm, setExpandOtherAccomm] = useState(false);
  const [mobileTab, setMobileTab] = useState("details");
  const isMobile = useIsMobile();
  const start = new Date(trip.start);
  const end = new Date(trip.end);
  const formatDate = (d) =>
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const otherAccommodations = trip.participants.reduce((acc, p) => {
    if (p.accommodation && p.accommodation.id !== trip.userAccommodation?.id) {
      const existing = acc.find((a) => a.id === p.accommodation.id);
      if (existing) {
        existing.users.push(p.displayName);
      } else {
        acc.push({ ...p.accommodation, users: [p.displayName] });
      }
    }
    return acc;
  }, []);

  const DashboardContent = (
    <div className="space-y-6">
      {/* Overview Box */}
      <SectionBox title="Überblick" icon={Info}>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-light text-foreground">
                {trip.name}
              </h2>
              <StatusBadge
                isActive={trip.isActive}
                isUpcoming={trip.isUpcoming}
                isPast={trip.isPast}
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {trip.description || "Keine Beschreibung vorhanden."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-sidebar-border">
            <Calendar size={16} />
            <span>
              {formatDate(start)} – {formatDate(end)}
            </span>
          </div>
        </div>
      </SectionBox>

      {/* Accommodation Box */}
      <SectionBox title="Unterkunft" icon={MapPin}>
        <div className="space-y-4">
          {trip.userAccommodation
            ? <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <h4 className="font-medium text-foreground mb-1">
                  {trip.userAccommodation.name}
                </h4>
                {trip.userAccommodation.address && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {trip.userAccommodation.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-xs">
                  {trip.userAccommodation.phone && (
                    <span className="text-primary">
                      {trip.userAccommodation.phone}
                    </span>
                  )}
                  {trip.userAccommodation.mail && (
                    <span className="text-primary">
                      {trip.userAccommodation.mail}
                    </span>
                  )}
                </div>
              </div>
            : <p className="text-sm text-muted-foreground italic">
                Keine persönliche Unterkunft hinterlegt.
              </p>}

          {otherAccommodations.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setExpandOtherAccomm(!expandOtherAccomm)}
                className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span>Weitere Unterkünfte der Teilnehmer</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${expandOtherAccomm ? "rotate-180" : ""}`}
                />
              </button>
              {expandOtherAccomm && (
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-sidebar-border">
                  {otherAccommodations.map((acc) => (
                    <div key={acc.id} className="text-xs">
                      <p className="font-medium text-foreground">{acc.name}</p>
                      <p className="text-muted-foreground text-[10px]">
                        Teilnehmer: {acc.users.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionBox>

      {/* Participants Box */}
      <SectionBox title="Mitreisende" icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trip.participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 bg-background border border-sidebar-border rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {p.displayName?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {p.displayName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {p.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionBox>
    </div>
  );

  const EventsContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          Events ({trip.events.length})
        </h3>
      </div>
      {trip.events.length > 0
        ? <div className="space-y-3">
            {trip.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        : <div className="p-8 text-center bg-sidebar border border-sidebar-border rounded-2xl">
            <Calendar
              className="mx-auto mb-2 text-muted-foreground"
              size={24}
            />
            <p className="text-sm text-muted-foreground">
              Keine Events geplant.
            </p>
          </div>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
        Reise-Details
      </p>

      {/* Desktop Layout */}
      <div
        className={`${isMobile ? "hidden" : "hidden md:grid"} grid-cols-3 gap-8`}
      >
        <div className="col-span-2">{DashboardContent}</div>
        <div className="col-span-1">{EventsContent}</div>
      </div>

      {/* Mobile Layout */}
      <div className={`${isMobile ? "block" : "md:hidden"}`}>
        <div className="flex bg-sidebar border border-sidebar-border rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMobileTab("details")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mobileTab === "details"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("events")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mobileTab === "events"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Events ({trip.events.length})
          </button>
        </div>
        {mobileTab === "details" ? DashboardContent : EventsContent}
      </div>
    </div>
  );
}
