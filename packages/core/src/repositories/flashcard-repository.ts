import type { Flashcard, CreateFlashcardInput } from "../entities/flashcard";

export interface FlashcardRepository {
  findById(id: string): Promise<Flashcard | null>;
  findByDeckId(deckId: string): Promise<Flashcard[]>;
  create(input: CreateFlashcardInput): Promise<Flashcard>;
  update(id: string, data: Partial<Flashcard>): Promise<Flashcard>;
  delete(id: string): Promise<void>;
}
