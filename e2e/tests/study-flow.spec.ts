import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

test.describe("Study Flow", () => {
  test("API-driven study session flow", async ({ request }) => {
    const user = await registerUser(request);
    const apiHeaders = { Authorization: `Bearer ${user.accessToken}` };
    const apiBase = "http://localhost:3000";

    // Create deck
    const deckRes = await request.post(`${apiBase}/api/decks`, {
      headers: apiHeaders,
      data: { name: "Study Flow Deck" },
    });
    const deck = await deckRes.json();

    // Add cards
    const cardsRes = await request.post(`${apiBase}/api/flashcards/batch`, {
      headers: apiHeaders,
      data: {
        deckId: deck.id,
        cards: [
          { front: "1+1", back: "2" },
          { front: "2+2", back: "4" },
        ],
      },
    });
    expect(cardsRes.ok()).toBe(true);

    // Init card progress
    const initRes = await request.post(
      `${apiBase}/api/study/decks/${deck.id}/init-progress`,
      { headers: apiHeaders }
    );
    expect(initRes.ok()).toBe(true);
    const progressRecords = await initRes.json();
    expect(progressRecords.length).toBe(2);

    // Start study session
    const sessionRes = await request.post(`${apiBase}/api/study/sessions`, {
      headers: apiHeaders,
      data: { deckId: deck.id },
    });
    expect(sessionRes.ok()).toBe(true);
    const session = await sessionRes.json();

    // Submit review for first card
    const reviewRes = await request.post(`${apiBase}/api/study/review`, {
      headers: apiHeaders,
      data: {
        progressId: progressRecords[0].id,
        rating: 4, // Easy
        responseTimeMs: 2000,
      },
    });
    expect(reviewRes.ok()).toBe(true);
    const reviewData = await reviewRes.json();
    expect(reviewData.nextReviewDate).toBeDefined();

    // End session
    const endRes = await request.patch(
      `${apiBase}/api/study/sessions/${session.id}/end`,
      { headers: apiHeaders }
    );
    expect(endRes.ok()).toBe(true);
    const endedSession = await endRes.json();
    expect(endedSession.endedAt).not.toBeNull();
  });
});
