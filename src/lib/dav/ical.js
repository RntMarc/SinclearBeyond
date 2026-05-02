export function formatICalDate(date, allDay = false) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  if (allDay) {
    return `${year}${month}${day}`;
  }

  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function escapeICal(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function generateVEVENT(event) {
  let ical = "BEGIN:VEVENT\r\n";
  ical += `UID:${event.id}@sinclear.beyond\r\n`;
  ical += `DTSTAMP:${formatICalDate(new Date())}\r\n`;

  if (event.allDay) {
    ical += `DTSTART;VALUE=DATE:${formatICalDate(event.startAt, true)}\r\n`;
    const endDate = new Date(event.endAt || event.startAt);
    if (!event.endAt || event.endAt <= event.startAt) {
      endDate.setUTCDate(endDate.getUTCDate() + 1);
    }
    ical += `DTEND;VALUE=DATE:${formatICalDate(endDate, true)}\r\n`;
  } else {
    ical += `DTSTART:${formatICalDate(event.startAt)}\r\n`;
    if (event.endAt) {
      ical += `DTEND:${formatICalDate(event.endAt)}\r\n`;
    }
  }

  ical += `SUMMARY:${escapeICal(event.title)}\r\n`;
  if (event.description) {
    ical += `DESCRIPTION:${escapeICal(event.description)}\r\n`;
  }
  if (event.location) {
    ical += `LOCATION:${escapeICal(event.location)}\r\n`;
  }
  ical += "END:VEVENT\r\n";
  return ical;
}

export function wrapICal(content) {
  let ical = "BEGIN:VCALENDAR\r\n";
  ical += "VERSION:2.0\r\n";
  ical += "PRODID:-//Sinclear//Beyond//DE\r\n";
  ical += "CALSCALE:GREGORIAN\r\n";
  ical += content;
  ical += "END:VCALENDAR\r\n";
  return ical;
}

export function generateICal(events) {
  const content = events.map((e) => generateVEVENT(e)).join("");
  return wrapICal(content);
}
