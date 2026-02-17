import type { StorageAdapter } from "@flashcard/storage";
import type { FlashcardRepository } from "@flashcard/core/repositories";
import type { Flashcard, CreateFlashcardInput } from "@flashcard/core/entities";
import { createFlashcard } from "@flashcard/core/entities";

const COLLECTION = "flashcards";

export class FlashcardRepositoryImpl implements FlashcardRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async findById(id: string): Promise<Flashcard | null> {
    return this.storage.get<Flashcard>(COLLECTION, id);
  }

  async findByDeckId(deckId: string): Promise<Flashcard[]> {
    return this.storage.query<Flashcard>(COLLECTION, {
      filters: [
        { field: "deckId", operator: "eq", value: deckId },
        { field: "_tombstone", operator: "eq", value: false },
      ],
    });
  }

  async create(input: CreateFlashcardInput): Promise<Flashcard> {
    const flashcard = createFlashcard(input);
    await this.storage.set(COLLECTION, flashcard.id, flashcard);
    return flashcard;
  }

  async update(id: string, data: Partial<Flashcard>): Promise<Flashcard> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Flashcard not found: ${id}`);
    }

    const updated: Flashcard = {
      ...existing,
      ...data,
      id, // Ensure ID cannot be changed
      updatedAt: new Date(),
      _version: existing._version + 1,
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
