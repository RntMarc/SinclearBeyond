"use client";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { isSameDay } from "@/lib/calendar/calendarUtils";

export default function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  const dateOpts = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const timeOpts = { hour: "2-digit", minute: "2-digit" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-border gap-3">
          <h3 className="text-base font-medium text-foreground leading-snug">
            {event.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {event.allDay ? "Datum" : "Zeitraum"}
            </span>
            {event.allDay
              ? <span className="text-sm text-foreground">
                  {start.toLocaleDateString("de-DE", dateOpts)}
                </span>
              : <span className="text-sm text-foreground">
                  {start.toLocaleDateString("de-DE", dateOpts)},{" "}
                  {start.toLocaleTimeString("de-DE", timeOpts)}
                  {end && (
                    <>
                      {" – "}
                      {isSameDay(start, end)
                        ? end.toLocaleTimeString("de-DE", timeOpts)
                        : `${end.toLocaleDateString("de-DE", dateOpts)}, ${end.toLocaleTimeString("de-DE", timeOpts)}`}
                    </>
                  )}
                </span>}
          </div>
          {event.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Beschreibung
              </span>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex flex-col gap-3">
          <div className="flex gap-3">
            {event.canEdit && (
              <>
                <Button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="flex-1"
                >
                  Bearbeiten
                </Button>
                <Button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  variant="destructive"
                  className="px-4"
                >
                  Löschen
                </Button>
              </>
            )}
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
