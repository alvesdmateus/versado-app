import { describe, test, expect, beforeEach } from "bun:test";
import {
  authRequest,
  cleanDatabase,
  createTestUser,
  createTestDeck,
} from "./setup";

describe("Dashboard Routes", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /api/dashboard", () => {
    test("returns dashboard stats shape", async () => {
      const { user, token } = await createTestUser();
      await createTestDeck(user.id, { name: "My Deck" });

      const res = await authRequest("/api/dashboard", token);
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(typeof body.mastered).toBe("number");
      expect(typeof body.dueToday).toBe("number");
      expect(typeof body.accuracy).toBe("number");
      expect(typeof body.streakDays).toBe("number");
      expect(typeof body.streakActive).toBe("boolean");
      expect(Array.isArray(body.decks)).toBe(true);
      expect(body.decks).toHaveLength(1);
      expect(body.decks[0].name).toBe("My Deck");
    });

    test("returns empty stats for new user", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/dashboard", token);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.mastered).toBe(0);
      expect(body.dueToday).toBe(0);
      expect(body.accuracy).toBe(0);
      expect(body.streakDays).toBe(0);
      expect(body.decks).toHaveLength(0);
    });
  });
});
