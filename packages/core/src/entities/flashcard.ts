export type Difficulty = "easy" | "medium" | "hard";

export type CardSource =
  | { type: "manual" }
  | { type: "ai"; prompt?: string }
  | { type: "imported"; source: string };

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: Difficulty;
  source: CardSource;
  createdAt: Date;
  updatedAt: Date;
  // Sync fields
  _version: number;
  _tombstone: boolean;
}

export interface CreateFlashcardInput {
  deckId: string;
  front: string;
  back: string;
  tags?: string[];
  difficulty?: Difficulty;
  source?: CardSource;
}

export function createFlashcard(input: CreateFlashcardInput): Flashcard {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    deckId: input.deckId,
    front: input.front,
    back: input.back,
    tags: input.tags ?? [],
    difficulty: input.difficulty ?? "medium",
    source: input.source ?? { type: "manual" },
    createdAt: now,
    updatedAt: now,
    _version: 1,
    _tombstone: false,
  };
}
