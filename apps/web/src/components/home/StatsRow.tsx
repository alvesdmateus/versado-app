import { useTranslation } from "react-i18next";
import { StatCard } from "@versado/ui";

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
  const { t } = useTranslation("home");

  return (
    <div className="mt-5 flex gap-3 px-5">
      <div className="flex-1 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <StatCard
          label={t("statsRow.mastered")}
          value={mastered.toLocaleString()}
          trend={`↗ ${masteredTrend}`}
        />
      </div>
      <div className="flex-1 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <StatCard
          label={t("statsRow.accuracy")}
          value={accuracy}
          trend={`↗ ${accuracyTrend}`}
        />
      </div>
      <div className={`flex-1 animate-fade-in-up ${streakActive ? "animate-pop" : ""}`} style={{ animationDelay: "160ms" }}>
        <StatCard
          label={t("statsRow.streak")}
          value={`${streakDays}d`}
          trend={streakActive ? `⚡ ${t("statsRow.active")}` : t("statsRow.inactive")}
        />
      </div>
    </div>
  );
}
