import { useTranslation } from "react-i18next";
import { getCardLabels, CARD_LABELS } from "@versado/core";

export function CardLabelBadges({ tags }: { tags: string[] }) {
  const { t } = useTranslation("study");
  const labels = getCardLabels(tags);

  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {labels.map((label) => {
        const { color, bgColor } = CARD_LABELS[label];
        return (
          <span
            key={label}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${color} ${bgColor}`}
          >
            {t(`labels.${label}`)}
          </span>
        );
      })}
    </div>
  );
}
