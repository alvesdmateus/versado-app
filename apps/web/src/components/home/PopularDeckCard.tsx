import { Layers, Star } from "lucide-react";
import type { PopularDeck } from "@/lib/social-api";

interface PopularDeckCardProps {
  deck: PopularDeck;
  onClick: () => void;
}

export function PopularDeckCard({ deck, onClick }: PopularDeckCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-44 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-0 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="h-24 overflow-hidden bg-neutral-200">
        {deck.coverImageUrl ? (
          <img
            src={deck.coverImageUrl}
            alt={deck.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <Layers className="h-8 w-8 text-primary-400" />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-neutral-900">
          {deck.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          by {deck.creator.displayName}
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          <Star className="h-3 w-3 fill-warning-500 text-warning-500" />
          <span className="text-xs font-medium text-neutral-700">
            {deck.rating.toFixed(1)}
          </span>
          <span className="text-xs text-neutral-400">
            &middot; {deck.purchaseCount} downloads
          </span>
        </div>
      </div>
    </button>
  );
}
