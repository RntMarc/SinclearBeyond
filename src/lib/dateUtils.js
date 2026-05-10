/**
 * Converts a date to a local datetime-local string (YYYY-MM-DDTHH:mm).
 * Uses the provided timezone or the browser's local timezone.
 */
export function toLocalDatetimeValue(date, timezone) {
  if (!date) return "";

  let d;
  if (typeof date === "string") {
    if (date.includes("T")) {
      d = new Date(date);
    } else {
      // Date only string (YYYY-MM-DD). Parse as local to avoid shifts.
      const [y, m, d_part] = date.split("-").map(Number);
      d = new Date(y, m - 1, d_part);
    }
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return "";

  if (timezone) {
    // Format to local time in specific timezone
    try {
      const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timezone,
      };
      const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(d);
      const getPart = (type) => parts.find((p) => p.type === type).value;
      return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
    } catch (e) {
      console.error("Error formatting date with timezone:", e);
    }
  }

  // Fallback to local browser time
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converts a datetime-local string to a UTC ISO string.
 * Assumes the input string is in the provided timezone or local browser time.
 */
export function toUTCISOString(localString, timezone) {
  if (!localString) return null;

  // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm
  const parts = localString.split("T");
  const datePart = parts[0];
  const timePart = parts[1] || "00:00";

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (timezone) {
    try {
      // Create date in specific timezone
      const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

      // We need to adjust for the timezone offset
      const utcDateStr = date.toLocaleString("en-US", { timeZone: "UTC" });
      const tzDateStr = date.toLocaleString("en-US", { timeZone: timezone });

      const utcDate = new Date(utcDateStr);
      const tzDate = new Date(tzDateStr);
      const offset = utcDate.getTime() - tzDate.getTime();

      return new Date(date.getTime() + offset).toISOString();
    } catch (e) {
      console.error("Error converting to UTC with timezone:", e);
    }
  }

  // Fallback to local browser time
  const d = new Date(year, month - 1, day, hour, minute);
  return d.toISOString();
}

/**
 * Formats a birthday date string (YYYY-MM-DD) to a local date string.
 * Birthdays should usually ignore timezones to stay on the same day.
 */
export function formatBirthday(date) {
  if (!date) return "";
  let d;
  if (typeof date === "string") {
    if (date.includes("T")) {
      d = new Date(date);
      // For ISO strings from DB, we want the UTC date part
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }
    return date.split("T")[0]; // Already YYYY-MM-DD
  }
  d = date;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Returns the current timezone of the browser.
 */
export function getBrowserTimezone() {
  return typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
}
