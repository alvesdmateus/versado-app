import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { SortSelect } from "@/components/shared/SortSelect";

const DIFFICULTY_OPTIONS = ["all", "easy", "medium", "hard"] as const;

interface CardFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: string;
  onDifficultyChange: (d: string) => void;
  sort: string;
  onSortChange: (s: string) => void;
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function CardFilters({
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  sort,
  onSortChange,
  allTags,
  selectedTags,
  onTagToggle,
}: CardFiltersProps) {
  const { t } = useTranslation("decks");

  const difficultyLabels: Record<string, string> = {
    all: t("cardFilters.all"),
    easy: t("cardFilters.easy"),
    medium: t("cardFilters.medium"),
    hard: t("cardFilters.hard"),
  };

  const sortOptions = [
    { value: "newest", label: t("cardFilters.newest") },
    { value: "oldest", label: t("cardFilters.oldest") },
    { value: "a-z", label: t("cardFilters.az") },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-0 px-3.5 py-2">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder={t("cardFilters.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Difficulty chips + Sort */}
      <div className="flex items-center justify-between">
        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDifficultyChange(d)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                d === difficulty
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {difficultyLabels[d]}
            </button>
          ))}
        </div>
        <SortSelect value={sort} onChange={onSortChange} options={sortOptions} />
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto">
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary-100 text-primary-700"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
