import { ArrowRight, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface TodayReviewCardProps {
  cardsDue: number;
  onStudyNow: () => void;
}

export function TodayReviewCard({
  cardsDue,
  onStudyNow,
}: TodayReviewCardProps) {
  const { t } = useTranslation("home");

  return (
    <div className="relative mx-5 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 shadow-card-lg">
      <div className="absolute top-4 right-4 opacity-20">
        <BookOpen className="h-12 w-12 text-white" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-primary-100">
        {t("todayReview")}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">{cardsDue}</span>
        <span className="text-base text-primary-100">{t("cardsDue")}</span>
      </div>
      <button
        onClick={onStudyNow}
        className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-neutral-0 px-6 py-2.5 text-sm font-semibold text-primary-600 shadow-card transition-colors hover:bg-primary-50"
      >
        {t("studyNow")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
