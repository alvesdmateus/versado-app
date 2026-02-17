interface SampleCardListProps {
  cards: Array<{ id: string; front: string; back: string }>;
}

export function SampleCardList({ cards }: SampleCardListProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-lg border border-neutral-200 bg-neutral-0 p-3"
        >
          <p className="text-sm font-medium text-neutral-900">{card.front}</p>
          <div className="my-2 border-t border-dashed border-neutral-200" />
          <p className="text-sm text-neutral-600">{card.back}</p>
        </div>
      ))}
    </div>
  );
}
