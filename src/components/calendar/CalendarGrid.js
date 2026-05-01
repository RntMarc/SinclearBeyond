"use client";
import CalendarDay from "@/components/calendar/CalendarDay";
import { getCalendarDays, isSameDay } from "@/lib/calendar/calendarUtils";

export default function CalendarGrid({
  year,
  month,
  eventList,
  today,
  onDayClick,
  onEventClick,
}) {
  const calDays = getCalendarDays(year, month);

  function eventsForDay(date) {
    return eventList
      .filter((ev) => isSameDay(new Date(ev.startAt), date))
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }

  return (
    <div
      className="h-full grid grid-cols-7 divide-x divide-y divide-border border-b border-border overflow-hidden"
      style={{ gridTemplateRows: "repeat(6, minmax(60px, 1fr))" }}
    >
      {calDays.map(({ date, currentMonth }, i) => (
        <CalendarDay
          key={i}
          date={date}
          currentMonth={currentMonth}
          events={eventsForDay(date)}
          today={today}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
}
