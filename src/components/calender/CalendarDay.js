"use client";
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
      className={`p-1.5 cursor-pointer transition-colors overflow-hidden flex flex-col
        ${currentMonth ? "bg-background hover:bg-accent/40" : "bg-muted/10 hover:bg-accent/20"}`}
    >
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium shrink-0 mb-0.5
          ${isToday ? "bg-primary text-primary-foreground" : currentMonth ? "text-foreground" : "text-muted-foreground/40"}`}
      >
        {date.getDate()}
      </div>
      <div className="flex flex-col gap-0.5 overflow-hidden min-h-0">
        {events.slice(0, 3).map((ev) => (
          <div
            key={ev.id}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(ev);
            }}
            className="text-[10px] leading-snug px-1.5 py-px rounded bg-primary/15 text-primary truncate shrink-0 cursor-pointer hover:bg-primary/25 transition-colors"
            title={ev.title}
          >
            {!ev.allDay && (
              <span className="opacity-70 mr-0.5">
                {new Date(ev.startAt).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {ev.title}
          </div>
        ))}
        {events.length > 3 && (
          <span className="text-[9px] text-muted-foreground px-1">
            +{events.length - 3} weitere
          </span>
        )}
      </div>
    </div>
  );
}
