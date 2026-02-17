import type { StorageAdapter } from "@flashcard/storage";
import type { CardProgressRepository } from "@flashcard/core/repositories";
import type { CardProgress, CreateCardProgressInput } from "@flashcard/core/entities";
import { createCardProgress } from "@flashcard/core/entities";

const COLLECTION = "card-progress";

export class CardProgressRepositoryImpl implements CardProgressRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async findById(id: string): Promise<CardProgress | null> {
    return this.storage.get<CardProgress>(COLLECTION, id);
  }

  async findByCardIdAndUserId(cardId: string, userId: string): Promise<CardProgress | null> {
    const results = await this.storage.query<CardProgress>(COLLECTION, {
      filters: [
        { field: "cardId", operator: "eq", value: cardId },
        { field: "userId", operator: "eq", value: userId },
        { field: "_tombstone", operator: "eq", value: false },
      ],
      limit: 1,
    });
    return results[0] ?? null;
  }

  async findByDeckIdAndUserId(deckId: string, userId: string): Promise<CardProgress[]> {
    return this.storage.query<CardProgress>(COLLECTION, {
      filters: [
        { field: "deckId", operator: "eq", value: deckId },
        { field: "userId", operator: "eq", value: userId },
        { field: "_tombstone", operator: "eq", value: false },
      ],
    });
  }

  async findDueCards(deckId: string, userId: string, limit?: number): Promise<CardProgress[]> {
    const now = new Date();
    const allProgress = await this.findByDeckIdAndUserId(deckId, userId);

    // Filter cards that are due (dueDate <= now)
    const dueCards = allProgress.filter((p) => new Date(p.dueDate) <= now);

    // Sort by due date (most overdue first)
    dueCards.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (limit !== undefined) {
      return dueCards.slice(0, limit);
    }

    return dueCards;
  }

  async create(input: CreateCardProgressInput): Promise<CardProgress> {
    const progress = createCardProgress(input);
    await this.storage.set(COLLECTION, progress.id, progress);
    return progress;
  }

  async update(id: string, data: Partial<CardProgress>): Promise<CardProgress> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`CardProgress not found: ${id}`);
    }

    const updated: CardProgress = {
      ...existing,
      ...data,
      id, // Ensure ID cannot be changed
    };

    await this.storage.set(COLLECTION, id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (existing) {
      // Soft delete
      await this.storage.set(COLLECTION, id, {
        ...existing,
        _tombstone: true,
        _version: existing._version + 1,
      });
    }
  }
}
