export const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = startOffset - 1; i >= 0; i--)
    days.push({ date: new Date(year, month, -i), currentMonth: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), currentMonth: true });
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++)
    days.push({ date: new Date(year, month + 1, d), currentMonth: false });
  return days;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Re-export from central dateUtils
export { toLocalDatetimeValue } from "@/lib/dateUtils";

export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isEventOnDay(event, date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : start;

  if (event.allDay) {
    // For all-day events, compare year/month/day in UTC
    const dUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    const sUTC = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );
    const eUTC = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    );

    return dUTC.getTime() >= sUTC.getTime() && dUTC.getTime() <= eUTC.getTime();
  }

  // For timed events, compare local timestamps
  const dTime = d.getTime();
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const sTime = s.getTime();

  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  let eTime = e.getTime();

  // If end time is exactly midnight and it's not the same as start day,
  // it usually means it ends at the very beginning of that day (not inclusive).
  if (
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    !isSameDay(start, end)
  ) {
    eTime -= 86400000; // Subtract one day
  }

  return dTime >= sTime && dTime <= eTime;
}

export function sortEvents(a, b) {
  if (a.allDay && !b.allDay) return -1;
  if (!a.allDay && b.allDay) return 1;
  return new Date(a.startAt) - new Date(b.startAt);
}
