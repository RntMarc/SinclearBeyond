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
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MONTHS } from "@/lib/calendar/calendarUtils";

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
  const t = useTranslations("Calendar");
  const isMobile = useIsMobile();

  const VIEW_MODES = [
    { id: "month", label: t("views.month"), icon: Calendar },
    { id: "week", label: t("views.week"), icon: CalendarRange },
    { id: "day", label: t("views.day"), icon: CalendarDays },
    { id: "agenda", label: t("views.agenda"), icon: List },
  ];

  return (
    <div
      className={`flex flex-col ${isMobile ? "" : "sm:flex-row"} items-center justify-between px-4 sm:px-6 py-3 border-b border-border shrink-0 gap-4`}
    >
      <div
        className={`flex items-center justify-between w-full ${
          isMobile ? "" : "sm:w-auto"
        } gap-2`}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          {viewMode !== "agenda" && (
            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 rounded-[2rem] hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={17} />
            </button>
          )}
          <span
            className={`text-sm sm:text-base font-light text-foreground select-none ${viewMode !== "agenda" ? "min-w-[120px] sm:w-44 text-center" : ""}`}
          >
            {viewMode === "agenda" ? t("agenda") : `${MONTHS[month]} ${year}`}
          </span>
          {viewMode !== "agenda" && (
            <>
              <button
                type="button"
                onClick={onNext}
                className="p-1.5 rounded-[2rem] hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight size={17} />
              </button>
              <button
                type="button"
                onClick={onToday}
                className="ml-1 px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {t("today")}
              </button>
            </>
          )}
        </div>

        {/* View Switcher Mobile - icons only */}
        {isMobile && (
          <div className="flex bg-muted/50 p-1 rounded-[2rem]">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`p-1.5 rounded-2xl transition-colors ${
                  viewMode === mode.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <mode.icon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={`flex items-center gap-2 sm:gap-4 w-full ${
          isMobile ? "hidden" : "sm:w-auto"
        } justify-end`}
      >
        {/* View Switcher Desktop - text/icons */}
        <div className="hidden sm:flex bg-muted/50 p-1 rounded-[2rem]">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${
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

        <Button
          type="button"
          onClick={onNew}
          className={`${isMobile ? "hidden" : "hidden md:flex"} shrink-0`}
        >
          <Plus size={15} />
          {t("newEntry")}
        </Button>
      </div>
    </div>
  );
}
