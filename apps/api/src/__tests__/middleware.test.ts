import { describe, test, expect, beforeEach } from "bun:test";
import { testRequest, authRequest, cleanDatabase, createTestUser } from "./setup";

describe("Middleware", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Auth middleware", () => {
    test("returns 401 for missing Authorization header", async () => {
      const res = await testRequest("/api/decks");
      expect(res.status).toBe(401);
    });

    test("returns 401 for malformed Authorization header", async () => {
      const res = await testRequest("/api/decks", {
        headers: { Authorization: "NotBearer token" },
      });
      expect(res.status).toBe(401);
    });

    test("returns 401 for invalid JWT", async () => {
      const res = await testRequest("/api/decks", {
        headers: { Authorization: "Bearer invalid.jwt.token" },
      });
      expect(res.status).toBe(401);
    });

    test("passes with valid JWT", async () => {
      const { token } = await createTestUser();
      const res = await authRequest("/api/decks", token);
      expect(res.status).toBe(200);
    });
  });

  describe("Rate limiter (API routes)", () => {
    test("allows requests within limit", async () => {
      const { token } = await createTestUser();
      const res = await authRequest("/api/decks", token);
      expect(res.status).toBe(200);
    });
  });

  describe("Error handler", () => {
    test("returns JSON error for AppError", async () => {
      const { token } = await createTestUser();
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      const res = await authRequest(`/api/decks/${fakeId}`, token);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(body.code).toBe("NOT_FOUND");
    });
  });

  describe("Health check", () => {
    test("GET /health returns ok", async () => {
      const res = await testRequest("/health");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
    });
  });
});
