"use client";
import { Cake, Heart, Plane } from "lucide-react";
import { isSameDay } from "@/lib/calendar/calendarUtils";

export default function CalendarDay({
  date,
  currentMonth,
  events,
  today,
  onDayClick,
  onEventClick,
}) {
  const isToday = isSameDay(date, today);

  return (
    <div
      onClick={() => onDayClick(date)}
      className={`p-1 sm:p-1.5 cursor-pointer transition-colors overflow-hidden flex flex-col min-h-[60px] sm:min-h-0
        ${currentMonth ? "bg-background hover:bg-accent/40" : "bg-muted/10 hover:bg-accent/20"}`}
    >
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-medium shrink-0 mb-0.5
          ${isToday ? "bg-primary text-primary-foreground" : currentMonth ? "text-foreground" : "text-muted-foreground/40"}`}
      >
        {date.getDate()}
      </div>

      {/* Desktop view: Event titles */}
      <div className="hidden sm:flex flex-col gap-0.5 overflow-hidden min-h-0">
        {(() => {
          const allDayEvents = events.filter((ev) => ev.allDay);
          const timedEvents = events.filter((ev) => !ev.allDay);
          const displayLimit = 4;
          let displayedCount = 0;

          const renderEvent = (ev) => {
            displayedCount++;
            const isTrip = ev.type === "trip" || ev.type === "travelEvent";
            const isBirthday = ev.type === "birthday";
            const bgClass = isTrip
              ? "bg-trip/15 text-trip hover:bg-trip/25"
              : isBirthday
                ? "bg-birthday/15 text-birthday hover:bg-birthday/25"
                : "bg-primary/15 text-primary hover:bg-primary/25";

            return (
              <div
                key={ev.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(ev);
                }}
                className={`text-[10px] leading-snug px-1.5 py-px rounded truncate shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${bgClass}`}
                title={ev.title}
              >
                {isTrip && <Plane size={10} className="shrink-0" />}
                {isBirthday && <Cake size={10} className="shrink-0" />}
                {ev.isCloseFriend && (
                  <Heart size={10} className="shrink-0 fill-current" />
                )}
                {!ev.allDay && (
                  <span className="opacity-70 mr-0.5">
                    {new Date(ev.startAt).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <span className="truncate">{ev.title}</span>
              </div>
            );
          };

          return (
            <>
              {allDayEvents.slice(0, displayLimit).map(renderEvent)}
              {allDayEvents.length > 0 &&
                timedEvents.length > 0 &&
                displayedCount < displayLimit && (
                  <div className="border-t border-border/50 my-0.5" />
                )}
              {timedEvents
                .slice(0, Math.max(0, displayLimit - displayedCount))
                .map(renderEvent)}
              {events.length > displayLimit && (
                <span className="text-[9px] text-muted-foreground px-1">
                  +{events.length - displayLimit} weitere
                </span>
              )}
            </>
          );
        })()}
      </div>

      {/* Mobile view: Dots */}
      <div className="flex sm:hidden flex-wrap gap-0.5 mt-auto">
        {events.slice(0, 4).map((ev) => {
          const dotClass =
            ev.type === "trip" || ev.type === "travelEvent"
              ? "bg-trip/60"
              : ev.type === "birthday"
                ? "bg-birthday/60"
                : "bg-primary/60";
          return (
            <div
              key={ev.id}
              className={`w-1.5 h-1.5 rounded-full ${dotClass}`}
            />
          );
        })}
        {events.length > 4 && (
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        )}
      </div>
    </div>
  );
}
