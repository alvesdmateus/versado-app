import { describe, test, expect } from "bun:test";
import { createCardProgress } from "./card-progress";

describe("createCardProgress", () => {
  const input = {
    userId: "user-1",
    cardId: "card-1",
    deckId: "deck-1",
  };

  test("creates card progress with required fields", () => {
    const progress = createCardProgress(input);
    expect(progress.userId).toBe("user-1");
    expect(progress.cardId).toBe("card-1");
    expect(progress.deckId).toBe("deck-1");
  });

  test("generates UUID id", () => {
    const progress = createCardProgress(input);
    expect(progress.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  test("defaults easeFactor to 2.5", () => {
    const progress = createCardProgress(input);
    expect(progress.easeFactor).toBe(2.5);
  });

  test("defaults interval to 0", () => {
    const progress = createCardProgress(input);
    expect(progress.interval).toBe(0);
  });

  test("defaults repetitions to 0", () => {
    const progress = createCardProgress(input);
    expect(progress.repetitions).toBe(0);
  });

  test("defaults status to new", () => {
    const progress = createCardProgress(input);
    expect(progress.status).toBe("new");
  });

  test("sets dueDate to current time", () => {
    const before = new Date();
    const progress = createCardProgress(input);
    const after = new Date();
    expect(progress.dueDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(progress.dueDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test("defaults lastReviewedAt to null", () => {
    const progress = createCardProgress(input);
    expect(progress.lastReviewedAt).toBeNull();
  });

  test("initializes _version to 1", () => {
    const progress = createCardProgress(input);
    expect(progress._version).toBe(1);
  });

  test("initializes _tombstone to false", () => {
    const progress = createCardProgress(input);
    expect(progress._tombstone).toBe(false);
  });
});
