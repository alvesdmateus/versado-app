import { describe, test, expect } from "bun:test";
import {
  createFlashcardSchema,
  updateFlashcardSchema,
  batchCreateFlashcardsSchema,
} from "./flashcard";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createFlashcardSchema", () => {
  const valid = {
    deckId: UUID,
    front: "What is 2+2?",
    back: "4",
  };

  test("accepts valid input with defaults", () => {
    const result = createFlashcardSchema.parse(valid);
    expect(result.deckId).toBe(UUID);
    expect(result.front).toBe("What is 2+2?");
    expect(result.back).toBe("4");
    expect(result.tags).toEqual([]);
    expect(result.difficulty).toBe("medium");
    expect(result.source).toEqual({ type: "manual" });
  });

  test("accepts all difficulty levels", () => {
    for (const d of ["easy", "medium", "hard"]) {
      expect(() =>
        createFlashcardSchema.parse({ ...valid, difficulty: d })
      ).not.toThrow();
    }
  });

  test("accepts manual source", () => {
    const result = createFlashcardSchema.parse({
      ...valid,
      source: { type: "manual" },
    });
    expect(result.source.type).toBe("manual");
  });

  test("accepts ai source with optional prompt", () => {
    const result = createFlashcardSchema.parse({
      ...valid,
      source: { type: "ai", prompt: "Generate math cards" },
    });
    expect(result.source).toEqual({
      type: "ai",
      prompt: "Generate math cards",
    });
  });

  test("accepts imported source", () => {
    const result = createFlashcardSchema.parse({
      ...valid,
      source: { type: "imported", source: "anki-export.csv" },
    });
    expect(result.source).toEqual({
      type: "imported",
      source: "anki-export.csv",
    });
  });

  test("rejects empty front", () => {
    expect(() =>
      createFlashcardSchema.parse({ ...valid, front: "" })
    ).toThrow("required");
  });

  test("rejects empty back", () => {
    expect(() =>
      createFlashcardSchema.parse({ ...valid, back: "" })
    ).toThrow("required");
  });

  test("rejects front longer than 5000 characters", () => {
    expect(() =>
      createFlashcardSchema.parse({ ...valid, front: "a".repeat(5001) })
    ).toThrow("5000");
  });

  test("rejects back longer than 5000 characters", () => {
    expect(() =>
      createFlashcardSchema.parse({ ...valid, back: "a".repeat(5001) })
    ).toThrow("5000");
  });

  test("rejects invalid deckId", () => {
    expect(() =>
      createFlashcardSchema.parse({ ...valid, deckId: "bad-id" })
    ).toThrow();
  });

  test("trims front and back", () => {
    const result = createFlashcardSchema.parse({
      ...valid,
      front: "  question  ",
      back: "  answer  ",
    });
    expect(result.front).toBe("question");
    expect(result.back).toBe("answer");
  });

  test("rejects invalid difficulty", () => {
    expect(() =>
      createFlashcardSchema.parse({ ...valid, difficulty: "expert" })
    ).toThrow();
  });
});

describe("updateFlashcardSchema", () => {
  test("accepts empty object", () => {
    expect(() => updateFlashcardSchema.parse({})).not.toThrow();
  });

  test("accepts partial updates", () => {
    const result = updateFlashcardSchema.parse({ front: "Updated question" });
    expect(result.front).toBe("Updated question");
    expect(result.back).toBeUndefined();
  });

  test("rejects empty front when provided", () => {
    expect(() =>
      updateFlashcardSchema.parse({ front: "" })
    ).toThrow();
  });

  test("accepts tags update", () => {
    const result = updateFlashcardSchema.parse({ tags: ["new-tag"] });
    expect(result.tags).toEqual(["new-tag"]);
  });
});

describe("batchCreateFlashcardsSchema", () => {
  const validCard = { front: "Q", back: "A" };

  test("accepts valid batch", () => {
    const result = batchCreateFlashcardsSchema.parse({
      deckId: UUID,
      cards: [validCard, { front: "Q2", back: "A2", tags: ["tag1"] }],
    });
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0]!.difficulty).toBe("medium"); // default
  });

  test("rejects empty cards array", () => {
    expect(() =>
      batchCreateFlashcardsSchema.parse({ deckId: UUID, cards: [] })
    ).toThrow("At least one");
  });

  test("rejects more than 100 cards", () => {
    const cards = Array.from({ length: 101 }, () => validCard);
    expect(() =>
      batchCreateFlashcardsSchema.parse({ deckId: UUID, cards })
    ).toThrow("100");
  });

  test("accepts exactly 100 cards", () => {
    const cards = Array.from({ length: 100 }, () => validCard);
    expect(() =>
      batchCreateFlashcardsSchema.parse({ deckId: UUID, cards })
    ).not.toThrow();
  });

  test("rejects invalid card within batch", () => {
    expect(() =>
      batchCreateFlashcardsSchema.parse({
        deckId: UUID,
        cards: [{ front: "", back: "A" }],
      })
    ).toThrow();
  });

  test("rejects invalid deckId", () => {
    expect(() =>
      batchCreateFlashcardsSchema.parse({
        deckId: "bad",
        cards: [validCard],
      })
    ).toThrow();
  });
});
