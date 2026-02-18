import { describe, test, expect } from "bun:test";
import { generateFlashcardsSchema } from "./ai";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("generateFlashcardsSchema", () => {
  test("accepts valid input with defaults", () => {
    const result = generateFlashcardsSchema.parse({
      deckId: UUID,
      prompt: "Generate Spanish vocabulary cards",
    });
    expect(result.deckId).toBe(UUID);
    expect(result.count).toBe(10);
  });

  test("accepts custom count", () => {
    const result = generateFlashcardsSchema.parse({
      deckId: UUID,
      prompt: "Math cards",
      count: 5,
    });
    expect(result.count).toBe(5);
  });

  test("rejects prompt shorter than 3 characters", () => {
    expect(() =>
      generateFlashcardsSchema.parse({ deckId: UUID, prompt: "ab" })
    ).toThrow("at least 3");
  });

  test("rejects prompt longer than 500 characters", () => {
    expect(() =>
      generateFlashcardsSchema.parse({
        deckId: UUID,
        prompt: "a".repeat(501),
      })
    ).toThrow("at most 500");
  });

  test("rejects count below 1", () => {
    expect(() =>
      generateFlashcardsSchema.parse({
        deckId: UUID,
        prompt: "Generate cards",
        count: 0,
      })
    ).toThrow();
  });

  test("rejects count above 20", () => {
    expect(() =>
      generateFlashcardsSchema.parse({
        deckId: UUID,
        prompt: "Generate cards",
        count: 21,
      })
    ).toThrow();
  });

  test("accepts count boundary values", () => {
    expect(() =>
      generateFlashcardsSchema.parse({
        deckId: UUID,
        prompt: "Generate cards",
        count: 1,
      })
    ).not.toThrow();
    expect(() =>
      generateFlashcardsSchema.parse({
        deckId: UUID,
        prompt: "Generate cards",
        count: 20,
      })
    ).not.toThrow();
  });

  test("trims prompt", () => {
    const result = generateFlashcardsSchema.parse({
      deckId: UUID,
      prompt: "  Generate cards  ",
    });
    expect(result.prompt).toBe("Generate cards");
  });

  test("rejects invalid deckId", () => {
    expect(() =>
      generateFlashcardsSchema.parse({
        deckId: "bad",
        prompt: "Generate cards",
      })
    ).toThrow();
  });
});
