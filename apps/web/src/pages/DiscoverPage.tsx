import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Compass } from "lucide-react";
import { useDiscover } from "@/hooks/useDiscover";
import { marketplaceApi } from "@/lib/marketplace-api";
import { blocksApi } from "@/lib/blocks-api";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmDialog, ReportModal } from "@/components/shared";
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
  const { t } = useTranslation(["home", "community", "common"]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Report & block state
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [blockTarget, setBlockTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [hiddenCreatorIds, setHiddenCreatorIds] = useState<Set<string>>(new Set());
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

  const handleAddDeck = useCallback(async (deckId: string) => {
    await marketplaceApi.addToLibrary(deckId);
    showToast(t("community:addedToLibrary"));
  }, [showToast, t]);

  async function handleBlock() {
    if (!blockTarget) return;
    setIsBlocking(true);
    try {
      await blocksApi.blockUser(blockTarget.id);
      showToast(t("common:block.success", { name: blockTarget.name }));
      setHiddenCreatorIds((prev) => new Set([...prev, blockTarget.id]));
      setBlockTarget(null);
    } catch {
      showToast(t("common:block.error"), "error");
    } finally {
      setIsBlocking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md">
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-neutral-900">{t("discover.heading")}</h1>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {t("discover.subtitle")}
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
        onDeckClick={(id) => navigate(`/community/${id}`)}
        onViewAll={() => navigate("/community")}
        onAddDeck={handleAddDeck}
      />

      {/* Activity Feed */}
      <ActivityFeed
        items={feedItems}
        hasMore={feedHasMore}
        isLoadingMore={isLoadingMoreFeed}
        filter={feedFilter}
        onFilterChange={setFeedFilter}
        onLoadMore={loadMoreFeed}
        onDeckClick={(id) => navigate(`/community/${id}`)}
        onBrowseCommunity={() => navigate("/community")}
        onAddDeck={handleAddDeck}
      />

      {/* Recommended Decks */}
      <RecommendedDecksSection
        decks={recommendations}
        hasFollowedTags={followedTags.size > 0}
        onDeckClick={(id) => navigate(`/community/${id}`)}
        onAddDeck={handleAddDeck}
      />

      {/* Suggested Creators */}
      <SuggestedCreatorsSection
        creators={suggestedCreators.filter((c) => !hiddenCreatorIds.has(c.id))}
        followedUserIds={followedUserIds}
        onToggleFollow={toggleFollowUser}
        onReportCreator={(id, name) => setReportTarget({ id, name })}
        onBlockCreator={(id, name) => setBlockTarget({ id, name })}
      />

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          isOpen
          onClose={() => setReportTarget(null)}
          targetType="user"
          targetId={reportTarget.id}
          displayName={reportTarget.name}
        />
      )}

      {/* Block confirm dialog */}
      <ConfirmDialog
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlock}
        title={t("common:block.title", { name: blockTarget?.name })}
        message={t("common:block.message")}
        confirmLabel={t("common:block.confirm")}
        variant="danger"
        isLoading={isBlocking}
      />
    </div>
  );
}
