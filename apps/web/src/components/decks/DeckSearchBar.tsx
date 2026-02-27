import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

export interface DeckSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function DeckSearchBar({ value, onChange }: DeckSearchBarProps) {
  const { t } = useTranslation("decks");

  return (
    <div className="mx-5 mt-3">
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-0 px-4 py-2.5">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder={t("search.placeholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>
    </div>
  );
}
