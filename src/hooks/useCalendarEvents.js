"use client";
import { useCallback, useEffect, useState } from "react";

export function useCalendarEvents() {
  const [eventList, setEventList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/calendar/combined");
    if (res.ok) {
      const data = await res.json();
      const combined = [];

      // Standard events
      combined.push(...data.events.map((e) => ({ ...e, type: "event" })));

      // Trips
      combined.push(
        ...data.trips.map((t) => ({
          ...t,
          type: "trip",
          title: t.name,
          startAt: t.start,
          endAt: t.end,
          allDay: 1,
        })),
      );

      // Travel Events
      combined.push(
        ...data.travelEvents.map((te) => ({
          ...te,
          type: "travelEvent",
          title: te.name,
          startAt: te.start,
          endAt: te.end,
          allDay: 0,
        })),
      );

      // Birthdays (expand to recurring)
      const currentYear = new Date().getFullYear();
      for (const b of data.birthdays) {
        const bday = new Date(b.birthday);
        // Add for previous, current and next 5 years to cover typical calendar usage
        for (let year = currentYear - 1; year <= currentYear + 5; year++) {
          const date = new Date(year, bday.getMonth(), bday.getDate(), 0, 0, 0);
          const age = year - bday.getFullYear();
          combined.push({
            id: `birthday-${b.id}-${year}`,
            userId: b.id,
            type: "birthday",
            title: b.displayName,
            description: `${age}. Geburtstag`,
            startAt: date.toISOString(),
            allDay: 1,
            originalBirthday: b.birthday,
          });
        }
      }

      setEventList(combined);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setAllUsers(await res.json());
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, [fetchEvents, fetchUsers]);

  function addEvent(ev) {
    setEventList((prev) => [...prev, ev]);
  }

  function updateEvent(updated) {
    setEventList((prev) =>
      prev.map((ev) => (ev.id === updated.id ? updated : ev)),
    );
  }

  return { eventList, allUsers, addEvent, updateEvent };
}
