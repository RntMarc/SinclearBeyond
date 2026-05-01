"use client";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
} from "lucide-react";
import { MONTHS } from "@/lib/calendar/calendarUtils";

const VIEW_MODES = [
  { id: "month", label: "Monat", icon: Calendar },
  { id: "week", label: "Woche", icon: CalendarRange },
  { id: "day", label: "Tag", icon: CalendarDays },
  { id: "agenda", label: "Agenda", icon: List },
];

export default function CalendarHeader({
  year,
  month,
  viewMode,
  setViewMode,
  onPrev,
  onNext,
  onToday,
  onNew,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-b border-border shrink-0 gap-4">
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          {viewMode !== "agenda" && (
            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={17} />
            </button>
          )}
          <span
            className={`text-sm sm:text-base font-light text-foreground select-none ${viewMode !== "agenda" ? "min-w-[120px] sm:w-44 text-center" : ""}`}
          >
            {viewMode === "agenda" ? "Agenda" : `${MONTHS[month]} ${year}`}
          </span>
          {viewMode !== "agenda" && (
            <>
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
                className="ml-1 px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Heute
              </button>
            </>
          )}
        </div>

        {/* View Switcher Mobile - icons only */}
        <div className="flex sm:hidden bg-muted/50 p-1 rounded-lg">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === mode.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <mode.icon size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
        {/* View Switcher Desktop - text/icons */}
        <div className="hidden sm:flex bg-muted/50 p-1 rounded-lg">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === mode.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <mode.icon size={14} />
              <span className="hidden md:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNew}
          className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus size={15} />
          Neuer Eintrag
        </button>
      </div>
    </div>
  );
}
