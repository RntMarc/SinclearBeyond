"use client";
import { useCallback, useEffect, useState } from "react";

export function useCalendarEvents() {
  const [eventList, setEventList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    if (res.ok) setEventList(await res.json());
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
