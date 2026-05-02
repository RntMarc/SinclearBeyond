"use client";
import { Cake, ChevronDown, ChevronUp, Plane } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isEventOnDay } from "@/lib/calendar/calendarUtils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

export default function TimeGridView({
  days,
  eventList,
  onEventClick,
  onDayClick,
}) {
  const scrollContainerRef = useRef(null);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);

  useEffect(() => {
    // Initial scroll to 08:00
    if (scrollContainerRef.current) {
      const rowHeight = 64; // h-16 is 64px
      scrollContainerRef.current.scrollTop = DEFAULT_START_HOUR * rowHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    // Check for events above/below visible area
    // Simplified: just check if there are events in hidden hours
    const rowHeight = 64;
    const visibleStartHour = Math.floor(scrollTop / rowHeight);
    const visibleEndHour = Math.ceil((scrollTop + clientHeight) / rowHeight);

    let hasAbove = false;
    let hasBelow = false;

    days.forEach((day) => {
      eventList.forEach((ev) => {
        if (isEventOnDay(ev, day) && !ev.allDay) {
          const hour = new Date(ev.startAt).getHours();
          if (hour < visibleStartHour) hasAbove = true;
          if (hour >= visibleEndHour) hasBelow = true;
        }
      });
    });

    setShowUpArrow(hasAbove);
    setShowDownArrow(hasBelow);
  };

  useEffect(() => {
    handleScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventList, days]);

  const scrollToMore = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      top: direction === "up" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative bg-background">
      {/* Day Headers */}
      <div className="flex border-b border-border ml-12 shrink-0">
        {days.map((day, i) => (
          <div
            key={i}
            onClick={() => onDayClick(day)}
            className="flex-1 py-3 text-center border-l border-border first:border-l-0 cursor-pointer hover:bg-accent/20 transition-colors"
          >
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {day.toLocaleDateString("de-DE", { weekday: "short" })}
            </div>
            <div className="text-lg font-light">{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* All Day Events Section */}
        <div className="flex border-b border-border ml-12 shrink-0 bg-muted/5">
          {days.map((day, dayIdx) => {
            const allDayEvents = eventList.filter(
              (ev) => isEventOnDay(ev, day) && ev.allDay,
            );
            return (
              <div
                key={dayIdx}
                className="flex-1 p-1 min-h-[32px] border-l border-border first:border-l-0 flex flex-col gap-1"
              >
                {allDayEvents.map((ev) => {
                  const isTrip =
                    ev.type === "trip" || ev.type === "travelEvent";
                  const isBirthday = ev.type === "birthday";
                  const styleClass = isTrip
                    ? "bg-trip/20 border-trip text-trip"
                    : isBirthday
                      ? "bg-birthday/20 border-birthday text-birthday"
                      : "bg-primary/20 border-primary text-primary";

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer transition-colors hover:brightness-95 flex items-center gap-1 ${styleClass}`}
                    >
                      {isTrip && <Plane size={10} className="shrink-0" />}
                      {isBirthday && <Cake size={10} className="shrink-0" />}
                      <span className="truncate">{ev.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {showUpArrow && (
          <button
            onClick={() => scrollToMore("up")}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-primary text-primary-foreground rounded-full p-1 shadow-lg animate-bounce"
          >
            <ChevronUp size={16} />
          </button>
        )}
        {showDownArrow && (
          <button
            onClick={() => scrollToMore("down")}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-primary text-primary-foreground rounded-full p-1 shadow-lg animate-bounce"
          >
            <ChevronDown size={16} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-hide select-none"
        >
          <div className="relative flex min-h-full">
            {/* Hour Labels */}
            <div className="w-12 border-r border-border sticky left-0 bg-background z-10 shrink-0">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-16 text-[10px] text-muted-foreground text-right pr-2 pt-2 tabular-nums"
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Columns */}
            <div className="flex flex-1 divide-x divide-border relative">
              {days.map((day, dayIdx) => (
                <div key={dayIdx} className="flex-1 relative">
                  {/* Hour Lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-border/40 last:border-b-0"
                    />
                  ))}

                  {/* Events */}
                  {eventList
                    .filter((ev) => isEventOnDay(ev, day) && !ev.allDay)
                    .map((ev) => {
                      const eventStart = new Date(ev.startAt);
                      const eventEnd = ev.endAt
                        ? new Date(ev.endAt)
                        : new Date(eventStart.getTime() + 3600000);

                      const dayStart = new Date(day);
                      dayStart.setHours(0, 0, 0, 0);
                      const dayEnd = new Date(day);
                      dayEnd.setHours(23, 59, 59, 999);

                      const effectiveStart =
                        eventStart < dayStart ? dayStart : eventStart;
                      const effectiveEnd =
                        eventEnd > dayEnd ? dayEnd : eventEnd;

                      const startHour =
                        effectiveStart.getHours() +
                        effectiveStart.getMinutes() / 60;
                      const duration =
                        (effectiveEnd - effectiveStart) / 3600000;

                      const isTrip =
                        ev.type === "trip" || ev.type === "travelEvent";
                      const isBirthday = ev.type === "birthday";
                      const styleClass = isTrip
                        ? "bg-trip/20 border-trip hover:bg-trip/30"
                        : isBirthday
                          ? "bg-birthday/20 border-birthday hover:bg-birthday/30"
                          : "bg-primary/20 border-primary hover:bg-primary/30";

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(ev);
                          }}
                          className={`absolute left-1 right-1 rounded-md border-l-2 p-1 overflow-hidden cursor-pointer transition-colors z-[5] ${styleClass}`}
                          style={{
                            top: `${startHour * 64}px`,
                            height: `${Math.max(duration * 64, 24)}px`,
                          }}
                        >
                          <div className="text-[10px] font-bold truncate leading-tight flex items-center gap-1">
                            {isTrip && <Plane size={10} className="shrink-0" />}
                            {isBirthday && (
                              <Cake size={10} className="shrink-0" />
                            )}
                            <span className="truncate">{ev.title}</span>
                          </div>
                          {duration >= 0.75 && (
                            <div className="text-[9px] text-muted-foreground truncate">
                              {eventStart.toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
