import { useNavigate } from "react-router";
import { Compass } from "lucide-react";
import { useDiscover } from "@/hooks/useDiscover";
import { TrendingTagsSection } from "@/components/home/TrendingTagsSection";
import { PopularDeckCarousel } from "@/components/home/PopularDeckCarousel";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { RecommendedDecksSection } from "@/components/home/RecommendedDecksSection";
import { SuggestedCreatorsSection } from "@/components/home/SuggestedCreatorsSection";

function DiscoverSkeleton() {
  return (
    <div className="animate-pulse px-5">
      {/* Tags skeleton */}
      <div className="mt-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 shrink-0 rounded-full bg-neutral-200"
          />
        ))}
      </div>
      {/* Carousel skeleton */}
      <div className="mt-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 w-36 shrink-0 rounded-xl bg-neutral-200"
          />
        ))}
      </div>
      {/* Feed skeleton */}
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const {
    popularDecks,
    feedItems,
    feedHasMore,
    recommendations,
    suggestedCreators,
    trendingTags,
    followedUserIds,
    followedTags,
    isLoading,
    feedFilter,
    setFeedFilter,
    isLoadingMoreFeed,
    loadMoreFeed,
    toggleFollowUser,
    toggleFollowTag,
  } = useDiscover();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md">
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-neutral-900">Discover</h1>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Find new decks, creators, and topics
          </p>
        </div>
        <DiscoverSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-6">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-neutral-900">Discover</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Find new decks, creators, and topics
        </p>
      </div>

      {/* Trending Tags */}
      <TrendingTagsSection
        tags={trendingTags}
        followedTags={followedTags}
        onToggleTag={toggleFollowTag}
      />

      {/* Popular Decks */}
      <PopularDeckCarousel
        decks={popularDecks}
        onDeckClick={(id) => navigate(`/market/${id}`)}
        onViewAll={() => navigate("/market")}
      />

      {/* Activity Feed */}
      <ActivityFeed
        items={feedItems}
        hasMore={feedHasMore}
        isLoadingMore={isLoadingMoreFeed}
        filter={feedFilter}
        onFilterChange={setFeedFilter}
        onLoadMore={loadMoreFeed}
        onDeckClick={(id) => navigate(`/market/${id}`)}
        onBrowseMarketplace={() => navigate("/market")}
      />

      {/* Recommended Decks */}
      <RecommendedDecksSection
        decks={recommendations}
        hasFollowedTags={followedTags.size > 0}
        onDeckClick={(id) => navigate(`/market/${id}`)}
      />

      {/* Suggested Creators */}
      <SuggestedCreatorsSection
        creators={suggestedCreators}
        followedUserIds={followedUserIds}
        onToggleFollow={toggleFollowUser}
      />
    </div>
  );
}
