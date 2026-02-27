import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { DropdownMenu } from "@/components/shared/DropdownMenu";

interface DeckDetailHeaderProps {
  title: string;
  onBack: () => void;
  menuItems: Array<{
    label: string;
    icon: ReactNode;
    onClick: () => void;
    variant?: "default" | "danger";
  }>;
}

export function DeckDetailHeader({
  title,
  onBack,
  menuItems,
}: DeckDetailHeaderProps) {
  const { t } = useTranslation("decks");

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm">{t("detail.back")}</span>
      </button>
      <h1 className="flex-1 truncate text-center text-lg font-semibold text-neutral-900 px-2">
        {title}
      </h1>
      <DropdownMenu
        trigger={
          <div className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100">
            <MoreVertical className="h-5 w-5" />
          </div>
        }
        items={menuItems}
      />
    </div>
  );
}
