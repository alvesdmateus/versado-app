import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

test.describe("Deck Lifecycle", () => {
  test("create deck via API and verify it appears", async ({
    page,
    request,
  }) => {
    const user = await registerUser(request);

    // Inject auth token
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("versado_access_token", token);
    }, user.accessToken);

    // Create a deck via API
    const deckRes = await request.post("http://localhost:3000/api/decks", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      data: { name: "E2E Test Deck" },
    });
    expect(deckRes.ok()).toBe(true);

    // Navigate to decks page
    await page.goto("/decks");
    // The deck should be visible
    await expect(page.locator("text=E2E Test Deck")).toBeVisible({
      timeout: 5000,
    });
  });

  test("create deck with cards via API", async ({ page, request }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };

    // Create deck
    const deckRes = await request.post("http://localhost:3000/api/decks", {
      headers: apiHeaders,
      data: { name: "Cards Test Deck" },
    });
    const deck = await deckRes.json();

    // Add cards
    await request.post("http://localhost:3000/api/flashcards/batch", {
      headers: apiHeaders,
      data: {
        deckId: deck.id,
        cards: [
          { front: "Hello", back: "Hola" },
          { front: "Goodbye", back: "Adiós" },
        ],
      },
    });

    // Check deck detail page
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("versado_access_token", token);
    }, user.accessToken);

    await page.goto(`/decks/${deck.id}`);
    await expect(page.locator("text=Cards Test Deck")).toBeVisible({
      timeout: 5000,
    });
  });
});
