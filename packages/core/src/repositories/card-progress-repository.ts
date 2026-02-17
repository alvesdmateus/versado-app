import type { CardProgress, CreateCardProgressInput } from "../entities/card-progress";

export interface CardProgressRepository {
  findById(id: string): Promise<CardProgress | null>;
  findByCardIdAndUserId(cardId: string, userId: string): Promise<CardProgress | null>;
  findByDeckIdAndUserId(deckId: string, userId: string): Promise<CardProgress[]>;
  findDueCards(deckId: string, userId: string, limit?: number): Promise<CardProgress[]>;
  create(input: CreateCardProgressInput): Promise<CardProgress>;
  update(id: string, data: Partial<CardProgress>): Promise<CardProgress>;
  delete(id: string): Promise<void>;
}
