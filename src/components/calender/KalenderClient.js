"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import CalendarAgenda from "@/components/calender/CalendarAgenda";
import CalendarDayLabels from "@/components/calender/CalendarDayLabels";
import CalendarGrid from "@/components/calender/CalendarGrid";
import CalendarHeader from "@/components/calender/CalendarHeader";
import DayEventsModal from "@/components/calender/DayEventsModal";
import TimeGridView from "@/components/calender/TimeGridView";
import EventDetailModal from "@/components/calender/EventDetailModal";
import EventFormModal from "@/components/calender/EventFormModal";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
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
  const [isMobile, setIsMobile] = useState(false);

  const { eventList, allUsers, addEvent, updateEvent } = useCalendarEvents();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function prev() {
    if (viewMode === "month") {
      if (month === 0) {
        setYear((y) => y - 1);
        setMonth(11);
      } else setMonth((m) => m - 1);
    } else if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, -7));
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
      setCurrentDate((d) => addDays(d, 7));
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
  const startOfWeek = getStartOfWeek(currentDate);
  const numWeekDays = isMobile ? 3 : 7;
  for (let i = 0; i < numWeekDays; i++) {
    weekDays.push(addDays(startOfWeek, i));
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

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={openEditModal}
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
