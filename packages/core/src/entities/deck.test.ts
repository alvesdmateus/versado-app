import { describe, test, expect } from "bun:test";
import { createDeck } from "./deck";

describe("createDeck", () => {
  test("creates deck with required fields", () => {
    const deck = createDeck({ name: "Spanish Vocab" });
    expect(deck.name).toBe("Spanish Vocab");
  });

  test("generates UUID id", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  test("defaults ownerId to null", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.ownerId).toBeNull();
  });

  test("accepts custom ownerId", () => {
    const deck = createDeck({ name: "Test", ownerId: "user-123" });
    expect(deck.ownerId).toBe("user-123");
  });

  test("defaults description to empty string", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.description).toBe("");
  });

  test("accepts custom description", () => {
    const deck = createDeck({ name: "Test", description: "My deck" });
    expect(deck.description).toBe("My deck");
  });

  test("defaults coverImageUrl to null", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.coverImageUrl).toBeNull();
  });

  test("defaults tags to empty array", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.tags).toEqual([]);
  });

  test("accepts custom tags", () => {
    const deck = createDeck({ name: "Test", tags: ["math", "algebra"] });
    expect(deck.tags).toEqual(["math", "algebra"]);
  });

  test("defaults visibility to private", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.visibility).toBe("private");
  });

  test("accepts custom visibility", () => {
    const deck = createDeck({ name: "Test", visibility: "public" });
    expect(deck.visibility).toBe("public");
  });

  test("applies default settings", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.settings).toEqual({
      newCardsPerDay: 20,
      reviewsPerDay: 100,
      algorithm: "sm2",
    });
  });

  test("merges partial settings with defaults", () => {
    const deck = createDeck({
      name: "Test",
      settings: { newCardsPerDay: 30 },
    });
    expect(deck.settings.newCardsPerDay).toBe(30);
    expect(deck.settings.reviewsPerDay).toBe(100);
    expect(deck.settings.algorithm).toBe("sm2");
  });

  test("initializes stats to zero", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.stats).toEqual({
      totalCards: 0,
      newCards: 0,
      learningCards: 0,
      reviewCards: 0,
      masteredCards: 0,
    });
  });

  test("defaults marketplace to null", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck.marketplace).toBeNull();
  });

  test("initializes _version to 1", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck._version).toBe(1);
  });

  test("initializes _tombstone to false", () => {
    const deck = createDeck({ name: "Test" });
    expect(deck._tombstone).toBe(false);
  });

  test("sets createdAt and updatedAt", () => {
    const before = new Date();
    const deck = createDeck({ name: "Test" });
    const after = new Date();
    expect(deck.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(deck.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(deck.createdAt.getTime()).toBe(deck.updatedAt.getTime());
  });
});
