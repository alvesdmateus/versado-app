import { apiClient } from "./api-client";

export interface DeckResponse {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  tags: string[];
  visibility: string;
  settings: {
    newCardsPerDay: number;
    reviewsPerDay: number;
    algorithm: string;
  };
  stats: {
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    masteredCards: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardResponse {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: string;
  source: { type: string };
  createdAt: string;
  updatedAt: string;
}

export const deckApi = {
  list() {
    return apiClient<DeckResponse[]>("/api/decks");
  },

  get(id: string) {
    return apiClient<DeckResponse>(`/api/decks/${id}`);
  },

  getCards(id: string) {
    return apiClient<FlashcardResponse[]>(`/api/decks/${id}/cards`);
  },

  create(data: {
    name: string;
    description?: string;
    tags?: string[];
    visibility?: string;
  }) {
    return apiClient<DeckResponse>("/api/decks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      tags: string[];
      visibility: string;
      coverImageUrl: string;
    }>
  ) {
    return apiClient<DeckResponse>(`/api/decks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return apiClient<{ success: boolean }>(`/api/decks/${id}`, {
      method: "DELETE",
    });
  },
};
