import { apiClient } from "./api-client";
import type { FlashcardResponse } from "./deck-api";

export interface CardProgressResponse {
  id: string;
  userId: string;
  cardId: string;
  deckId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  status: string;
  dueDate: string;
  lastReviewedAt: string | null;
}

export interface DueCard {
  progress: CardProgressResponse;
  flashcard: FlashcardResponse;
}

export interface DeckStudyStats {
  total: number;
  new: number;
  learning: number;
  review: number;
  mastered: number;
  dueToday: number;
}

export interface ReviewResult {
  updatedProgress: CardProgressResponse;
  nextReviewDate: string;
}

export interface SessionResponse {
  id: string;
  userId: string | null;
  deckId: string;
  startedAt: string;
  endedAt: string | null;
  reviews: Array<{
    id: string;
    cardId: string;
    rating: 1 | 2 | 3 | 4;
    responseTimeMs: number;
    reviewedAt: string;
  }>;
  stats: {
    cardsStudied: number;
    correctCount: number;
    incorrectCount: number;
    averageTimeMs: number;
  };
}

export const studyApi = {
  getDueCards(deckId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : "";
    return apiClient<DueCard[]>(`/api/study/decks/${deckId}/due${query}`);
  },

  getDeckStats(deckId: string) {
    return apiClient<DeckStudyStats>(`/api/study/decks/${deckId}/stats`);
  },

  submitReview(
    progressId: string,
    rating: number,
    responseTimeMs?: number
  ) {
    return apiClient<ReviewResult>("/api/study/review", {
      method: "POST",
      body: JSON.stringify({ progressId, rating, responseTimeMs }),
    });
  },

  startSession(deckId: string) {
    return apiClient<SessionResponse>("/api/study/sessions", {
      method: "POST",
      body: JSON.stringify({ deckId }),
    });
  },

  endSession(sessionId: string) {
    return apiClient<SessionResponse>(
      `/api/study/sessions/${sessionId}/end`,
      { method: "PATCH" }
    );
  },

  initProgress(deckId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : "";
    return apiClient<CardProgressResponse[]>(
      `/api/study/decks/${deckId}/init-progress${query}`,
      { method: "POST" }
    );
  },
};
