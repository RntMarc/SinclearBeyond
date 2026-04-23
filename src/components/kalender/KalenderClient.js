"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon-based

  const days = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), currentMonth: false });
  }
  return days;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const EMPTY_FORM = { title: "", description: "", startAt: "", endAt: "", allDay: false };

export default function KalenderClient() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [eventList, setEventList] = useState([]);
  const [modal, setModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    if (res.ok) setEventList(await res.json());
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  function openModal(date) {
    const start = new Date(date);
    start.setHours(10, 0, 0, 0);
    const end = new Date(date);
    end.setHours(11, 0, 0, 0);
    setForm({ ...EMPTY_FORM, startAt: toLocalDatetimeValue(start), endAt: toLocalDatetimeValue(end) });
    setFormError("");
    setModal(true);
  }
  function closeModal() {
    setModal(false);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const body = {
      title: form.title,
      description: form.description || null,
      startAt: form.allDay ? `${form.startAt.slice(0, 10)}T00:00:00` : form.startAt,
      endAt: form.endAt || null,
      allDay: form.allDay,
    };

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (!res.ok) { setFormError("Fehler beim Speichern."); return; }

    const newEvent = await res.json();
    setEventList((prev) => [...prev, newEvent]);
    closeModal();
  }

  const calDays = getCalendarDays(year, month);

  function eventsForDay(date) {
    return eventList
      .filter((ev) => isSameDay(new Date(ev.startAt), date))
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={17} />
          </button>
          <span className="text-base font-light text-foreground w-44 text-center select-none">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={17} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 px-3 py-1 text-xs rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Heute
          </button>
        </div>
        <button
          type="button"
          onClick={() => openModal(today)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Neuer Eintrag
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="flex-1 grid grid-cols-7 min-h-0 divide-x divide-y divide-border border-b border-border overflow-hidden"
        style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
      >
        {calDays.map(({ date, currentMonth }, i) => {
          const isToday = isSameDay(date, today);
          const dayEvents = eventsForDay(date);
          return (
            <div
              key={i}
              onClick={() => openModal(date)}
              className={`p-1.5 cursor-pointer transition-colors overflow-hidden flex flex-col
                ${currentMonth ? "bg-background hover:bg-accent/40" : "bg-muted/10 hover:bg-accent/20"}`}
            >
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium shrink-0 mb-0.5
                  ${isToday
                    ? "bg-primary text-primary-foreground"
                    : currentMonth
                    ? "text-foreground"
                    : "text-muted-foreground/40"}`}
              >
                {date.getDate()}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden min-h-0">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className="text-[10px] leading-snug px-1.5 py-px rounded bg-primary/15 text-primary truncate shrink-0 cursor-pointer hover:bg-primary/25 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                    title={ev.title}
                  >
                    {!ev.allDay && (
                      <span className="opacity-70 mr-0.5">
                        {new Date(ev.startAt).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[9px] text-muted-foreground px-1">
                    +{dayEvents.length - 3} weitere
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedEvent && (() => {
        const ev = selectedEvent;
        const start = new Date(ev.startAt);
        const end = ev.endAt ? new Date(ev.endAt) : null;
        const dateOpts = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
        const timeOpts = { hour: "2-digit", minute: "2-digit" };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
              <div className="flex items-start justify-between px-6 py-4 border-b border-border gap-3">
                <h3 className="text-base font-medium text-foreground leading-snug">{ev.title}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 flex flex-col gap-3">
                {/* Date / time */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {ev.allDay ? "Datum" : "Zeitraum"}
                  </span>
                  {ev.allDay ? (
                    <span className="text-sm text-foreground">
                      {start.toLocaleDateString("de-DE", dateOpts)}
                    </span>
                  ) : (
                    <span className="text-sm text-foreground">
                      {start.toLocaleDateString("de-DE", dateOpts)},{" "}
                      {start.toLocaleTimeString("de-DE", timeOpts)}
                      {end && (
                        <>
                          {" – "}
                          {isSameDay(start, end)
                            ? end.toLocaleTimeString("de-DE", timeOpts)
                            : `${end.toLocaleDateString("de-DE", dateOpts)}, ${end.toLocaleTimeString("de-DE", timeOpts)}`}
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Description */}
                {ev.description && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Beschreibung</span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{ev.description}</p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-5">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="w-full px-4 py-2.5 rounded-full border border-border text-muted-foreground text-sm hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Neuer Eintrag</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <input
                type="text"
                placeholder="Titel *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <textarea
                placeholder="Beschreibung"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
              />

              {/* allDay toggle */}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, allDay: !f.allDay }))}
                className="flex items-center gap-3 w-fit"
              >
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                    form.allDay ? "bg-primary" : "bg-border"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      form.allDay ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-sm text-muted-foreground">Ganztägig</span>
              </button>

              {form.allDay ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Datum</label>
                  <input
                    type="date"
                    value={form.startAt.slice(0, 10)}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    required
                    className="px-4 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Start *</label>
                    <input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                      required
                      className="px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Ende</label>
                    <input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
              )}

              {formError && <p className="text-destructive text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-full border border-border text-muted-foreground text-sm hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="flex-1 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Wird gespeichert…" : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
