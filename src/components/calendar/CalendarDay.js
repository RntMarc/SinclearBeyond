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

  const allDayEvents = events.filter((ev) => ev.allDay);
  const timedEvents = events.filter((ev) => !ev.allDay);

  const renderAllDayEvent = (ev) => {
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
        <span className="truncate">{ev.title}</span>
      </div>
    );
  };

  const renderTimedEventDot = (ev) => {
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
        title={ev.title}
      />
    );
  };

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

      <div className="flex flex-col gap-0.5 overflow-hidden min-h-0">
        {/* All-day events as bars */}
        {allDayEvents.slice(0, 3).map(renderAllDayEvent)}
        {allDayEvents.length > 3 && (
          <span className="text-[9px] text-muted-foreground px-1">
            +{allDayEvents.length - 3} weitere
          </span>
        )}

        {/* Timed events as dots */}
        {timedEvents.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {timedEvents.slice(0, 10).map(renderTimedEventDot)}
            {timedEvents.length > 10 && (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
