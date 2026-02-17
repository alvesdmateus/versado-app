import { apiClient } from "./api-client";
import type { FlashcardResponse } from "./deck-api";

export const flashcardApi = {
  create(data: {
    deckId: string;
    front: string;
    back: string;
    tags?: string[];
    difficulty?: string;
  }) {
    return apiClient<FlashcardResponse>("/api/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  batchCreate(data: {
    deckId: string;
    cards: Array<{
      front: string;
      back: string;
      tags?: string[];
      difficulty?: string;
    }>;
  }) {
    return apiClient<FlashcardResponse[]>("/api/flashcards/batch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(
    id: string,
    data: Partial<{
      front: string;
      back: string;
      tags: string[];
      difficulty: string;
    }>
  ) {
    return apiClient<FlashcardResponse>(`/api/flashcards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return apiClient<{ success: boolean }>(`/api/flashcards/${id}`, {
      method: "DELETE",
    });
  },
};
