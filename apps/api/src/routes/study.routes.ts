import { Hono } from "hono";
import { eq, and, lte } from "drizzle-orm";
import { submitReviewSchema, startSessionSchema, idSchema } from "@flashcard/validation";
import { calculateSM2 } from "@flashcard/algorithms";
import type { ReviewRating } from "@flashcard/algorithms";
import { db } from "../db";
import { cardProgress, flashcards, decks, studySessions } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { validate } from "../lib/validate";

export const studyRoutes = new Hono();

// Get due cards for a deck
studyRoutes.get("/decks/:deckId/due", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);

  const dueCards = await db
    .select({
      progress: cardProgress,
      flashcard: flashcards,
    })
    .from(cardProgress)
    .innerJoin(flashcards, eq(cardProgress.cardId, flashcards.id))
    .where(
      and(
        eq(cardProgress.deckId, deckId),
        eq(cardProgress.userId, user.id),
        eq(cardProgress.tombstone, false),
        eq(flashcards.tombstone, false),
        lte(cardProgress.dueDate, new Date())
      )
    )
    .orderBy(cardProgress.dueDate)
    .limit(limit);

  return c.json(dueCards);
});

// Get deck study stats
studyRoutes.get("/decks/:deckId/stats", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));

  const allProgress = await db
    .select()
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.deckId, deckId),
        eq(cardProgress.userId, user.id),
        eq(cardProgress.tombstone, false)
      )
    );

  const totalCards = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.deckId, deckId), eq(flashcards.tombstone, false)));

  const now = new Date();
  const stats = {
    total: totalCards.length,
    new: totalCards.length - allProgress.length,
    learning: allProgress.filter(
      (p) => p.status === "learning" || p.status === "relearning"
    ).length,
    review: allProgress.filter((p) => p.status === "review").length,
    mastered: allProgress.filter((p) => p.status === "mastered").length,
    dueToday: allProgress.filter((p) => p.dueDate <= now).length,
  };

  return c.json(stats);
});

// Submit a review
studyRoutes.post("/review", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = validate(submitReviewSchema, body);

  const results = await db
    .select()
    .from(cardProgress)
    .where(
      and(
        eq(cardProgress.id, data.progressId),
        eq(cardProgress.userId, user.id)
      )
    )
    .limit(1);
  const progress = results[0];

  if (!progress) {
    throw new AppError(404, "Card progress not found", "NOT_FOUND");
  }

  const sm2Result = calculateSM2(
    {
      easeFactor: progress.easeFactor,
      interval: progress.interval,
      repetitions: progress.repetitions,
    },
    data.rating as ReviewRating
  );

  // Determine status from SM-2 values
  let status: string;
  if (sm2Result.repetitions === 0) {
    status = "relearning";
  } else if (sm2Result.interval >= 21) {
    status = "mastered";
  } else if (sm2Result.repetitions <= 2) {
    status = "learning";
  } else {
    status = "review";
  }

  const rows = await db
    .update(cardProgress)
    .set({
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      status,
      dueDate: sm2Result.nextReviewDate,
      lastReviewedAt: new Date(),
      version: progress.version + 1,
    })
    .where(eq(cardProgress.id, progress.id))
    .returning();

  return c.json({
    updatedProgress: rows[0]!,
    nextReviewDate: sm2Result.nextReviewDate,
  });
});

// Start a new study session
studyRoutes.post("/sessions", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = validate(startSessionSchema, body);

  const deckResults = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, data.deckId), eq(decks.tombstone, false)))
    .limit(1);

  if (!deckResults[0]) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }

  const rows = await db
    .insert(studySessions)
    .values({
      userId: user.id,
      deckId: data.deckId,
    })
    .returning();

  return c.json(rows[0]!, 201);
});

// End a study session
studyRoutes.patch("/sessions/:id/end", async (c) => {
  const user = c.get("user");
  const id = validate(idSchema, c.req.param("id"));

  const results = await db
    .select()
    .from(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.userId, user.id)))
    .limit(1);

  if (!results[0]) {
    throw new AppError(404, "Session not found", "NOT_FOUND");
  }

  const rows = await db
    .update(studySessions)
    .set({ endedAt: new Date() })
    .where(eq(studySessions.id, id))
    .returning();

  return c.json(rows[0]!);
});

// Initialize card progress for new cards
studyRoutes.post("/decks/:deckId/init-progress", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);

  const allCards = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.deckId, deckId), eq(flashcards.tombstone, false)));

  const existingProgress = await db
    .select({ cardId: cardProgress.cardId })
    .from(cardProgress)
    .where(
      and(eq(cardProgress.deckId, deckId), eq(cardProgress.userId, user.id))
    );

  const existingCardIds = new Set(existingProgress.map((p) => p.cardId));
  const newCards = allCards
    .filter((card) => !existingCardIds.has(card.id))
    .slice(0, limit);

  if (newCards.length === 0) {
    return c.json([]);
  }

  const progressRecords = await db
    .insert(cardProgress)
    .values(
      newCards.map((card) => ({
        userId: user.id,
        cardId: card.id,
        deckId,
      }))
    )
    .returning();

  return c.json(progressRecords, 201);
});
