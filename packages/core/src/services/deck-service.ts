import type { Deck, CreateDeckInput } from "../entities/deck";
import type { DeckRepository } from "../repositories/deck-repository";

export class DeckService {
  constructor(private readonly deckRepository: DeckRepository) {}

  async getDeck(id: string): Promise<Deck | null> {
    return this.deckRepository.findById(id);
  }

  async getAllDecks(): Promise<Deck[]> {
    return this.deckRepository.findAll();
  }

  async createDeck(input: CreateDeckInput): Promise<Deck> {
    return this.deckRepository.create(input);
  }

  async updateDeck(id: string, data: Partial<Deck>): Promise<Deck> {
    return this.deckRepository.update(id, data);
  }

  async deleteDeck(id: string): Promise<void> {
    return this.deckRepository.delete(id);
  }
}
