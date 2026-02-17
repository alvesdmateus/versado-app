import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import {
  createFlashcardSchema,
  updateFlashcardSchema,
  batchCreateFlashcardsSchema,
  idSchema,
} from "@flashcard/validation";
import { db } from "../db";
import { flashcards, decks } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { validate } from "../lib/validate";
import { checkCardLimit } from "../lib/feature-gates";

export const flashcardRoutes = new Hono();

// Batch create flashcards
flashcardRoutes.post("/batch", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = validate(batchCreateFlashcardsSchema, body);

  // Verify deck ownership
  const deckResults = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, data.deckId), eq(decks.tombstone, false)))
    .limit(1);
  const deck = deckResults[0];

  if (!deck) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }
  if (deck.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  checkCardLimit(user.tier, deck.stats.totalCards);

  const rows = await db
    .insert(flashcards)
    .values(
      data.cards.map((card) => ({
        deckId: data.deckId,
        front: card.front,
        back: card.back,
        tags: card.tags,
        difficulty: card.difficulty,
      }))
    )
    .returning();

  // Update deck card count
  await db
    .update(decks)
    .set({
      stats: {
        ...deck.stats,
        totalCards: deck.stats.totalCards + rows.length,
        newCards: deck.stats.newCards + rows.length,
      },
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deck.id));

  return c.json(rows, 201);
});

// Get single flashcard
flashcardRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));

  const results = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.tombstone, false)))
    .limit(1);
  const card = results[0];

  if (!card) {
    throw new AppError(404, "Flashcard not found", "NOT_FOUND");
  }

  // Verify deck access
  const deckResults = await db
    .select()
    .from(decks)
    .where(eq(decks.id, card.deckId))
    .limit(1);
  const deck = deckResults[0];

  if (
    deck &&
    deck.ownerId !== user.id &&
    deck.visibility !== "public" &&
    deck.visibility !== "marketplace"
  ) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  return c.json(card);
});

// Create flashcard
flashcardRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = validate(createFlashcardSchema, body);

  // Verify deck ownership
  const deckResults = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, data.deckId), eq(decks.tombstone, false)))
    .limit(1);
  const deck = deckResults[0];

  if (!deck) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }
  if (deck.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  checkCardLimit(user.tier, deck.stats.totalCards);

  const rows = await db
    .insert(flashcards)
    .values({
      deckId: data.deckId,
      front: data.front,
      back: data.back,
      tags: data.tags,
      difficulty: data.difficulty,
      source: data.source,
    })
    .returning();

  // Update deck card count
  await db
    .update(decks)
    .set({
      stats: {
        ...deck.stats,
        totalCards: deck.stats.totalCards + 1,
        newCards: deck.stats.newCards + 1,
      },
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deck.id));

  return c.json(rows[0]!, 201);
});

// Update flashcard
flashcardRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));
  const body = await c.req.json();
  const data = validate(updateFlashcardSchema, body);

  const results = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.tombstone, false)))
    .limit(1);
  const existing = results[0];

  if (!existing) {
    throw new AppError(404, "Flashcard not found", "NOT_FOUND");
  }

  const deckResults = await db
    .select()
    .from(decks)
    .where(eq(decks.id, existing.deckId))
    .limit(1);
  const deck = deckResults[0];

  if (!deck || deck.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    version: existing.version + 1,
  };

  if (data.front !== undefined) updateData.front = data.front;
  if (data.back !== undefined) updateData.back = data.back;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;

  const rows = await db
    .update(flashcards)
    .set(updateData)
    .where(eq(flashcards.id, id))
    .returning();

  return c.json(rows[0]!);
});

// Delete flashcard (soft delete)
flashcardRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));

  const results = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.tombstone, false)))
    .limit(1);
  const existing = results[0];

  if (!existing) {
    throw new AppError(404, "Flashcard not found", "NOT_FOUND");
  }

  const deckResults = await db
    .select()
    .from(decks)
    .where(eq(decks.id, existing.deckId))
    .limit(1);
  const deck = deckResults[0];

  if (!deck || deck.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  await db
    .update(flashcards)
    .set({
      tombstone: true,
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(flashcards.id, id));

  // Update deck card count
  await db
    .update(decks)
    .set({
      stats: {
        ...deck.stats,
        totalCards: Math.max(0, deck.stats.totalCards - 1),
      },
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deck.id));

  return c.json({ success: true });
});
