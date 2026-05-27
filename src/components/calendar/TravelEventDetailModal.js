"use client";
import {
  Calendar as CalendarIcon,
  Info,
  MapPin,
  Ticket,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import SimpleOSM from "@/components/discover/SimpleOSM";

export default function TravelEventDetailModal({ event, onClose }) {
  const t = useTranslations("Travel");
  const tc = useTranslations("Common");
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;

  const formatDateTime = (d) =>
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-lg rounded-lg-custom shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
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
            <div className="w-16 h-16 rounded-lg-custom bg-trip flex items-center justify-center text-white text-2xl font-semibold shadow-lg border-4 border-sidebar">
              <Ticket size={32} />
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {t("tripLabel")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {event.latitude && event.longitude && (
            <div className="h-48 shrink-0">
              <SimpleOSM
                lat={event.latitude}
                lon={event.longitude}
                name={event.title}
                zoom={14}
              />
            </div>
          )}
          {event.participantIds && !event.isParticipant && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-xs text-destructive font-medium flex items-center gap-2">
                <X size={14} />
                {t("notParticipant")}
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                <Info size={16} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                  {t("description")}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {event.description || t("noDescriptionShort")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                <CalendarIcon size={16} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                  {t("timeRange")}
                </p>
                <p className="text-sm text-foreground">
                  {formatDateTime(start)}
                  {end && ` – ${formatDateTime(end)}`}
                </p>
              </div>
            </div>

            {event.address && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    {t("address")}
                  </p>
                  <p className="text-sm text-foreground">{event.address}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {event.tripId && (
              <a
                href={`/reisen/${event.tripId}`}
                className="flex-1 py-3 bg-trip hover:bg-trip/90 text-white rounded-xl font-medium transition-colors text-center shadow-sm"
              >
                {t("openTrip")}
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground rounded-xl font-medium transition-colors border border-sidebar-border"
            >
              {tc("close")}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
