import type { SyncEngine, SyncStorage } from "@versado/sync";
import { deckApi, type DeckResponse, type FlashcardResponse } from "./deck-api";
import { studyApi, type DueCard, type ReviewResult, type SessionResponse } from "./study-api";
import { flashcardApi } from "./flashcard-api";
import { dashboardApi, type DashboardStats } from "./dashboard-api";

// Module-level references, set by SyncContext on init
let syncEngine: SyncEngine | null = null;
let syncStorage: SyncStorage | null = null;

export function setSyncInstances(
  engine: SyncEngine | null,
  storage: SyncStorage | null
): void {
  syncEngine = engine;
  syncStorage = storage;
}

export const syncAwareApi = {
  // --- Decks (reads) ---

  async listDecks(): Promise<DeckResponse[]> {
    try {
      const decks = await deckApi.list();
      if (syncStorage) {
        await syncStorage.cacheDecks(
          decks as unknown as Record<string, unknown>[]
        );
      }
      return decks;
    } catch (error) {
      if (!navigator.onLine && syncStorage) {
        const cached = await syncStorage.getCachedDecks();
        return cached as unknown as DeckResponse[];
      }
      throw error;
    }
  },

  async getDeck(id: string): Promise<DeckResponse> {
    try {
      const deck = await deckApi.get(id);
      if (syncStorage) {
        await syncStorage.cacheDecks([
          deck as unknown as Record<string, unknown>,
        ]);
      }
      return deck;
    } catch (error) {
      if (!navigator.onLine && syncStorage) {
        const allDecks = await syncStorage.getCachedDecks();
        const found = allDecks.find((d) => d.id === id);
        if (found) return found as unknown as DeckResponse;
      }
      throw error;
    }
  },

  async getCards(deckId: string): Promise<FlashcardResponse[]> {
    try {
      const cards = await deckApi.getCards(deckId);
      if (syncStorage) {
        await syncStorage.cacheCards(
          cards as unknown as Record<string, unknown>[]
        );
      }
      return cards;
    } catch (error) {
      if (!navigator.onLine && syncStorage) {
        const cached = await syncStorage.getCachedCards(deckId);
        return cached as unknown as FlashcardResponse[];
      }
      throw error;
    }
  },

  // --- Decks (writes) ---

  async createDeck(data: {
    name: string;
    description?: string;
    tags?: string[];
    visibility?: string;
  }): Promise<DeckResponse> {
    try {
      return await deckApi.create(data);
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        const id = crypto.randomUUID();
        await syncEngine.queueChange("decks", id, "create", data);
        // Return a synthetic response so the UI can show it optimistically
        return {
          id,
          name: data.name,
          description: data.description ?? "",
          coverImageUrl: null,
          tags: data.tags ?? [],
          visibility: data.visibility ?? "private",
          settings: { newCardsPerDay: 20, reviewsPerDay: 100, algorithm: "sm2" },
          stats: { totalCards: 0, newCards: 0, learningCards: 0, reviewCards: 0, masteredCards: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  async updateDeck(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      tags: string[];
      visibility: string;
      coverImageUrl: string;
    }>
  ): Promise<DeckResponse> {
    try {
      const deck = await deckApi.update(id, data);
      if (syncStorage) {
        await syncStorage.cacheDecks([deck as unknown as Record<string, unknown>]);
      }
      return deck;
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        await syncEngine.queueChange("decks", id, "update", data);
        // Return a synthetic response from cache
        const allDecks = await syncStorage?.getCachedDecks();
        const existing = allDecks?.find((d) => d.id === id);
        if (existing) {
          return { ...existing, ...data, updatedAt: new Date().toISOString() } as unknown as DeckResponse;
        }
      }
      throw error;
    }
  },

  async deleteDeck(id: string): Promise<void> {
    try {
      await deckApi.delete(id);
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        await syncEngine.queueChange("decks", id, "delete", {});
        return;
      }
      throw error;
    }
  },

  // --- Flashcards (writes) ---

  async createCards(data: {
    deckId: string;
    cards: Array<{ front: string; back: string; tags?: string[]; difficulty?: string }>;
  }): Promise<FlashcardResponse[]> {
    try {
      return await flashcardApi.batchCreate(data);
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        const results: FlashcardResponse[] = [];
        for (const card of data.cards) {
          const id = crypto.randomUUID();
          await syncEngine.queueChange("flashcards", id, "create", {
            deckId: data.deckId,
            ...card,
          });
          results.push({
            id,
            deckId: data.deckId,
            front: card.front,
            back: card.back,
            tags: card.tags ?? [],
            difficulty: card.difficulty ?? "normal",
            source: { type: "manual" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        return results;
      }
      throw error;
    }
  },

  async updateCard(
    id: string,
    data: Partial<{
      front: string;
      back: string;
      tags: string[];
      difficulty: string;
    }>
  ): Promise<FlashcardResponse> {
    try {
      const card = await flashcardApi.update(id, data);
      if (syncStorage) {
        await syncStorage.cacheCards([card as unknown as Record<string, unknown>]);
      }
      return card;
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        await syncEngine.queueChange("flashcards", id, "update", data);
      }
      throw error;
    }
  },

  async deleteCard(id: string): Promise<void> {
    try {
      await flashcardApi.delete(id);
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        await syncEngine.queueChange("flashcards", id, "delete", {});
        return;
      }
      throw error;
    }
  },

  // --- Study ---

  async startSession(deckId: string): Promise<SessionResponse | null> {
    try {
      return await studyApi.startSession(deckId);
    } catch {
      // Non-critical — return null if offline or fails
      return null;
    }
  },

  async endSession(sessionId: string): Promise<void> {
    try {
      await studyApi.endSession(sessionId);
    } catch {
      // Fire-and-forget — best effort
    }
  },

  // --- Dashboard ---

  async getStats(): Promise<DashboardStats> {
    const CACHE_KEY = "versado:dashboard-stats";
    try {
      const stats = await dashboardApi.getStats();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
      } catch {
        // localStorage full — ignore
      }
      return stats;
    } catch (error) {
      if (!navigator.onLine) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached) as DashboardStats;
      }
      throw error;
    }
  },

  async getDueCards(deckId: string, limit?: number): Promise<DueCard[]> {
    try {
      const cards = await studyApi.getDueCards(deckId, limit);
      return cards;
    } catch (error) {
      if (!navigator.onLine && syncStorage) {
        // Get cached card progress for this deck with due dates <= now
        const progress = await syncStorage.getCachedCardProgress(deckId);
        const now = new Date().toISOString();
        const due = progress.filter(
          (p) => (p.dueDate as string) <= now && p.status !== "mastered"
        );

        // Get corresponding flashcards
        const flashcards = await syncStorage.getCachedCards(deckId);
        const cardMap = new Map(flashcards.map((f) => [f.id as string, f]));

        const result: DueCard[] = [];
        for (const p of due) {
          const flashcard = cardMap.get(p.cardId as string);
          if (flashcard) {
            result.push({
              progress: p as unknown as DueCard["progress"],
              flashcard: flashcard as unknown as DueCard["flashcard"],
            });
          }
        }

        return limit ? result.slice(0, limit) : result;
      }
      throw error;
    }
  },

  async submitReview(
    progressId: string,
    rating: number,
    responseTimeMs?: number
  ): Promise<ReviewResult> {
    try {
      const result = await studyApi.submitReview(progressId, rating, responseTimeMs);
      // Cache updated progress
      if (syncStorage) {
        await syncStorage.cacheCardProgress([
          result.updatedProgress as unknown as Record<string, unknown>,
        ]);
      }
      return result;
    } catch (error) {
      if (!navigator.onLine && syncEngine) {
        await syncEngine.queueChange("card-progress", progressId, "update", {
          rating,
          responseTimeMs,
        });
      }
      throw error;
    }
  },
};
