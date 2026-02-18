import { describe, test, expect } from "bun:test";
import {
  reviewRatingSchema,
  submitReviewSchema,
  startSessionSchema,
} from "./study";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("reviewRatingSchema", () => {
  test("accepts valid ratings 1-4", () => {
    for (const r of [1, 2, 3, 4] as const) {
      expect(reviewRatingSchema.parse(r)).toBe(r);
    }
  });

  test("rejects 0", () => {
    expect(() => reviewRatingSchema.parse(0)).toThrow();
  });

  test("rejects 5", () => {
    expect(() => reviewRatingSchema.parse(5)).toThrow();
  });

  test("rejects non-integer", () => {
    expect(() => reviewRatingSchema.parse(2.5)).toThrow();
  });

  test("rejects string", () => {
    expect(() => reviewRatingSchema.parse("3")).toThrow();
  });
});

describe("submitReviewSchema", () => {
  const valid = {
    progressId: UUID,
    rating: 3 as const,
  };

  test("accepts valid input with defaults", () => {
    const result = submitReviewSchema.parse(valid);
    expect(result.progressId).toBe(UUID);
    expect(result.rating).toBe(3);
    expect(result.responseTimeMs).toBe(0);
  });

  test("accepts responseTimeMs", () => {
    const result = submitReviewSchema.parse({
      ...valid,
      responseTimeMs: 5000,
    });
    expect(result.responseTimeMs).toBe(5000);
  });

  test("rejects negative responseTimeMs", () => {
    expect(() =>
      submitReviewSchema.parse({ ...valid, responseTimeMs: -1 })
    ).toThrow();
  });

  test("rejects responseTimeMs above 300000", () => {
    expect(() =>
      submitReviewSchema.parse({ ...valid, responseTimeMs: 300001 })
    ).toThrow();
  });

  test("accepts responseTimeMs at boundary", () => {
    expect(() =>
      submitReviewSchema.parse({ ...valid, responseTimeMs: 0 })
    ).not.toThrow();
    expect(() =>
      submitReviewSchema.parse({ ...valid, responseTimeMs: 300000 })
    ).not.toThrow();
  });

  test("rejects invalid progressId", () => {
    expect(() =>
      submitReviewSchema.parse({ ...valid, progressId: "bad" })
    ).toThrow();
  });
});

describe("startSessionSchema", () => {
  test("accepts valid input with defaults", () => {
    const result = startSessionSchema.parse({ deckId: UUID });
    expect(result.deckId).toBe(UUID);
    expect(result.cardsPerSession).toBe(20);
    expect(result.includeNew).toBe(true);
  });

  test("accepts custom values", () => {
    const result = startSessionSchema.parse({
      deckId: UUID,
      cardsPerSession: 50,
      includeNew: false,
    });
    expect(result.cardsPerSession).toBe(50);
    expect(result.includeNew).toBe(false);
  });

  test("rejects cardsPerSession below 1", () => {
    expect(() =>
      startSessionSchema.parse({ deckId: UUID, cardsPerSession: 0 })
    ).toThrow();
  });

  test("rejects cardsPerSession above 100", () => {
    expect(() =>
      startSessionSchema.parse({ deckId: UUID, cardsPerSession: 101 })
    ).toThrow();
  });

  test("rejects invalid deckId", () => {
    expect(() =>
      startSessionSchema.parse({ deckId: "not-uuid" })
    ).toThrow();
  });
});
