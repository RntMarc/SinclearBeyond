"use client";
import { Plus, X } from "lucide-react";

export default function DayEventsModal({
  date,
  events,
  onClose,
  onEventClick,
  onNewEvent,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-md rounded-t-2xl sm:rounded-lg-custom shadow-2xl overflow-hidden flex flex-col max-h-[80vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">
            {date.toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {events.length > 0 ? (
            events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => {
                  onEventClick(ev);
                  onClose();
                }}
                className="p-4 rounded-xl border border-border bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {ev.title}
                  </span>
                  {ev.allDay ? (
                    <span className="text-[10px] font-bold uppercase text-primary/70 whitespace-nowrap ml-2">
                      Ganztägig
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(ev.startAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                {ev.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ev.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Keine Einträge für diesen Tag
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20">
          <button
            onClick={() => {
              onNewEvent(date);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Neuer Eintrag
          </button>
        </div>
      </div>
    </div>
  );
}
