import type { DashboardHistory } from "@/lib/dashboard-api";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { StudySparkline } from "./StudySparkline";

interface ActivitySectionProps {
  history: DashboardHistory | null;
}

export function ActivitySection({ history }: ActivitySectionProps) {
  if (!history) {
    // Skeleton
    return (
      <div className="mt-5 px-5">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        <div className="mt-3 flex gap-3">
          <div className="h-14 flex-1 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-14 flex-1 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>
    );
  }

  const days = history.days;

  // Last 30 days for sparklines
  const last30 = days.slice(-30);

  const accuracyData = last30.map((d) =>
    d.cardsStudied > 0 ? Math.round((d.correctCount / d.cardsStudied) * 100) : 0
  );

  const cardsData = last30.map((d) => d.cardsStudied);

  const totalCardsLast30 = last30.reduce((sum, d) => sum + d.cardsStudied, 0);
  const totalCorrectLast30 = last30.reduce((sum, d) => sum + d.correctCount, 0);
  const avgAccuracy =
    totalCardsLast30 > 0
      ? Math.round((totalCorrectLast30 / totalCardsLast30) * 100)
      : 0;
  const avgCards =
    last30.length > 0
      ? Math.round(totalCardsLast30 / last30.length)
      : 0;

  const hasAnyActivity = days.some((d) => d.sessions > 0);

  return (
    <div className="mt-5 px-5">
      <h2 className="mb-3 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
        Activity
      </h2>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-card">
        {hasAnyActivity ? (
          <ActivityHeatmap days={days} />
        ) : (
          <p className="py-2 text-center text-xs text-neutral-400">
            Start studying to see your activity
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-card">
          <StudySparkline
            data={accuracyData}
            label="Accuracy"
            currentValue={`${avgAccuracy}%`}
          />
        </div>
        <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-card">
          <StudySparkline
            data={cardsData}
            label="Cards / day"
            currentValue={`${avgCards}`}
          />
        </div>
      </div>
    </div>
  );
}
