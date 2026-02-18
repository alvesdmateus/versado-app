import { describe, test, expect } from "bun:test";
import { createFlashcard } from "./flashcard";

describe("createFlashcard", () => {
  const required = {
    deckId: "deck-123",
    front: "What is 2+2?",
    back: "4",
  };

  test("creates flashcard with required fields", () => {
    const card = createFlashcard(required);
    expect(card.deckId).toBe("deck-123");
    expect(card.front).toBe("What is 2+2?");
    expect(card.back).toBe("4");
  });

  test("generates UUID id", () => {
    const card = createFlashcard(required);
    expect(card.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  test("generates unique ids", () => {
    const c1 = createFlashcard(required);
    const c2 = createFlashcard(required);
    expect(c1.id).not.toBe(c2.id);
  });

  test("defaults tags to empty array", () => {
    const card = createFlashcard(required);
    expect(card.tags).toEqual([]);
  });

  test("accepts custom tags", () => {
    const card = createFlashcard({ ...required, tags: ["math"] });
    expect(card.tags).toEqual(["math"]);
  });

  test("defaults difficulty to medium", () => {
    const card = createFlashcard(required);
    expect(card.difficulty).toBe("medium");
  });

  test("accepts custom difficulty", () => {
    const card = createFlashcard({ ...required, difficulty: "hard" });
    expect(card.difficulty).toBe("hard");
  });

  test("defaults source to manual", () => {
    const card = createFlashcard(required);
    expect(card.source).toEqual({ type: "manual" });
  });

  test("accepts ai source", () => {
    const card = createFlashcard({
      ...required,
      source: { type: "ai", prompt: "math" },
    });
    expect(card.source).toEqual({ type: "ai", prompt: "math" });
  });

  test("accepts imported source", () => {
    const card = createFlashcard({
      ...required,
      source: { type: "imported", source: "anki" },
    });
    expect(card.source).toEqual({ type: "imported", source: "anki" });
  });

  test("initializes _version to 1", () => {
    const card = createFlashcard(required);
    expect(card._version).toBe(1);
  });

  test("initializes _tombstone to false", () => {
    const card = createFlashcard(required);
    expect(card._tombstone).toBe(false);
  });

  test("sets timestamps", () => {
    const before = new Date();
    const card = createFlashcard(required);
    const after = new Date();
    expect(card.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(card.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(card.createdAt.getTime()).toBe(card.updatedAt.getTime());
  });
});
