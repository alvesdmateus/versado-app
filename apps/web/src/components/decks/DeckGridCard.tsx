import { Clock, Heart, Layers } from "lucide-react";
import { CircularProgress } from "@versado/ui";

export interface DeckGridCardProps {
  name: string;
  cardCount: number;
  coverImageUrl: string | null;
  gradient?: string;
  progress: number;
  lastStudied: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
}

export function DeckGridCard({
  name,
  cardCount,
  coverImageUrl,
  gradient = "from-primary-100 to-primary-200",
  progress,
  lastStudied,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: DeckGridCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-xl bg-neutral-0 text-left shadow-card transition-shadow hover:shadow-card-hover active:scale-[0.98]"
    >
      <div className="relative h-28 overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br dark:brightness-75 ${gradient}`}>
            <Layers className="h-8 w-8 text-white/40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <CircularProgress value={progress} size={32} strokeWidth={2.5} />
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/30"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-white"
              }`}
            />
          </button>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-neutral-900">
          {name}
        </h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          {cardCount.toLocaleString()} Cards
        </p>
        <div className="mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3 text-neutral-400" />
          <span className="text-[10px] font-medium uppercase text-neutral-400">
            {lastStudied}
          </span>
        </div>
      </div>
    </button>
  );
}
