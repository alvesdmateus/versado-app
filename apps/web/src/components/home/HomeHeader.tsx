import { useTranslation } from "react-i18next";
import { StreakBadge } from "@versado/ui";

export interface HomeHeaderProps {
  userName: string;
  streakCount: number;
}

export function HomeHeader({ userName, streakCount }: HomeHeaderProps) {
  const { t } = useTranslation("home");

  return (
    <header className="flex items-start justify-between px-5 pt-6 pb-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {t("greeting", { name: userName })}
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {t("subtitle")}
        </p>
      </div>
      <StreakBadge
        count={streakCount}
        icon={<span className="animate-fire text-base leading-none">🔥</span>}
      />
    </header>
  );
}
