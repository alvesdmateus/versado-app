import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { marketplaceApi, type MarketplaceListing } from "@/lib/marketplace-api";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceSearchBar } from "@/components/marketplace/MarketplaceSearchBar";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";
import { DeckFilterTabs } from "@/components/decks/DeckFilterTabs";
import { SortSelect } from "@/components/shared/SortSelect";

const CATEGORY_TABS = ["All", "Languages", "Science", "History"];

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

export function MarketplacePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

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
        tag: activeCategory !== "All" ? activeCategory : undefined,
        sortBy,
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      if (append) {
        setListings((prev) => [...prev, ...result.listings]);
      } else {
        setListings(result.listings);
      }
      setHasMore(result.listings.length >= PAGE_SIZE);
      offsetRef.current += result.listings.length;
    } catch {
      // Silently fail — show empty state
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, activeCategory, sortBy]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <div className="pb-4">
      <MarketplaceHeader />
      <MarketplaceSearchBar value={searchQuery} onChange={setSearchQuery} />
      <DeckFilterTabs
        tabs={CATEGORY_TABS}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />
      <div className="mt-2 flex justify-end px-5">
        <SortSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "popular", label: "Popular" },
            { value: "newest", label: "Newest" },
            { value: "rating", label: "Highest Rated" },
            { value: "price_asc", label: "Price: Low → High" },
            { value: "price_desc", label: "Price: High → Low" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 px-5">
          {listings.map((listing) => (
            <MarketplaceListingCard
              key={listing.id}
              title={listing.name}
              creator={listing.creator.displayName}
              thumbnailUrl={listing.coverImageUrl}
              gradient={getGradient(listing.name)}
              price={listing.price > 0 ? listing.price / 100 : null}
              rating={listing.rating}
              reviewCount={formatCount(listing.reviewCount)}
              downloads={
                listing.price > 0
                  ? `${formatCount(listing.purchaseCount)} sales`
                  : `${formatCount(listing.purchaseCount)} downloads`
              }
              onClick={() => navigate(`/market/${listing.id}`)}
            />
          ))}
          {hasMore && listings.length > 0 && (
            <button
              onClick={() => fetchListings(true)}
              disabled={isLoadingMore}
              className="mt-2 w-full rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 disabled:opacity-50"
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center px-5">
          <p className="text-sm text-neutral-500">No decks found</p>
          <p className="mt-1 text-xs text-neutral-400">
            Try a different search or category
          </p>
        </div>
      )}
    </div>
  );
}
