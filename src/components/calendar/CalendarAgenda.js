"use client";
import { Cake, ChevronDown, Plane } from "lucide-react";
import { useState } from "react";
import { isEventOnDay, sortEvents } from "@/lib/calendar/calendarUtils";

export default function CalendarAgenda({ eventList, onEventClick }) {
  const [limit, setLimit] = useState(30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // To properly handle multi-day events in agenda, we find all relevant dates
  // for all upcoming events (including their duration).
  const groupedEvents = {};
  const todayTime = today.getTime();

  for (const ev of eventList) {
    const eventStart = new Date(ev.startAt);
    const eventEnd = ev.endAt ? new Date(ev.endAt) : eventStart;

    // Start checking from either today or event start, whichever is later
    const current = new Date(Math.max(todayTime, eventStart.getTime()));
    current.setHours(0, 0, 0, 0);

    const end = new Date(eventEnd);
    // If it ends at midnight on a different day, it shouldn't show on the end day
    if (
      end.getHours() === 0 &&
      end.getMinutes() === 0 &&
      end.getSeconds() === 0 &&
      !isEventOnDay({ startAt: ev.startAt }, eventEnd) // Simplified check for "not same day"
    ) {
      end.setDate(end.getDate() - 1);
    }
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dateStr = current.toDateString();
      if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
      groupedEvents[dateStr].push(ev);

      // Advance one day
      current.setDate(current.getDate() + 1);
    }
  }

  // Sort dates and events within each date
  const sortedDates = Object.keys(groupedEvents)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(0, limit === null ? undefined : limit);

  for (const dateStr of sortedDates) {
    groupedEvents[dateStr].sort(sortEvents);
  }
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
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer group
                        ${
                          ev.type === "trip" || ev.type === "travelEvent"
                            ? "border-trip/30 bg-trip/5 hover:bg-trip/10"
                            : ev.type === "birthday"
                              ? "border-birthday/30 bg-birthday/5 hover:bg-birthday/10"
                              : "border-border bg-accent/10 hover:bg-accent/30"
                        }`}
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
                        <div
                          className={`text-[10px] font-bold uppercase w-12 shrink-0 ${
                            ev.type === "trip" || ev.type === "travelEvent"
                              ? "text-trip/70"
                              : ev.type === "birthday"
                                ? "text-birthday/70"
                                : "text-primary/70"
                          }`}
                        >
                          Ganztägig
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold truncate transition-colors flex items-center gap-2 ${
                            ev.type === "trip" || ev.type === "travelEvent"
                              ? "group-hover:text-trip"
                              : ev.type === "birthday"
                                ? "group-hover:text-birthday"
                                : "group-hover:text-primary"
                          }`}
                        >
                          {ev.type === "trip" && (
                            <Plane size={16} className="text-trip" />
                          )}
                          {ev.type === "travelEvent" && (
                            <Plane size={16} className="text-trip" />
                          )}
                          {ev.type === "birthday" && (
                            <Cake size={16} className="text-birthday" />
                          )}
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

      {limit !== null && Object.keys(groupedEvents).length > limit && (
        <button
          onClick={() => setLimit(null)}
          className="flex items-center justify-center gap-2 py-4 mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors border-t border-border"
        >
          <ChevronDown size={16} />
          Alle weiteren Einträge laden
        </button>
      )}
    </div>
  );
}
