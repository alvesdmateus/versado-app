import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

test.describe("Feature Gates", () => {
  test("free user hits deck limit at 5 decks", async ({ request }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };
    const apiBase = "http://localhost:3000";

    // Create 5 decks (should succeed)
    for (let i = 0; i < 5; i++) {
      const res = await request.post(`${apiBase}/api/decks`, {
        headers: apiHeaders,
        data: { name: `Deck ${i + 1}` },
      });
      expect(res.status()).toBe(201);
    }

    // 6th deck should fail with 403
    const res = await request.post(`${apiBase}/api/decks`, {
      headers: apiHeaders,
      data: { name: "Deck 6" },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("DECK_LIMIT_REACHED");
  });

  test("free user hits card limit at 100 cards per deck", async ({
    request,
  }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };
    const apiBase = "http://localhost:3000";

    // Create a deck
    const deckRes = await request.post(`${apiBase}/api/decks`, {
      headers: apiHeaders,
      data: { name: "Card Limit Test" },
    });
    const deck = await deckRes.json();

    // Add 100 cards in a batch
    const cards = Array.from({ length: 100 }, (_, i) => ({
      front: `Question ${i}`,
      back: `Answer ${i}`,
    }));
    const batchRes = await request.post(`${apiBase}/api/flashcards/batch`, {
      headers: apiHeaders,
      data: { deckId: deck.id, cards },
    });
    expect(batchRes.ok()).toBe(true);

    // 101st card should fail
    const cardRes = await request.post(`${apiBase}/api/flashcards`, {
      headers: apiHeaders,
      data: { deckId: deck.id, front: "Extra Q", back: "Extra A" },
    });
    expect(cardRes.status()).toBe(403);
    const body = await cardRes.json();
    expect(body.code).toBe("CARD_LIMIT_REACHED");
  });
});
