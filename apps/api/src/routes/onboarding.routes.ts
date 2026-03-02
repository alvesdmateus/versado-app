import { Hono } from "hono";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { users, decks, flashcards, purchases } from "../db/schema";
import { validate } from "../lib/validate";

const SYSTEM_EMAIL = "system@versado.app";

const claimStarterDecksSchema = z.object({
  tags: z.array(z.string().min(1)).min(1).max(16),
});

export const onboardingRoutes = new Hono();

// Claim starter decks based on selected topic tags
onboardingRoutes.post("/claim-starter-decks", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { tags } = validate(claimStarterDecksSchema, body);

  // Find system user
  const [systemUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SYSTEM_EMAIL))
    .limit(1);

  if (!systemUser) {
    return c.json({ claimedDeckIds: [] });
  }

  const claimedDeckIds: string[] = [];

  for (const tag of tags) {
    // Find starter deck for this tag
    const [sourceDeck] = await db
      .select()
      .from(decks)
      .where(
        and(
          eq(decks.ownerId, systemUser.id),
          eq(decks.visibility, "marketplace"),
          eq(decks.tombstone, false),
          sql`${decks.tags} @> ${JSON.stringify([tag])}::jsonb`,
        ),
      )
      .limit(1);

    if (!sourceDeck) continue;

    // Check if already claimed
    const [existing] = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(
        and(
          eq(purchases.buyerId, user.id),
          eq(purchases.deckId, sourceDeck.id),
          eq(purchases.status, "completed"),
        ),
      )
      .limit(1);

    if (existing) continue;

    // Clone deck
    const [clonedDeck] = await db
      .insert(decks)
      .values({
        ownerId: user.id,
        name: sourceDeck.name,
        description: sourceDeck.description,
        coverImageUrl: sourceDeck.coverImageUrl,
        tags: sourceDeck.tags,
        visibility: "private",
        settings: sourceDeck.settings,
        stats: {
          totalCards: 0,
          newCards: 0,
          learningCards: 0,
          reviewCards: 0,
          masteredCards: 0,
        },
      })
      .returning();

    // Clone flashcards
    const sourceCards = await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.deckId, sourceDeck.id), eq(flashcards.tombstone, false)));

    if (sourceCards.length > 0) {
      await db.insert(flashcards).values(
        sourceCards.map((card) => ({
          deckId: clonedDeck!.id,
          front: card.front,
          back: card.back,
          tags: card.tags,
          difficulty: card.difficulty,
          source: { type: "imported" as const, source: `starter:${sourceDeck.id}` },
        })),
      );

      await db
        .update(decks)
        .set({
          stats: {
            totalCards: sourceCards.length,
            newCards: sourceCards.length,
            learningCards: 0,
            reviewCards: 0,
            masteredCards: 0,
          },
        })
        .where(eq(decks.id, clonedDeck!.id));
    }

    // Create purchase record
    await db.insert(purchases).values({
      buyerId: user.id,
      deckId: sourceDeck.id,
      sellerId: systemUser.id,
      priceInCents: 0,
      commissionInCents: 0,
      status: "completed",
    });

    // Increment purchase count on source deck
    const currentCount = sourceDeck.marketplace?.purchaseCount ?? 0;
    await db
      .update(decks)
      .set({
        marketplace: { ...sourceDeck.marketplace!, purchaseCount: currentCount + 1 },
        updatedAt: new Date(),
      })
      .where(eq(decks.id, sourceDeck.id));

    claimedDeckIds.push(clonedDeck!.id);
  }

  return c.json({ claimedDeckIds }, 201);
});
