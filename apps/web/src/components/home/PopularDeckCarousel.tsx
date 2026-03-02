import { useTranslation } from "react-i18next";
import type { PopularDeck } from "@/lib/social-api";
import { SectionHeader } from "./SectionHeader";
import { PopularDeckCard } from "./PopularDeckCard";

interface PopularDeckCarouselProps {
  decks: PopularDeck[];
  onDeckClick: (deckId: string) => void;
  onViewAll: () => void;
  onAddDeck?: (deckId: string) => Promise<void>;
}

export function PopularDeckCarousel({
  decks,
  onDeckClick,
  onViewAll,
  onAddDeck,
}: PopularDeckCarouselProps) {
  const { t } = useTranslation("home");

  if (decks.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionHeader title={t("popularDecks")} action={{ label: t("viewAll"), onClick: onViewAll }} />
      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory">
        {decks.map((deck) => (
          <div key={deck.id} className="flex-shrink-0 snap-start">
            <PopularDeckCard
              deck={deck}
              onClick={() => onDeckClick(deck.id)}
              onAdd={onAddDeck ? () => onAddDeck(deck.id) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
