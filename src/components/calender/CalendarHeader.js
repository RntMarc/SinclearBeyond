"use client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MONTHS } from "@/lib/calendar/calendarUtils";

export default function CalendarHeader({ year, month, onPrev, onNext, onToday, onNew }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="text-base font-light text-foreground w-44 text-center select-none">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight size={17} />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 px-3 py-1 text-xs rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Heute
        </button>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus size={15} />
        Neuer Eintrag
      </button>
    </div>
  );
}
