import { apiClient } from "./api-client";

export interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  tags: string[];
  creator: { id: string; displayName: string };
  price: number;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  createdAt: string;
}

export interface MarketplaceResponse {
  listings: MarketplaceListing[];
  total: number;
}

export interface MarketplaceReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
}

export interface MarketplaceDetail {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  tags: string[];
  cardCount: number;
  price: number;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  createdAt: string;
  creator: { id: string; displayName: string; avatarUrl: string | null };
  sampleCards: Array<{ id: string; front: string; back: string }>;
  reviews: MarketplaceReview[];
  isOwner: boolean;
  isPurchased: boolean;
}

export const marketplaceApi = {
  browse(params?: {
    search?: string;
    tag?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
    minRating?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.tag) query.set("tag", params.tag);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.minRating) query.set("minRating", String(params.minRating));

    const qs = query.toString();
    return apiClient<MarketplaceResponse>(
      `/api/marketplace${qs ? `?${qs}` : ""}`
    );
  },

  getDetail(deckId: string) {
    return apiClient<MarketplaceDetail>(`/api/marketplace/${deckId}`);
  },

  addToLibrary(deckId: string) {
    return apiClient<{ clonedDeckId: string }>(
      `/api/marketplace/${deckId}/add-to-library`,
      { method: "POST" }
    );
  },

  listDeck(deckId: string, price: number) {
    return apiClient<{ success: boolean }>(`/api/marketplace/${deckId}/list`, {
      method: "PATCH",
      body: JSON.stringify({ price }),
    });
  },

  unlistDeck(deckId: string) {
    return apiClient<{ success: boolean }>(`/api/marketplace/${deckId}/list`, {
      method: "DELETE",
    });
  },

  submitReview(deckId: string, data: { rating: number; comment?: string }) {
    return apiClient<MarketplaceReview>(
      `/api/marketplace/${deckId}/reviews`,
      { method: "POST", body: JSON.stringify(data) }
    );
  },

  deleteReview(deckId: string) {
    return apiClient<{ success: boolean }>(
      `/api/marketplace/${deckId}/reviews`,
      { method: "DELETE" }
    );
  },
};
