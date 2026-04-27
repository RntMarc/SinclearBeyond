"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { isSameDay } from "@/lib/calendar/calendarUtils";

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
        if (isSameDay(new Date(ev.startAt), day) && !ev.allDay) {
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
      <div className="flex-1 overflow-hidden relative">
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
                    .filter(
                      (ev) =>
                        isSameDay(new Date(ev.startAt), day) && !ev.allDay,
                    )
                    .map((ev) => {
                      const start = new Date(ev.startAt);
                      const end = ev.endAt
                        ? new Date(ev.endAt)
                        : new Date(start.getTime() + 3600000);
                      const startHour =
                        start.getHours() + start.getMinutes() / 60;
                      const duration = (end - start) / 3600000;

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(ev);
                          }}
                          className="absolute left-1 right-1 rounded-md bg-primary/20 border-l-2 border-primary p-1 overflow-hidden cursor-pointer hover:bg-primary/30 transition-colors z-[5]"
                          style={{
                            top: `${startHour * 64}px`,
                            height: `${Math.max(duration * 64, 24)}px`,
                          }}
                        >
                          <div className="text-[10px] font-bold truncate leading-tight">
                            {ev.title}
                          </div>
                          {duration >= 0.75 && (
                            <div className="text-[9px] text-muted-foreground truncate">
                              {start.toLocaleTimeString("de-DE", {
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
