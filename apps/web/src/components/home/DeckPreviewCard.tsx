import { Layers } from "lucide-react";
import { CircularProgress } from "@flashcard/ui";

export interface DeckPreviewCardProps {
  name: string;
  cardCount: number;
  coverImageUrl: string | null;
  progress: number;
  onClick?: () => void;
}

export function DeckPreviewCard({
  name,
  cardCount,
  coverImageUrl,
  progress,
  onClick,
}: DeckPreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-44 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-0 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="h-28 overflow-hidden bg-neutral-200">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <Layers className="h-8 w-8 text-primary-400" />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-neutral-900">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            {cardCount.toLocaleString()} Cards
          </p>
        </div>
        <CircularProgress value={progress} size={32} strokeWidth={2.5} />
      </div>
    </button>
  );
}
