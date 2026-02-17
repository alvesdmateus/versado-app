import type { Flashcard, CreateFlashcardInput } from "../entities/flashcard";
import type { FlashcardRepository } from "../repositories/flashcard-repository";

export class FlashcardService {
  constructor(private readonly flashcardRepository: FlashcardRepository) {}

  async getFlashcard(id: string): Promise<Flashcard | null> {
    return this.flashcardRepository.findById(id);
  }

  async getFlashcardsByDeck(deckId: string): Promise<Flashcard[]> {
    return this.flashcardRepository.findByDeckId(deckId);
  }

  async createFlashcard(input: CreateFlashcardInput): Promise<Flashcard> {
    return this.flashcardRepository.create(input);
  }

  async updateFlashcard(id: string, data: Partial<Flashcard>): Promise<Flashcard> {
    return this.flashcardRepository.update(id, data);
  }

  async deleteFlashcard(id: string): Promise<void> {
    return this.flashcardRepository.delete(id);
  }
}
