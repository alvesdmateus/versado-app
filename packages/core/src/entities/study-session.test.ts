import { describe, test, expect } from "bun:test";
import {
  createStudySession,
  addReview,
  endSession,
} from "./study-session";

describe("createStudySession", () => {
  test("creates session with required fields", () => {
    const session = createStudySession({ deckId: "deck-1" });
    expect(session.deckId).toBe("deck-1");
  });

  test("generates UUID id", () => {
    const session = createStudySession({ deckId: "deck-1" });
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  test("defaults userId to null", () => {
    const session = createStudySession({ deckId: "deck-1" });
    expect(session.userId).toBeNull();
  });

  test("accepts custom userId", () => {
    const session = createStudySession({
      deckId: "deck-1",
      userId: "user-1",
    });
    expect(session.userId).toBe("user-1");
  });

  test("sets startedAt to current time", () => {
    const before = new Date();
    const session = createStudySession({ deckId: "deck-1" });
    const after = new Date();
    expect(session.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(session.startedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test("defaults endedAt to null", () => {
    const session = createStudySession({ deckId: "deck-1" });
    expect(session.endedAt).toBeNull();
  });

  test("initializes empty reviews", () => {
    const session = createStudySession({ deckId: "deck-1" });
    expect(session.reviews).toEqual([]);
  });

  test("initializes zero stats", () => {
    const session = createStudySession({ deckId: "deck-1" });
    expect(session.stats).toEqual({
      cardsStudied: 0,
      correctCount: 0,
      incorrectCount: 0,
      averageTimeMs: 0,
    });
  });
});

describe("addReview", () => {
  test("adds a review to the session", () => {
    const session = createStudySession({ deckId: "deck-1" });
    const updated = addReview(session, {
      cardId: "card-1",
      rating: 3,
      responseTimeMs: 5000,
    });
    expect(updated.reviews).toHaveLength(1);
    expect(updated.reviews[0].cardId).toBe("card-1");
    expect(updated.reviews[0].rating).toBe(3);
  });

  test("updates stats correctly", () => {
    let session = createStudySession({ deckId: "deck-1" });
    session = addReview(session, {
      cardId: "c1",
      rating: 4,
      responseTimeMs: 2000,
    });
    session = addReview(session, {
      cardId: "c2",
      rating: 1,
      responseTimeMs: 8000,
    });

    expect(session.stats.cardsStudied).toBe(2);
    expect(session.stats.correctCount).toBe(1); // rating >= 3
    expect(session.stats.incorrectCount).toBe(1);
    expect(session.stats.averageTimeMs).toBe(5000); // (2000+8000)/2
  });

  test("counts rating 3 as correct", () => {
    let session = createStudySession({ deckId: "deck-1" });
    session = addReview(session, {
      cardId: "c1",
      rating: 3,
      responseTimeMs: 0,
    });
    expect(session.stats.correctCount).toBe(1);
  });

  test("counts rating 2 as incorrect", () => {
    let session = createStudySession({ deckId: "deck-1" });
    session = addReview(session, {
      cardId: "c1",
      rating: 2,
      responseTimeMs: 0,
    });
    expect(session.stats.incorrectCount).toBe(1);
  });

  test("does not mutate original session", () => {
    const session = createStudySession({ deckId: "deck-1" });
    const updated = addReview(session, {
      cardId: "c1",
      rating: 3,
      responseTimeMs: 0,
    });
    expect(session.reviews).toHaveLength(0);
    expect(updated.reviews).toHaveLength(1);
  });

  test("generates UUID for review", () => {
    const session = createStudySession({ deckId: "deck-1" });
    const updated = addReview(session, {
      cardId: "c1",
      rating: 3,
      responseTimeMs: 0,
    });
    expect(updated.reviews[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

describe("endSession", () => {
  test("sets endedAt", () => {
    const session = createStudySession({ deckId: "deck-1" });
    const before = new Date();
    const ended = endSession(session);
    const after = new Date();
    expect(ended.endedAt).not.toBeNull();
    expect(ended.endedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ended.endedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test("does not mutate original session", () => {
    const session = createStudySession({ deckId: "deck-1" });
    endSession(session);
    expect(session.endedAt).toBeNull();
  });

  test("preserves reviews and stats", () => {
    let session = createStudySession({ deckId: "deck-1" });
    session = addReview(session, {
      cardId: "c1",
      rating: 4,
      responseTimeMs: 3000,
    });
    const ended = endSession(session);
    expect(ended.reviews).toHaveLength(1);
    expect(ended.stats.cardsStudied).toBe(1);
  });
});
