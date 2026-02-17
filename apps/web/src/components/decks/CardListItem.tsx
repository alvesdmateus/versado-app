import { Trash2 } from "lucide-react";
import type { FlashcardResponse } from "@/lib/deck-api";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-success-100 text-success-700",
  medium: "bg-warning-100 text-warning-700",
  hard: "bg-error-100 text-error-700",
};

interface CardListItemProps {
  card: FlashcardResponse;
  onEdit: (card: FlashcardResponse) => void;
  onDelete: (cardId: string) => void;
}

export function CardListItem({ card, onEdit, onDelete }: CardListItemProps) {
  return (
    <div className="group flex items-start gap-3 rounded-xl bg-neutral-0 p-4 shadow-card transition-shadow hover:shadow-card-hover">
      <button
        onClick={() => onEdit(card)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-neutral-900">
            {card.front}
          </p>
          {card.difficulty && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                DIFFICULTY_STYLES[card.difficulty] ?? "bg-neutral-100 text-neutral-600"
              }`}
            >
              {card.difficulty}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500">{card.back}</p>
        {card.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(card.id);
        }}
        className="shrink-0 rounded-lg p-1.5 text-neutral-300 opacity-0 transition-all hover:text-error-500 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
