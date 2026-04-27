"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CalendarAgenda({ eventList, onEventClick }) {
  const [limit, setLimit] = useState(30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = eventList
    .filter((ev) => new Date(ev.startAt) >= today)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const displayedEvents =
    limit === null ? upcomingEvents : upcomingEvents.slice(0, limit);

  // Group events by date
  const groupedEvents = displayedEvents.reduce((acc, ev) => {
    const dateStr = new Date(ev.startAt).toDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto pb-24">
      {sortedDates.length > 0
        ? sortedDates.map((dateStr) => {
            const date = new Date(dateStr);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={dateStr} className="space-y-3">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold uppercase tracking-wider ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {date.toLocaleDateString("de-DE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    {isToday && " (Heute)"}
                  </span>
                </div>
                <div className="grid gap-2">
                  {groupedEvents[dateStr].map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-accent/10 hover:bg-accent/30 transition-colors cursor-pointer group"
                    >
                      {!ev.allDay && (
                        <div className="text-sm font-medium text-muted-foreground w-12 shrink-0">
                          {new Date(ev.startAt).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                      {ev.allDay && (
                        <div className="text-[10px] font-bold uppercase text-primary/70 w-12 shrink-0">
                          Ganztägig
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate group-hover:text-primary transition-colors">
                          {ev.title}
                        </div>
                        {ev.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {ev.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        : <div className="py-20 text-center text-muted-foreground">
            Keine anstehenden Einträge gefunden.
          </div>}

      {limit !== null && upcomingEvents.length > limit && (
        <button
          onClick={() => setLimit(null)}
          className="flex items-center justify-center gap-2 py-4 mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors border-t border-border"
        >
          <ChevronDown size={16} />
          Alle {upcomingEvents.length - limit} weiteren Einträge laden
        </button>
      )}
    </div>
  );
}
