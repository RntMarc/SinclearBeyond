const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function CalendarDayLabels() {
  return (
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
  );
}
