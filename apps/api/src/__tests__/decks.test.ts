import { describe, test, expect, beforeEach } from "bun:test";
import {
  authRequest,
  cleanDatabase,
  createTestUser,
  createTestDeck,
} from "./setup";

describe("Deck Routes", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/decks", () => {
    test("creates a deck and returns 201", async () => {
      const { token } = await createTestUser();
      const res = await authRequest("/api/decks", token, {
        method: "POST",
        body: JSON.stringify({ name: "Spanish Vocab" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("Spanish Vocab");
      expect(body.visibility).toBe("private");
    });

    test("returns 400 for missing name", async () => {
      const { token } = await createTestUser();
      const res = await authRequest("/api/decks", token, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    test("enforces deck limit for free tier (5 decks)", async () => {
      const { user, token } = await createTestUser();

      // Create 5 decks
      for (let i = 0; i < 5; i++) {
        await createTestDeck(user.id, { name: `Deck ${i}` });
      }

      // 6th should fail
      const res = await authRequest("/api/decks", token, {
        method: "POST",
        body: JSON.stringify({ name: "Deck 6" }),
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("DECK_LIMIT_REACHED");
    });

    test("fluent tier can create unlimited decks", async () => {
      const { user, token } = await createTestUser({ tier: "fluent" });

      for (let i = 0; i < 6; i++) {
        await createTestDeck(user.id, { name: `Deck ${i}` });
      }

      const res = await authRequest("/api/decks", token, {
        method: "POST",
        body: JSON.stringify({ name: "Deck 7" }),
      });
      expect(res.status).toBe(201);
    });
  });

  describe("GET /api/decks", () => {
    test("returns user's decks", async () => {
      const { user, token } = await createTestUser();
      await createTestDeck(user.id, { name: "Deck A" });
      await createTestDeck(user.id, { name: "Deck B" });

      const res = await authRequest("/api/decks", token);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(2);
    });

    test("does not return other users' decks", async () => {
      const { user: user1 } = await createTestUser();
      const { token: token2 } = await createTestUser();
      await createTestDeck(user1.id, { name: "User1 Deck" });

      const res = await authRequest("/api/decks", token2);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(0);
    });
  });

  describe("GET /api/decks/:id", () => {
    test("returns own deck", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const res = await authRequest(`/api/decks/${deck.id}`, token);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(deck.id);
    });

    test("returns 404 for nonexistent deck", async () => {
      const { token } = await createTestUser();
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      const res = await authRequest(`/api/decks/${fakeId}`, token);
      expect(res.status).toBe(404);
    });

    test("returns 403 for private deck of another user", async () => {
      const { user: user1 } = await createTestUser();
      const { token: token2 } = await createTestUser();
      const deck = await createTestDeck(user1.id);

      const res = await authRequest(`/api/decks/${deck.id}`, token2);
      expect(res.status).toBe(403);
    });

    test("allows access to public deck of another user", async () => {
      const { user: user1 } = await createTestUser();
      const { token: token2 } = await createTestUser();
      const deck = await createTestDeck(user1.id, { visibility: "public" });

      const res = await authRequest(`/api/decks/${deck.id}`, token2);
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/decks/:id", () => {
    test("updates deck name", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const res = await authRequest(`/api/decks/${deck.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Name" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("Updated Name");
      expect(body.version).toBe(deck.version + 1);
    });

    test("returns 403 for another user's deck", async () => {
      const { user: user1 } = await createTestUser();
      const { token: token2 } = await createTestUser();
      const deck = await createTestDeck(user1.id);

      const res = await authRequest(`/api/decks/${deck.id}`, token2, {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacked" }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/decks/:id", () => {
    test("soft deletes a deck", async () => {
      const { user, token } = await createTestUser();
      const deck = await createTestDeck(user.id);

      const deleteRes = await authRequest(`/api/decks/${deck.id}`, token, {
        method: "DELETE",
      });
      expect(deleteRes.status).toBe(200);

      // Should not appear in list anymore
      const listRes = await authRequest("/api/decks", token);
      const body = await listRes.json();
      expect(body).toHaveLength(0);
    });

    test("returns 403 for another user's deck", async () => {
      const { user: user1 } = await createTestUser();
      const { token: token2 } = await createTestUser();
      const deck = await createTestDeck(user1.id);

      const res = await authRequest(`/api/decks/${deck.id}`, token2, {
        method: "DELETE",
      });
      expect(res.status).toBe(403);
    });
  });
});
