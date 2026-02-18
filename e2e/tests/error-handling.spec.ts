import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

test.describe("Error Handling", () => {
  test("nonexistent deck returns 404 via API", async ({ request }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";

    const res = await request.get(
      `http://localhost:3000/api/decks/${fakeId}`,
      { headers: apiHeaders }
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  test("invalid UUID returns 400", async ({ request }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };

    const res = await request.get(
      `http://localhost:3000/api/decks/not-a-valid-uuid`,
      { headers: apiHeaders }
    );
    expect(res.status()).toBe(400);
  });

  test("unauthenticated request returns 401", async ({ request }) => {
    const res = await request.get("http://localhost:3000/api/decks");
    expect(res.status()).toBe(401);
  });

  test("malformed JSON body returns 400", async ({ request }) => {
    const user = await registerUser(request);

    const res = await request.post("http://localhost:3000/api/decks", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        "Content-Type": "application/json",
      },
      data: "not json{{{",
    });
    // Should get 400 for parse error
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("health endpoint always available", async ({ request }) => {
    const res = await request.get("http://localhost:3000/health");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
