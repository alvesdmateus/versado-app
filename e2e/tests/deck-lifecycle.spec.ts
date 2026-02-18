import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

test.describe("Deck Lifecycle", () => {
  test("create deck via API and verify it appears", async ({
    request,
  }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };

    // Create a deck via API
    const deckRes = await request.post("http://localhost:3000/api/decks", {
      headers: apiHeaders,
      data: { name: "E2E Test Deck" },
    });
    expect(deckRes.ok()).toBe(true);

    // Verify deck appears via API
    const listRes = await request.get("http://localhost:3000/api/decks", {
      headers: apiHeaders,
    });
    expect(listRes.ok()).toBe(true);
    const decks = await listRes.json();
    expect(decks.some((d: any) => d.name === "E2E Test Deck")).toBe(true);
  });

  test("create deck with cards via API", async ({ request }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };

    // Create deck
    const deckRes = await request.post("http://localhost:3000/api/decks", {
      headers: apiHeaders,
      data: { name: "Cards Test Deck" },
    });
    expect(deckRes.ok()).toBe(true);
    const deck = await deckRes.json();

    // Add cards
    const cardsRes = await request.post("http://localhost:3000/api/flashcards/batch", {
      headers: apiHeaders,
      data: {
        deckId: deck.id,
        cards: [
          { front: "Hello", back: "Hola" },
          { front: "Goodbye", back: "Adiós" },
        ],
      },
    });
    expect(cardsRes.ok()).toBe(true);

    // Verify cards via API
    const getCardsRes = await request.get(
      `http://localhost:3000/api/decks/${deck.id}/cards`,
      { headers: apiHeaders }
    );
    expect(getCardsRes.ok()).toBe(true);
    const cards = await getCardsRes.json();
    expect(cards.length).toBe(2);
  });
});
