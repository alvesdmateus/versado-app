import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BarChart3, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocialHome } from "@/hooks/useSocialHome";
import { HomeHeader } from "@/components/home/HomeHeader";
import { TodayReviewCard } from "@/components/home/TodayReviewCard";
import { StatsRow } from "@/components/home/StatsRow";
import { ActivitySection } from "@/components/home/ActivitySection";
import { DeckCarousel } from "@/components/home/DeckCarousel";
import { TrendingTagsSection } from "@/components/home/TrendingTagsSection";
import { PopularDeckCarousel } from "@/components/home/PopularDeckCarousel";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { RecommendedDecksSection } from "@/components/home/RecommendedDecksSection";
import { SuggestedCreatorsSection } from "@/components/home/SuggestedCreatorsSection";
import { HomeSkeleton } from "@/components/shared";
import { dashboardApi, type DashboardHistory } from "@/lib/dashboard-api";

export function HomePage() {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    stats,
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
  } = useSocialHome();

  const [history, setHistory] = useState<DashboardHistory | null>(null);

  useEffect(() => {
    dashboardApi.getHistory().then(setHistory).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <HomeSkeleton />;
  }

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const firstDeckWithCards = stats?.decks.find((d) => d.cardCount > 0);

  return (
    <div className="pb-4">
      {/* Personal section */}
      <HomeHeader
        userName={firstName}
        streakCount={stats?.streakDays ?? 0}
      />
      <TodayReviewCard
        cardsDue={stats?.dueToday ?? 0}
        onStudyNow={() =>
          navigate(
            firstDeckWithCards
              ? `/study/${firstDeckWithCards.id}`
              : "/decks"
          )
        }
      />
      <StatsRow
        mastered={stats?.mastered ?? 0}
        masteredTrend=""
        accuracy={stats ? `${stats.accuracy}%` : "0%"}
        accuracyTrend=""
        streakDays={stats?.streakDays ?? 0}
        streakActive={stats?.streakActive ?? false}
      />

      {/* Activity charts */}
      <ActivitySection history={history} />

      {/* Quick links */}
      <div className="mt-4 flex gap-3 px-5">
        <Link
          to="/history"
          className="flex flex-1 items-center gap-2 rounded-xl bg-neutral-0 p-3 shadow-card transition-shadow hover:shadow-card-lg"
        >
          <Clock className="h-5 w-5 text-primary-500" />
          <span className="text-sm font-medium text-neutral-700">{t("studyHistory")}</span>
        </Link>
        <Link
          to="/stats"
          className="flex flex-1 items-center gap-2 rounded-xl bg-neutral-0 p-3 shadow-card transition-shadow hover:shadow-card-lg"
        >
          <BarChart3 className="h-5 w-5 text-primary-500" />
          <span className="text-sm font-medium text-neutral-700">{t("stats")}</span>
        </Link>
      </div>

      {/* Social discovery */}
      <TrendingTagsSection
        tags={trendingTags}
        followedTags={followedTags}
        onToggleTag={toggleFollowTag}
      />

      <PopularDeckCarousel
        decks={popularDecks}
        onDeckClick={(id) => navigate(`/market/${id}`)}
        onViewAll={() => navigate("/market")}
      />

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

      <RecommendedDecksSection
        decks={recommendations}
        hasFollowedTags={followedTags.size > 0}
        onDeckClick={(id) => navigate(`/market/${id}`)}
      />

      <SuggestedCreatorsSection
        creators={suggestedCreators}
        followedUserIds={followedUserIds}
        onToggleFollow={toggleFollowUser}
      />

      {/* Your decks */}
      <DeckCarousel
        decks={
          stats?.decks.map((d) => ({
            name: d.name,
            cardCount: d.cardCount,
            coverImageUrl: d.coverImageUrl,
            progress: d.progress,
            onClick: () => navigate(`/decks/${d.id}`),
          })) ?? []
        }
        onViewAll={() => navigate("/decks")}
      />
    </div>
  );
}
