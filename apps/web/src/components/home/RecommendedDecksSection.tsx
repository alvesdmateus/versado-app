import { Hash } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PopularDeck } from "@/lib/social-api";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "@/components/shared";

interface RecommendedDecksSectionProps {
  decks: PopularDeck[];
  hasFollowedTags: boolean;
  onDeckClick: (deckId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function RecommendedDecksSection({
  decks,
  hasFollowedTags,
  onDeckClick,
}: RecommendedDecksSectionProps) {
  const { t } = useTranslation("home");

  return (
    <section className="mt-6">
      <SectionHeader title={t("recommendedForYou")} />
      <div className="mt-3 flex flex-col gap-2 px-5">
        {decks.length === 0 ? (
          !hasFollowedTags ? (
            <EmptyState
              icon={<Hash className="h-10 w-10" />}
              title={t("followTopicsTitle")}
              description={t("followTopicsDesc")}
            />
          ) : (
            <p className="py-6 text-center text-sm text-neutral-400">
              {t("noRecommendations")}
            </p>
          )
        ) : (
          decks.map((deck) => (
            <MarketplaceListingCard
              key={deck.id}
              title={deck.name}
              creator={deck.creator.displayName}
              thumbnailUrl={deck.coverImageUrl}
              price={deck.price > 0 ? deck.price / 100 : null}
              rating={deck.rating}
              reviewCount={formatCount(deck.purchaseCount)}
              downloads={`${formatCount(deck.purchaseCount)} downloads`}
              onClick={() => onDeckClick(deck.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
