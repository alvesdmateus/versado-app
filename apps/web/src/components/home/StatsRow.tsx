import { StatCard } from "@flashcard/ui";

export interface StatsRowProps {
  mastered: number;
  masteredTrend: string;
  accuracy: string;
  accuracyTrend: string;
  streakDays: number;
  streakActive: boolean;
}

export function StatsRow({
  mastered,
  masteredTrend,
  accuracy,
  accuracyTrend,
  streakDays,
  streakActive,
}: StatsRowProps) {
  return (
    <div className="mt-5 flex gap-3 px-5">
      <StatCard
        label="Mastered"
        value={mastered.toLocaleString()}
        trend={`↗ ${masteredTrend}`}
      />
      <StatCard
        label="Accuracy"
        value={accuracy}
        trend={`↗ ${accuracyTrend}`}
      />
      <StatCard
        label="Streak"
        value={`${streakDays}d`}
        trend={streakActive ? "⚡ Active" : "Inactive"}
      />
    </div>
  );
}
