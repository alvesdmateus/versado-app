import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { marketplaceApi, type MarketplaceListing } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
import { CommunityHeader } from "@/components/marketplace/CommunityHeader";
import { MarketplaceSearchBar } from "@/components/marketplace/MarketplaceSearchBar";
import { CommunityListingCard } from "@/components/marketplace/CommunityListingCard";
import { DeckFilterTabs } from "@/components/decks/DeckFilterTabs";
import { SortSelect } from "@/components/shared/SortSelect";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";

const CATEGORY_KEYS = ["all", "languages", "science", "history"] as const;

const GRADIENTS = [
  "from-violet-300 to-violet-400",
  "from-emerald-300 to-emerald-400",
  "from-slate-300 to-slate-400",
  "from-amber-300 to-amber-400",
  "from-teal-300 to-teal-400",
  "from-rose-300 to-rose-400",
  "from-blue-300 to-blue-400",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const PAGE_SIZE = 20;

export function CommunityPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["community", "common"]);
  const { showErrorNotification } = useErrorNotification();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_KEYS)[number]>("all");
  const [sortBy, setSortBy] = useState("popular");
  const [minRating, setMinRating] = useState(0);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const handleAddDeck = useCallback(async (deckId: string) => {
    await marketplaceApi.addToLibrary(deckId);
    showToast(t("community:addedToLibrary"));
  }, [showToast, t]);

  const fetchListings = useCallback(async (append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      offsetRef.current = 0;
    }
    try {
      const result = await marketplaceApi.browse({
        search: searchQuery.trim() || undefined,
        tag: activeCategory !== "all" ? activeCategory : undefined,
        sortBy,
        limit: PAGE_SIZE,
        offset: offsetRef.current,
        minRating: minRating || undefined,
      });
      if (append) {
        setListings((prev) => [...prev, ...result.listings]);
      } else {
        setListings(result.listings);
      }
      setHasMore(result.listings.length >= PAGE_SIZE);
      offsetRef.current += result.listings.length;
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, activeCategory, sortBy, minRating]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filterLabels = CATEGORY_KEYS.map((k) => t(`community:categories.${k}`));

  return (
    <div className="pb-4">
      <CommunityHeader />
      <MarketplaceSearchBar value={searchQuery} onChange={setSearchQuery} />
      <DeckFilterTabs
        tabs={filterLabels}
        activeTab={t(`community:categories.${activeCategory}`)}
        onTabChange={(label) => {
          const idx = filterLabels.indexOf(label);
          if (idx >= 0) setActiveCategory(CATEGORY_KEYS[idx]!);
        }}
      />
      {/* Rating filter */}
      <div className="mt-2 flex items-center gap-2 px-5">
        <span className="text-xs text-neutral-500">{t("community:rating.label")}</span>
        {[
          { label: t("community:rating.any"), value: 0 },
          { label: t("community:rating.2plus"), value: 2 },
          { label: t("community:rating.3plus"), value: 3 },
          { label: t("community:rating.4plus"), value: 4 },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMinRating(opt.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              minRating === opt.value
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-end px-5">
        <SortSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "popular", label: t("community:sort.popular") },
            { value: "newest", label: t("community:sort.newest") },
            { value: "rating", label: t("community:sort.highestRated") },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3 px-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-200" />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 px-5">
          {listings.map((listing) => (
            <CommunityListingCard
              key={listing.id}
              title={listing.name}
              creator={listing.creator.displayName}
              thumbnailUrl={listing.coverImageUrl}
              gradient={getGradient(listing.name)}
              rating={listing.rating}
              reviewCount={formatCount(listing.reviewCount)}
              downloads={t("community:downloads", { count: listing.purchaseCount })}
              onClick={() => navigate(`/community/${listing.id}`)}
              onAdd={() => handleAddDeck(listing.id)}
            />
          ))}
          {hasMore && listings.length > 0 && (
            <button
              onClick={() => fetchListings(true)}
              disabled={isLoadingMore}
              className="mt-2 w-full rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 disabled:opacity-50"
            >
              {isLoadingMore ? t("common:loading") : t("community:loadMore")}
            </button>
          )}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center px-5">
          <p className="text-sm text-neutral-500">{t("community:noDecksFound")}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {t("community:tryDifferentSearch")}
          </p>
        </div>
      )}
    </div>
  );
}
