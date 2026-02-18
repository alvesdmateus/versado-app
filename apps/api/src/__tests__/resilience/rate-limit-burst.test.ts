import { describe, test, expect, beforeEach } from "bun:test";
import { cleanDatabase, createTestUser } from "../setup";
import { createApp } from "../../app";

describe("Rate Limit Burst Resilience", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  test("auth endpoint rate limit: 5 requests per minute per IP", async () => {
    const app = createApp();
    const ip = `burst-${crypto.randomUUID()}`;

    // Send 10 rapid requests from same IP
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        app.request("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "pass",
          }),
        })
      )
    );

    const statuses = results.map((r) => r.status);
    const successCount = statuses.filter((s) => s !== 429).length;
    const rateLimitedCount = statuses.filter((s) => s === 429).length;

    // Exactly 5 should get through, rest should be 429
    expect(successCount).toBe(5);
    expect(rateLimitedCount).toBe(5);

    // Rate limited responses should have Retry-After header
    for (const res of results) {
      if (res.status === 429) {
        expect(res.headers.get("Retry-After")).toBeDefined();
      }
    }
  });

  test("API rate limit: 100 requests per minute per IP", async () => {
    const { token } = await createTestUser();
    const app = createApp();
    const ip = `api-burst-${crypto.randomUUID()}`;

    // Send 105 rapid requests
    const results = await Promise.all(
      Array.from({ length: 105 }, () =>
        app.request("/api/decks", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-forwarded-for": ip,
          },
        })
      )
    );

    const statuses = results.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 200).length;
    const rateLimitedCount = statuses.filter((s) => s === 429).length;

    // 100 should get through, 5 should be rate limited
    expect(successCount).toBe(100);
    expect(rateLimitedCount).toBe(5);
  });
});
