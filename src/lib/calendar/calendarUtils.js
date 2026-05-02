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

export function toLocalDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
  const dTime = d.getTime();

  const start = new Date(event.startAt);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const sTime = s.getTime();

  const end = event.endAt ? new Date(event.endAt) : start;
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  let eTime = e.getTime();

  // If end time is exactly midnight and it's not the same as start day,
  // it usually means it ends at the very beginning of that day (not inclusive).
  // E.g. Jan 1st 00:00 to Jan 2nd 00:00 is just Jan 1st.
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
