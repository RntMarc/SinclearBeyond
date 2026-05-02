"use client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import BirthdayModal from "@/components/birthdays/BirthdayModal";
import CalendarAgenda from "@/components/calendar/CalendarAgenda";
import CalendarDayLabels from "@/components/calendar/CalendarDayLabels";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import DayEventsModal from "@/components/calendar/DayEventsModal";
import EventDetailModal from "@/components/calendar/EventDetailModal";
import EventFormModal from "@/components/calendar/EventFormModal";
import TimeGridView from "@/components/calendar/TimeGridView";
import TravelEventDetailModal from "@/components/calendar/TravelEventDetailModal";
import TripDetailModal from "@/components/calendar/TripDetailModal";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  addDays,
  getStartOfWeek,
  isSameDay,
} from "@/lib/calendar/calendarUtils";

export default function KalenderClient({ userId }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // 'month', 'week', 'day', 'agenda'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayEventsModal, setDayEventsModal] = useState(null); // { date, events }
  const [formModal, setFormModal] = useState(null); // null | { mode: "create"|"edit", event }
  const isMobile = useIsMobile();

  const { eventList, allUsers, addEvent, updateEvent } = useCalendarEvents();

  function prev() {
    if (viewMode === "month") {
      if (month === 0) {
        setYear((y) => y - 1);
        setMonth(11);
      } else setMonth((m) => m - 1);
    } else if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, isMobile ? -3 : -7));
    } else if (viewMode === "day") {
      setCurrentDate((d) => addDays(d, -1));
    }
  }
  function next() {
    if (viewMode === "month") {
      if (month === 11) {
        setYear((y) => y + 1);
        setMonth(0);
      } else setMonth((m) => m + 1);
    } else if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, isMobile ? 3 : 7));
    } else if (viewMode === "day") {
      setCurrentDate((d) => addDays(d, 1));
    }
  }

  async function openEditModal(ev) {
    setSelectedEvent(null);
    const res = await fetch(`/api/events/${ev.id}/permissions`);
    const permissions = res.ok ? await res.json() : [];
    setFormModal({ mode: "edit", event: { ...ev, permissions } });
  }

  function handleDayClick(date) {
    if (isMobile) {
      const dayEvents = eventList
        .filter((ev) => isSameDay(new Date(ev.startAt), date))
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      setDayEventsModal({ date, events: dayEvents });
    } else {
      setFormModal({ mode: "create", event: date });
    }
  }

  const weekDays = [];
  const weekStart = isMobile ? currentDate : getStartOfWeek(currentDate);
  const numWeekDays = isMobile ? 3 : 7;
  for (let i = 0; i < numWeekDays; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      <CalendarHeader
        year={viewMode === "month" ? year : currentDate.getFullYear()}
        month={viewMode === "month" ? month : currentDate.getMonth()}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onPrev={prev}
        onNext={next}
        onToday={() => {
          setYear(today.getFullYear());
          setMonth(today.getMonth());
          setCurrentDate(new Date());
        }}
        onNew={() => setFormModal({ mode: "create", event: today })}
      />
      {viewMode === "month" && <CalendarDayLabels />}
      <div className="flex-1 overflow-auto min-h-0">
        {viewMode === "month" && (
          <CalendarGrid
            year={year}
            month={month}
            eventList={eventList}
            today={today}
            onDayClick={handleDayClick}
            onEventClick={setSelectedEvent}
          />
        )}
        {viewMode === "week" && (
          <TimeGridView
            days={weekDays}
            eventList={eventList}
            onEventClick={setSelectedEvent}
            onDayClick={handleDayClick}
          />
        )}
        {viewMode === "day" && (
          <TimeGridView
            days={[currentDate]}
            eventList={eventList}
            onEventClick={setSelectedEvent}
            onDayClick={handleDayClick}
          />
        )}
        {viewMode === "agenda" && (
          <CalendarAgenda
            eventList={eventList}
            onEventClick={setSelectedEvent}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setFormModal({ mode: "create", event: today })}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-50"
        aria-label="Neuer Eintrag"
      >
        <Plus size={24} />
      </button>

      {selectedEvent && selectedEvent.type === "event" && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={openEditModal}
        />
      )}

      {selectedEvent && selectedEvent.type === "trip" && (
        <TripDetailModal
          tripId={selectedEvent.id}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {selectedEvent && selectedEvent.type === "travelEvent" && (
        <TravelEventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {selectedEvent && selectedEvent.type === "birthday" && (
        <BirthdayModal
          user={{
            id: selectedEvent.userId,
            displayName: selectedEvent.title,
            birthday: selectedEvent.originalBirthday,
            currentAge:
              new Date(selectedEvent.startAt).getFullYear() -
              new Date(selectedEvent.originalBirthday).getFullYear(),
            daysUntil: Math.ceil(
              (new Date(selectedEvent.startAt) - new Date()) /
                (1000 * 60 * 60 * 24),
            ),
            ageAtNextBirthday:
              new Date(selectedEvent.startAt).getFullYear() -
              new Date(selectedEvent.originalBirthday).getFullYear(),
          }}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {dayEventsModal && (
        <DayEventsModal
          date={dayEventsModal.date}
          events={dayEventsModal.events}
          onClose={() => setDayEventsModal(null)}
          onEventClick={setSelectedEvent}
          onNewEvent={(date) => setFormModal({ mode: "create", event: date })}
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
