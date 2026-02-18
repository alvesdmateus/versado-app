import { describe, test, expect, beforeEach } from "bun:test";
import {
  authRequest,
  cleanDatabase,
  createTestUser,
  createTestDeck,
  createTestFlashcard,
} from "./setup";
import { db } from "../db";
import { decks } from "../db/schema";
import { eq } from "drizzle-orm";

describe("Flashcard Routes", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/flashcards", () => {
    test("creates a flashcard and returns 201", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const res = await authRequest("/api/flashcards", token, {
        method: "POST",
        body: JSON.stringify({
          deckId: deck.id,
          front: "What is 2+2?",
          back: "4",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.front).toBe("What is 2+2?");
      expect(body.deckId).toBe(deck.id);
    });

    test("returns 403 for another user's deck", async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const deck = await createTestDeck(owner.id);

      const res = await authRequest("/api/flashcards", otherToken, {
        method: "POST",
        body: JSON.stringify({
          deckId: deck.id,
          front: "Q",
          back: "A",
        }),
      });
      expect(res.status).toBe(403);
    });

    test("enforces card limit for free tier (100 cards)", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      // Simulate 100 existing cards by updating stats
      await db
        .update(decks)
        .set({
          stats: {
            totalCards: 100,
            newCards: 100,
            learningCards: 0,
            reviewCards: 0,
            masteredCards: 0,
          },
        })
        .where(eq(decks.id, deck.id));

      const res = await authRequest("/api/flashcards", token, {
        method: "POST",
        body: JSON.stringify({
          deckId: deck.id,
          front: "Q",
          back: "A",
        }),
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("CARD_LIMIT_REACHED");
    });
  });

  describe("POST /api/flashcards/batch", () => {
    test("batch creates flashcards", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const res = await authRequest("/api/flashcards/batch", token, {
        method: "POST",
        body: JSON.stringify({
          deckId: deck.id,
          cards: [
            { front: "Q1", back: "A1" },
            { front: "Q2", back: "A2" },
          ],
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toHaveLength(2);
    });

    test("returns 400 for empty cards array", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const res = await authRequest("/api/flashcards/batch", token, {
        method: "POST",
        body: JSON.stringify({ deckId: deck.id, cards: [] }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/flashcards/:id", () => {
    test("updates a flashcard", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      const card = await createTestFlashcard(deck.id);

      const res = await authRequest(`/api/flashcards/${card.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ front: "Updated question" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.front).toBe("Updated question");
      expect(body.version).toBe(card.version + 1);
    });

    test("returns 404 for nonexistent card", async () => {
      const { token } = await createTestUser();
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      const res = await authRequest(`/api/flashcards/${fakeId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ front: "Q" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/flashcards/:id", () => {
    test("soft deletes a flashcard", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);
      const card = await createTestFlashcard(deck.id);

      const res = await authRequest(`/api/flashcards/${card.id}`, token, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
    });

    test("returns 403 for another user's card", async () => {
      const { user: owner } = await createTestUser();
      const { token: otherToken } = await createTestUser();
      const deck = await createTestDeck(owner.id);
      const card = await createTestFlashcard(deck.id);

      const res = await authRequest(`/api/flashcards/${card.id}`, otherToken, {
        method: "DELETE",
      });
      expect(res.status).toBe(403);
    });
  });
});
