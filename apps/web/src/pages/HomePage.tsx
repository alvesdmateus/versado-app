import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BarChart3, Clock, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { marketplaceApi } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
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
import { useTrack } from "@/hooks/useTrack";

export function HomePage() {
  const { t } = useTranslation(["home", "community"]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
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

  const { track } = useTrack();
  const isNicheTrack = track && track.id !== "custom";

  const handleAddDeck = useCallback(async (deckId: string) => {
    await marketplaceApi.addToLibrary(deckId);
    showToast(t("community:addedToLibrary"));
  }, [showToast, t]);

  const [history, setHistory] = useState<DashboardHistory | null>(null);

  useEffect(() => {
    dashboardApi.getHistory().then(setHistory).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <HomeSkeleton />;
  }

  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  const trackDecks = stats?.decks.filter((d) => {
    if (!isNicheTrack || !track.tagFilter.length) return true;
    const trackTags = new Set(track.tagFilter);
    return d.tags?.some((tag) => trackTags.has(tag));
  });

  const firstDeckWithCards = trackDecks?.find((d) => d.cardCount > 0);

  const totalTrackCards = trackDecks?.reduce((sum, d) => sum + d.cardCount, 0) ?? 0;
  const examReadiness =
    isNicheTrack && track.examMode.enabled && totalTrackCards > 0
      ? Math.round(((stats?.mastered ?? 0) / totalTrackCards) * 100)
      : null;

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
        examReadiness={examReadiness}
      />

      {/* Exam simulation CTA */}
      {isNicheTrack && track.examMode.enabled && (
        <button
          onClick={() => navigate("/exam")}
          className="mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-left text-white shadow-card transition-all active:scale-[0.98]"
        >
          <Shield className="h-8 w-8 shrink-0 opacity-80" />
          <div className="flex-1">
            <p className="font-semibold">{t("study:exam.simulate")}</p>
            <p className="mt-0.5 text-xs text-white/70">
              {track.examMode.questionCount} {t("home:cardsDue")} &middot; {track.examMode.timeLimitMinutes}min
            </p>
          </div>
        </button>
      )}

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

      {/* Social discovery — hidden on niche tracks */}
      {!isNicheTrack && (
        <>
          <TrendingTagsSection
            tags={trendingTags}
            followedTags={followedTags}
            onToggleTag={toggleFollowTag}
          />

          <PopularDeckCarousel
            decks={popularDecks}
            onDeckClick={(id) => navigate(`/community/${id}`)}
            onViewAll={() => navigate("/community")}
            onAddDeck={handleAddDeck}
          />

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

          <RecommendedDecksSection
            decks={recommendations}
            hasFollowedTags={followedTags.size > 0}
            onDeckClick={(id) => navigate(`/community/${id}`)}
            onAddDeck={handleAddDeck}
          />

          <SuggestedCreatorsSection
            creators={suggestedCreators}
            followedUserIds={followedUserIds}
            onToggleFollow={toggleFollowUser}
          />
        </>
      )}

      {/* Your decks */}
      <DeckCarousel
        decks={
          trackDecks?.map((d) => ({
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
