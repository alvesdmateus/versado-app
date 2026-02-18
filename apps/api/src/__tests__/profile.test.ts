import { describe, test, expect, beforeEach } from "bun:test";
import { authRequest, cleanDatabase, createTestUser } from "./setup";

describe("Profile Routes", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("PATCH /api/profile", () => {
    test("updates display name", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/profile", token, {
        method: "PATCH",
        body: JSON.stringify({ displayName: "New Name" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.displayName).toBe("New Name");
    });

    test("returns 400 for invalid display name", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/profile", token, {
        method: "PATCH",
        body: JSON.stringify({ displayName: "X" }), // too short
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/profile/change-password", () => {
    test("changes password successfully", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/profile/change-password", token, {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "Password1",
          newPassword: "NewPassword2",
          confirmPassword: "NewPassword2",
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test("returns 400 for wrong current password", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/profile/change-password", token, {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "WrongPass1",
          newPassword: "NewPassword2",
          confirmPassword: "NewPassword2",
        }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("INVALID_PASSWORD");
    });
  });

  describe("GET /api/profile/preferences", () => {
    test("returns default preferences", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/profile/preferences", token);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.darkMode).toBe(false);
      expect(body.dailyGoal).toBe(50);
      expect(body.favoriteDeckIds).toEqual([]);
    });
  });

  describe("PATCH /api/profile/preferences", () => {
    test("partially merges preferences", async () => {
      const { token } = await createTestUser();

      const res = await authRequest("/api/profile/preferences", token, {
        method: "PATCH",
        body: JSON.stringify({ darkMode: true, dailyGoal: 100 }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.darkMode).toBe(true);
      expect(body.dailyGoal).toBe(100);
      // Other defaults should be preserved
      expect(body.themeColor).toBe("sky");
      expect(body.favoriteDeckIds).toEqual([]);
    });

    test("updates favoriteDeckIds", async () => {
      const { token } = await createTestUser();
      const deckId = "550e8400-e29b-41d4-a716-446655440000";

      const res = await authRequest("/api/profile/preferences", token, {
        method: "PATCH",
        body: JSON.stringify({ favoriteDeckIds: [deckId] }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.favoriteDeckIds).toEqual([deckId]);
    });
  });
});
