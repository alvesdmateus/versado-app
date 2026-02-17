import { Store } from "lucide-react";
import type { FeedItem } from "@/lib/social-api";
import { SectionHeader } from "./SectionHeader";
import { FeedItemCard } from "./FeedItemCard";
import { EmptyState } from "@/components/shared";

interface ActivityFeedProps {
  items: FeedItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  filter: string;
  onFilterChange: (filter: string) => void;
  onLoadMore: () => void;
  onDeckClick: (deckId: string) => void;
  onBrowseMarketplace: () => void;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "users", label: "Creators" },
  { value: "tags", label: "Tags" },
];

export function ActivityFeed({
  items,
  hasMore,
  isLoadingMore,
  filter,
  onFilterChange,
  onLoadMore,
  onDeckClick,
  onBrowseMarketplace,
}: ActivityFeedProps) {
  return (
    <section className="mt-6">
      <SectionHeader title="Activity" />

      {/* Filter chips */}
      <div className="mt-2 flex gap-2 px-5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      <div className="mt-3 flex flex-col gap-2 px-5">
        {items.length === 0 ? (
          <EmptyState
            icon={<Store className="h-10 w-10" />}
            title="No activity yet"
            description="Follow creators or tags to see activity here"
            action={{
              label: "Browse Marketplace",
              onClick: onBrowseMarketplace,
            }}
          />
        ) : (
          <>
            {items.map((item, index) => (
              <FeedItemCard
                key={`${item.deck.id}-${index}`}
                item={item}
                onDeckClick={onDeckClick}
              />
            ))}
            {hasMore && (
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="mt-1 w-full rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 disabled:opacity-50"
              >
                {isLoadingMore ? "Loading..." : "Show More"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
