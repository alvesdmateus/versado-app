export type CardStatus = "new" | "learning" | "review" | "relearning" | "mastered";

export interface CardProgress {
  id: string;
  userId: string;
  cardId: string;
  deckId: string;
  // SM-2 algorithm fields
  easeFactor: number; // Default 2.5, min 1.3
  interval: number; // Days until next review
  repetitions: number; // Consecutive correct answers
  status: CardStatus;
  // Scheduling
  dueDate: Date;
  lastReviewedAt: Date | null;
  // Sync fields
  _version: number;
  _tombstone: boolean;
}

export interface CreateCardProgressInput {
  userId: string;
  cardId: string;
  deckId: string;
}

const DEFAULT_EASE_FACTOR = 2.5;

export function createCardProgress(input: CreateCardProgressInput): CardProgress {
  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    cardId: input.cardId,
    deckId: input.deckId,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    status: "new",
    dueDate: new Date(),
    lastReviewedAt: null,
    _version: 1,
    _tombstone: false,
  };
}
