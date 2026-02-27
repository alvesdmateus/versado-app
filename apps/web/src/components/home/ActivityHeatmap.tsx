import type { DailyActivity } from "@/lib/dashboard-api";

interface ActivityHeatmapProps {
  days: DailyActivity[];
}

function getCellColor(sessions: number): string {
  if (sessions === 0) return "bg-neutral-100";
  if (sessions === 1) return "bg-primary-200";
  if (sessions <= 3) return "bg-primary-400";
  return "bg-primary-600";
}

function getMonthLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleString("default", { month: "short" });
}

export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
  // Group days into weeks (columns). Each column = 7 days (Sun→Sat).
  // Pad the start so the first day lands on the right weekday.
  const firstDate = days.length > 0 ? new Date(days[0]!.date + "T00:00:00") : new Date();
  const startPadding = firstDate.getDay(); // 0=Sun, 1=Mon, …, 6=Sat

  const paddedDays: (DailyActivity | null)[] = [
    ...Array(startPadding).fill(null),
    ...days,
  ];

  // Split into weeks
  const weeks: (DailyActivity | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  // Month labels: show label on the first column that starts in a new month
  const monthLabels: (string | null)[] = weeks.map((week) => {
    const firstReal = week.find((d) => d !== null);
    if (!firstReal) return null;
    // Show month label only on the first week of each month
    const date = new Date(firstReal.date + "T00:00:00");
    if (date.getDate() <= 7) return getMonthLabel(firstReal.date);
    return null;
  });

  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1 pb-1">
        {/* Day-of-week labels column */}
        <div className="flex flex-col gap-1 pr-1 pt-4">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-3 w-3 items-center justify-center text-[9px] leading-none text-neutral-400"
            >
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {/* Month label */}
            <div className="h-4 text-[9px] leading-none text-neutral-400">
              {monthLabels[wi] ?? ""}
            </div>
            {/* Day cells */}
            {week.map((day, di) => (
              <div
                key={di}
                title={day ? `${day.date}: ${day.cardsStudied} cards` : undefined}
                className={`h-3 w-3 rounded-sm ${
                  day ? getCellColor(day.sessions) : "invisible"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
