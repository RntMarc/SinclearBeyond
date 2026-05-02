"use client";
import CalendarDay from "@/components/calendar/CalendarDay";
import {
  getCalendarDays,
  isEventOnDay,
  sortEvents,
} from "@/lib/calendar/calendarUtils";

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
    return eventList.filter((ev) => isEventOnDay(ev, date)).sort(sortEvents);
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
