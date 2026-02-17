import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDeckSchema, updateDeckSchema, idSchema } from "@flashcard/validation";
import { db } from "../db";
import { decks, flashcards } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { validate } from "../lib/validate";
import { checkDeckLimit } from "../lib/feature-gates";

export const deckRoutes = new Hono();

// List user's decks
deckRoutes.get("/", async (c) => {
  const user = c.get("user");
  const results = await db
    .select()
    .from(decks)
    .where(and(eq(decks.ownerId, user.id), eq(decks.tombstone, false)));

  return c.json(results);
});

// Get single deck
deckRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));

  const results = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.tombstone, false)))
    .limit(1);
  const deck = results[0];

  if (!deck) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }

  if (
    deck.ownerId !== user.id &&
    deck.visibility !== "public" &&
    deck.visibility !== "marketplace"
  ) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  return c.json(deck);
});

// Get deck's flashcards
deckRoutes.get("/:id/cards", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));

  const results = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.tombstone, false)))
    .limit(1);
  const deck = results[0];

  if (!deck) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }

  if (
    deck.ownerId !== user.id &&
    deck.visibility !== "public" &&
    deck.visibility !== "marketplace"
  ) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  const cards = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.deckId, id), eq(flashcards.tombstone, false)));

  return c.json(cards);
});

// Create deck
deckRoutes.post("/", async (c) => {
  const user = c.get("user");
  await checkDeckLimit(user.id, user.tier);

  const body = await c.req.json();
  const data = validate(createDeckSchema, body);

  const rows = await db
    .insert(decks)
    .values({
      ownerId: user.id,
      name: data.name,
      description: data.description,
      tags: data.tags,
      visibility: data.visibility,
      settings: {
        newCardsPerDay: data.settings?.newCardsPerDay ?? 20,
        reviewsPerDay: data.settings?.reviewsPerDay ?? 100,
        algorithm: data.settings?.algorithm ?? "sm2",
      },
    })
    .returning();

  return c.json(rows[0]!, 201);
});

// Update deck
deckRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));
  const body = await c.req.json();
  const data = validate(updateDeckSchema, body);

  const results = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.tombstone, false)))
    .limit(1);
  const existing = results[0];

  if (!existing) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }
  if (existing.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    version: existing.version + 1,
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
  if (data.settings !== undefined) {
    updateData.settings = { ...existing.settings, ...data.settings };
  }

  const rows = await db
    .update(decks)
    .set(updateData)
    .where(eq(decks.id, id))
    .returning();

  return c.json(rows[0]!);
});

// Delete deck (soft delete)
deckRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));

  const results = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.tombstone, false)))
    .limit(1);
  const existing = results[0];

  if (!existing) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }
  if (existing.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  await db
    .update(decks)
    .set({
      tombstone: true,
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(decks.id, id));

  return c.json({ success: true });
});
