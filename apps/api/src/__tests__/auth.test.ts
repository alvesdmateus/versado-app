import { describe, test, expect, beforeEach } from "bun:test";
import { testRequest, cleanDatabase } from "./setup";

describe("Auth Routes", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const validUser = {
    email: "test@example.com",
    password: "Password1",
    displayName: "Test User",
  };

  describe("POST /auth/register", () => {
    test("registers a new user and returns 201", async () => {
      const res = await testRequest("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `reg-${Math.random()}`,
        },
        body: JSON.stringify(validUser),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe("test@example.com");
      expect(body.user.displayName).toBe("Test User");
      expect(body.user.tier).toBe("free");
    });

    test("returns 409 for duplicate email", async () => {
      const ip = `dup-${Math.random()}`;
      await testRequest("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify(validUser),
      });

      const res = await testRequest("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `dup2-${Math.random()}`,
        },
        body: JSON.stringify(validUser),
      });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe("EMAIL_EXISTS");
    });

    test("returns 400 for invalid input", async () => {
      const res = await testRequest("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `val-${Math.random()}`,
        },
        body: JSON.stringify({ email: "bad", password: "x", displayName: "" }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /auth/login", () => {
    test("logs in with valid credentials", async () => {
      // First register
      await testRequest("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `login-${Math.random()}`,
        },
        body: JSON.stringify(validUser),
      });

      const res = await testRequest("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `login2-${Math.random()}`,
        },
        body: JSON.stringify({
          email: validUser.email,
          password: validUser.password,
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe("test@example.com");
    });

    test("returns 401 for wrong password", async () => {
      await testRequest("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `wp-${Math.random()}`,
        },
        body: JSON.stringify(validUser),
      });

      const res = await testRequest("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `wp2-${Math.random()}`,
        },
        body: JSON.stringify({
          email: validUser.email,
          password: "WrongPass1",
        }),
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe("INVALID_CREDENTIALS");
    });

    test("returns 401 for nonexistent email", async () => {
      const res = await testRequest("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `ne-${Math.random()}`,
        },
        body: JSON.stringify({
          email: "nobody@example.com",
          password: "Password1",
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /auth/me", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest("/auth/me", {
        headers: { "x-forwarded-for": `me-notoken-${Math.random()}` },
      });
      expect(res.status).toBe(401);
    });

    test("returns 401 with malformed token", async () => {
      const res = await testRequest("/auth/me", {
        headers: {
          Authorization: "Bearer invalid-token",
          "x-forwarded-for": `me-bad-${Math.random()}`,
        },
      });
      expect(res.status).toBe(401);
    });

    test("returns user profile with valid token", async () => {
      const ip = `me-${Math.random()}`;
      const regRes = await testRequest("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify(validUser),
      });
      const { accessToken } = await regRes.json();

      const res = await testRequest("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-forwarded-for": `me2-${Math.random()}`,
        },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.email).toBe("test@example.com");
    });
  });

  describe("Rate limiting on auth routes", () => {
    test("returns 429 after exceeding 5 requests per minute", async () => {
      const ip = `rl-${crypto.randomUUID()}`;
      const headers = { "Content-Type": "application/json", "x-forwarded-for": ip };

      // Send 5 requests (should all succeed or fail with non-429)
      for (let i = 0; i < 5; i++) {
        await testRequest("/auth/login", {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: `user${i}@example.com`,
            password: "pass",
          }),
        });
      }

      // 6th request should be rate limited
      const res = await testRequest("/auth/login", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: "extra@example.com",
          password: "pass",
        }),
      });
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeDefined();
    });
  });
});
