import { describe, test, expect, beforeEach } from "bun:test";
import {
  authRequest,
  cleanDatabase,
  createTestUser,
  createTestDeck,
  createTestFlashcard,
} from "./setup";
import { db } from "../db";
import { cardProgress } from "../db/schema";

describe("Study Routes", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/study/sessions", () => {
    test("starts a study session", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const res = await authRequest("/api/study/sessions", token, {
        method: "POST",
        body: JSON.stringify({ deckId: deck.id }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.deckId).toBe(deck.id);
      expect(body.userId).toBe(user.id);
      expect(body.endedAt).toBeNull();
    });

    test("returns 404 for nonexistent deck", async () => {
      const { token } = await createTestUser();
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      const res = await authRequest("/api/study/sessions", token, {
        method: "POST",
        body: JSON.stringify({ deckId: fakeId }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/study/decks/:deckId/due", () => {
    test("returns due cards", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      const card = await createTestFlashcard(deck.id);

      // Create card progress with past due date
      await db.insert(cardProgress).values({
        userId: user.id,
        cardId: card.id,
        deckId: deck.id,
        dueDate: new Date(Date.now() - 60000), // 1 min ago
      });

      const res = await authRequest(
        `/api/study/decks/${deck.id}/due`,
        token
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].flashcard.id).toBe(card.id);
    });

    test("does not return cards not yet due", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      const card = await createTestFlashcard(deck.id);

      await db.insert(cardProgress).values({
        userId: user.id,
        cardId: card.id,
        deckId: deck.id,
        dueDate: new Date(Date.now() + 86400000), // tomorrow
      });

      const res = await authRequest(
        `/api/study/decks/${deck.id}/due`,
        token
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(0);
    });
  });

  describe("POST /api/study/review", () => {
    test("submits a review and updates SM-2 state", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      const card = await createTestFlashcard(deck.id);

      const [progress] = await db
        .insert(cardProgress)
        .values({
          userId: user.id,
          cardId: card.id,
          deckId: deck.id,
        })
        .returning();

      const res = await authRequest("/api/study/review", token, {
        method: "POST",
        body: JSON.stringify({
          progressId: progress!.id,
          rating: 3,
          responseTimeMs: 3000,
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updatedProgress).toBeDefined();
      expect(body.nextReviewDate).toBeDefined();
    });

    test("returns 404 for nonexistent progress", async () => {
      const { token } = await createTestUser();
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      const res = await authRequest("/api/study/review", token, {
        method: "POST",
        body: JSON.stringify({
          progressId: fakeId,
          rating: 3,
        }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/study/decks/:deckId/init-progress", () => {
    test("initializes progress for new cards", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      await createTestFlashcard(deck.id, { front: "Q1", back: "A1" });
      await createTestFlashcard(deck.id, { front: "Q2", back: "A2" });

      const res = await authRequest(
        `/api/study/decks/${deck.id}/init-progress`,
        token,
        { method: "POST" }
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toHaveLength(2);
    });

    test("does not create duplicate progress", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      await createTestFlashcard(deck.id);

      // Init first time
      await authRequest(
        `/api/study/decks/${deck.id}/init-progress`,
        token,
        { method: "POST" }
      );

      // Init second time
      const res = await authRequest(
        `/api/study/decks/${deck.id}/init-progress`,
        token,
        { method: "POST" }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(0);
    });
  });
});
