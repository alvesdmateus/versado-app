import { apiClient } from "./api-client";

export interface FeedItem {
  type: "deck_published";
  deck: {
    id: string;
    name: string;
    description: string;
    coverImageUrl: string | null;
    tags: string[];
    cardCount: number;
    marketplace: {
      price: number;
      rating: number;
      purchaseCount: number;
      reviewCount: number;
    } | null;
    updatedAt: string;
  };
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  matchReason: "followed_user" | "followed_tag";
  matchedTag?: string;
}

export interface PopularDeck {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  tags: string[];
  creator: { id: string; displayName: string };
  price: number;
  rating: number;
  purchaseCount: number;
}

export interface SuggestedCreator {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  marketplaceDeckCount: number;
  matchingTags: string[];
}

export interface FollowingResponse {
  users: Array<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
    followedAt: string;
  }>;
  tags: Array<{
    tag: string;
    followedAt: string;
  }>;
}

export interface SocialFeedResponse {
  items: FeedItem[];
  hasMore: boolean;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export const socialApi = {
  followUser(userId: string) {
    return apiClient<{ success: boolean }>(
      `/api/social/follow/user/${userId}`,
      { method: "POST" }
    );
  },

  unfollowUser(userId: string) {
    return apiClient<{ success: boolean }>(
      `/api/social/follow/user/${userId}`,
      { method: "DELETE" }
    );
  },

  followTag(tag: string) {
    return apiClient<{ success: boolean }>("/api/social/follow/tag", {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
  },

  unfollowTag(tag: string) {
    return apiClient<{ success: boolean }>(
      `/api/social/follow/tag/${encodeURIComponent(tag)}`,
      { method: "DELETE" }
    );
  },

  getFollowing() {
    return apiClient<FollowingResponse>("/api/social/following");
  },

  getFeed(params?: { filter?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.filter) query.set("filter", params.filter);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return apiClient<SocialFeedResponse>(
      `/api/social/feed${qs ? `?${qs}` : ""}`
    );
  },

  getPopularDecks(params?: { period?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient<{ decks: PopularDeck[] }>(
      `/api/social/popular${qs ? `?${qs}` : ""}`
    );
  },

  getRecommendations(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return apiClient<{ decks: PopularDeck[] }>(
      `/api/social/recommendations${qs ? `?${qs}` : ""}`
    );
  },

  getSuggestedCreators(params?: { limit?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient<{ creators: SuggestedCreator[] }>(
      `/api/social/suggested-creators${qs ? `?${qs}` : ""}`
    );
  },

  getTrendingTags() {
    return apiClient<{ tags: TrendingTag[] }>("/api/social/trending-tags");
  },
};
