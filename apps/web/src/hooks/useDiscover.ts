import { useState, useEffect, useCallback, useRef } from "react";
import {
  socialApi,
  type FeedItem,
  type PopularDeck,
  type SuggestedCreator,
  type TrendingTag,
} from "@/lib/social-api";

interface DiscoverState {
  popularDecks: PopularDeck[];
  feedItems: FeedItem[];
  feedHasMore: boolean;
  recommendations: PopularDeck[];
  suggestedCreators: SuggestedCreator[];
  trendingTags: TrendingTag[];
  followedUserIds: Set<string>;
  followedTags: Set<string>;
  isLoading: boolean;
}

export function useDiscover() {
  const [state, setState] = useState<DiscoverState>({
    popularDecks: [],
    feedItems: [],
    feedHasMore: false,
    recommendations: [],
    suggestedCreators: [],
    trendingTags: [],
    followedUserIds: new Set(),
    followedTags: new Set(),
    isLoading: true,
  });

  const [feedFilter, setFeedFilter] = useState("all");
  const [isLoadingMoreFeed, setIsLoadingMoreFeed] = useState(false);
  const feedOffsetRef = useRef(0);

  // Initial data load
  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
        socialApi.getPopularDecks({ limit: 15 }),
        socialApi.getFeed({ limit: 10 }),
        socialApi.getRecommendations({ limit: 8 }),
        socialApi.getSuggestedCreators({ limit: 10 }),
        socialApi.getTrendingTags(),
        socialApi.getFollowing(),
      ]);

      const popularDecks =
        results[0].status === "fulfilled" ? results[0].value.decks : [];
      const feed =
        results[1].status === "fulfilled"
          ? results[1].value
          : { items: [], hasMore: false };
      const recommendations =
        results[2].status === "fulfilled" ? results[2].value.decks : [];
      const suggestedCreators =
        results[3].status === "fulfilled" ? results[3].value.creators : [];
      const trendingTags =
        results[4].status === "fulfilled" ? results[4].value.tags : [];
      const following =
        results[5].status === "fulfilled"
          ? results[5].value
          : { users: [], tags: [] };

      feedOffsetRef.current = feed.items.length;

      setState({
        popularDecks,
        feedItems: feed.items,
        feedHasMore: feed.hasMore,
        recommendations,
        suggestedCreators,
        trendingTags,
        followedUserIds: new Set(following.users.map((u) => u.id)),
        followedTags: new Set(following.tags.map((t) => t.tag)),
        isLoading: false,
      });
    }

    load();
  }, []);

  // Reload feed when filter changes
  useEffect(() => {
    if (state.isLoading) return;

    feedOffsetRef.current = 0;
    socialApi
      .getFeed({ filter: feedFilter, limit: 10, offset: 0 })
      .then((result) => {
        feedOffsetRef.current = result.items.length;
        setState((prev) => ({
          ...prev,
          feedItems: result.items,
          feedHasMore: result.hasMore,
        }));
      })
      .catch(() => {});
  }, [feedFilter, state.isLoading]);

  // Load more feed items
  const loadMoreFeed = useCallback(async () => {
    setIsLoadingMoreFeed(true);
    try {
      const result = await socialApi.getFeed({
        filter: feedFilter,
        limit: 10,
        offset: feedOffsetRef.current,
      });
      feedOffsetRef.current += result.items.length;
      setState((prev) => ({
        ...prev,
        feedItems: [...prev.feedItems, ...result.items],
        feedHasMore: result.hasMore,
      }));
    } catch {
      // Silently fail
    } finally {
      setIsLoadingMoreFeed(false);
    }
  }, [feedFilter]);

  // Toggle follow user (optimistic)
  const toggleFollowUser = useCallback(async (userId: string) => {
    setState((prev) => {
      const next = new Set(prev.followedUserIds);
      const isFollowing = next.has(userId);
      if (isFollowing) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      (isFollowing
        ? socialApi.unfollowUser(userId)
        : socialApi.followUser(userId)
      ).catch(() => {
        setState((revert) => {
          const reverted = new Set(revert.followedUserIds);
          if (isFollowing) reverted.add(userId);
          else reverted.delete(userId);
          return { ...revert, followedUserIds: reverted };
        });
      });

      return { ...prev, followedUserIds: next };
    });
  }, []);

  // Toggle follow tag (optimistic)
  const toggleFollowTag = useCallback(async (tag: string) => {
    const normalizedTag = tag.toLowerCase();

    setState((prev) => {
      const next = new Set(prev.followedTags);
      const isFollowing = next.has(normalizedTag);
      if (isFollowing) {
        next.delete(normalizedTag);
      } else {
        next.add(normalizedTag);
      }

      (isFollowing
        ? socialApi.unfollowTag(normalizedTag)
        : socialApi.followTag(normalizedTag)
      ).catch(() => {
        setState((revert) => {
          const reverted = new Set(revert.followedTags);
          if (isFollowing) reverted.add(normalizedTag);
          else reverted.delete(normalizedTag);
          return { ...revert, followedTags: reverted };
        });
      });

      return { ...prev, followedTags: next };
    });
  }, []);

  return {
    ...state,
    feedFilter,
    setFeedFilter,
    isLoadingMoreFeed,
    loadMoreFeed,
    toggleFollowUser,
    toggleFollowTag,
  };
}
