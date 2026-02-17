import type { Deck, CreateDeckInput } from "../entities/deck";

export interface DeckRepository {
  findById(id: string): Promise<Deck | null>;
  findAll(): Promise<Deck[]>;
  create(input: CreateDeckInput): Promise<Deck>;
  update(id: string, data: Partial<Deck>): Promise<Deck>;
  delete(id: string): Promise<void>;
}
