import { useState } from "react";
import { Layers, Star, Plus, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PopularDeck } from "@/lib/social-api";

interface PopularDeckCardProps {
  deck: PopularDeck;
  onClick: () => void;
  onAdd?: () => Promise<void>;
}

export function PopularDeckCard({ deck, onClick, onAdd }: PopularDeckCardProps) {
  const { t } = useTranslation("community");
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  async function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onAdd || isAdding || isAdded) return;
    setIsAdding(true);
    try {
      await onAdd();
      setIsAdded(true);
    } finally {
      setIsAdding(false);
    }
  }

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
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning-500 text-warning-500" />
            <span className="text-xs font-medium text-neutral-700">
              {deck.rating.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400">
              &middot; {deck.purchaseCount}
            </span>
          </div>
          {onAdd && (
            <span
              role="button"
              onClick={handleAdd}
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                isAdded
                  ? "bg-success-100 text-success-700"
                  : "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700"
              }`}
            >
              {isAdding ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : isAdded ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <>
                  <Plus className="h-2.5 w-2.5" />
                  {t("get")}
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
