import { DeckPreviewCard, type DeckPreviewCardProps } from "./DeckPreviewCard";

export interface DeckCarouselProps {
  decks: DeckPreviewCardProps[];
  onViewAll?: () => void;
}

export function DeckCarousel({ decks, onViewAll }: DeckCarouselProps) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-lg font-bold text-neutral-900">Your Decks</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
          >
            View All
          </button>
        )}
      </div>

      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory">
        {decks.map((deck, index) => (
          <div key={index} className="flex-shrink-0 snap-start">
            <DeckPreviewCard {...deck} />
          </div>
        ))}
      </div>
    </section>
  );
}
