"use client";
import { useState } from "react";
import CalendarHeader from "@/components/calender/CalendarHeader";
import CalendarDayLabels from "@/components/calender/CalendarDayLabels";
import CalendarGrid from "@/components/calender/CalendarGrid";
import EventDetailModal from "@/components/calender/EventDetailModal";
import EventFormModal from "@/components/calender/EventFormModal";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

export default function KalenderClient({ userId }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | { mode: "create"|"edit", event }

  const { eventList, allUsers, addEvent, updateEvent } = useCalendarEvents();

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  async function openEditModal(ev) {
    setSelectedEvent(null);
    const res = await fetch(`/api/events/${ev.id}/permissions`);
    const permissions = res.ok ? await res.json() : [];
    setFormModal({ mode: "edit", event: { ...ev, permissions } });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
        onNew={() => setFormModal({ mode: "create", event: today })}
      />
      <CalendarDayLabels />
      <CalendarGrid
        year={year}
        month={month}
        eventList={eventList}
        today={today}
        onDayClick={(date) => setFormModal({ mode: "create", event: date })}
        onEventClick={setSelectedEvent}
      />

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={openEditModal}
        />
      )}

      {formModal && (
        <EventFormModal
          mode={formModal.mode}
          event={formModal.event}
          allUsers={allUsers}
          userId={userId}
          onClose={() => setFormModal(null)}
          onCreated={addEvent}
          onUpdated={updateEvent}
        />
      )}
    </div>
  );
}
