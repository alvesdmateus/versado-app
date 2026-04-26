import { Hono } from "hono";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { submitReviewSchema, startSessionSchema, idSchema } from "@versado/validation";
import { calculateSM2 } from "@versado/algorithms";
import type { ReviewRating } from "@versado/algorithms";
import { db } from "../db";
import { cardProgress, flashcards, decks, studySessions } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { validate } from "../lib/validate";
import { getLimits, checkTrackCardLimit } from "../lib/feature-gates";
import { getTrack, isValidTrackId } from "@versado/core";
import { users } from "../db/schema";

export const studyRoutes = new Hono();

// Get cards available for study (all non-mastered cards)
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
        sql`${cardProgress.status} != 'mastered'`
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

  const stats = {
    total: totalCards.length,
    new: totalCards.length - allProgress.length,
    learning: allProgress.filter(
      (p) => p.status === "learning" || p.status === "relearning"
    ).length,
    review: allProgress.filter((p) => p.status === "review").length,
    mastered: allProgress.filter((p) => p.status === "mastered").length,
    dueToday: totalCards.length - allProgress.filter((p) => p.status === "mastered").length,
  };

  return c.json(stats);
});

// Submit a review
studyRoutes.post("/review", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = validate(submitReviewSchema, body);

  // Check daily review limit
  const limits = getLimits(user.tier);
  if (limits.dailyReviewLimit !== Infinity) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cardProgress)
      .where(
        and(
          eq(cardProgress.userId, user.id),
          gte(cardProgress.lastReviewedAt, todayStart)
        )
      );

    if ((result?.count ?? 0) >= limits.dailyReviewLimit) {
      throw new AppError(
        403,
        `Free plan is limited to ${limits.dailyReviewLimit} reviews per day. Go Fluent for unlimited reviews.`,
        "REVIEW_LIMIT_REACHED"
      );
    }
  }

  // Check track-based card limit
  const [userRow] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, user.id));
  const activeTrackId = userRow?.preferences?.activeTrackId;
  if (activeTrackId && isValidTrackId(activeTrackId)) {
    const track = getTrack(activeTrackId);
    await checkTrackCardLimit(user.id, user.tier, track.freeCardLimit);
  }

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

  const previousStatus = progress.status;
  let status: string;
  let updateSet: Record<string, unknown>;

  if (data.forceMaster) {
    // Instant master: bypass SM-2, set interval to 21+ days
    const masteredDate = new Date();
    masteredDate.setDate(masteredDate.getDate() + 21);
    status = "mastered";
    updateSet = {
      easeFactor: Math.max(progress.easeFactor, 2.5),
      interval: 21,
      repetitions: Math.max(progress.repetitions + 1, 4),
      status,
      dueDate: masteredDate,
      lastReviewedAt: new Date(),
      version: progress.version + 1,
    };
  } else {
    const sm2Result = calculateSM2(
      {
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
      },
      data.rating as ReviewRating
    );

    // Determine status from SM-2 values
    if (sm2Result.repetitions === 0) {
      status = "relearning";
    } else if (sm2Result.interval >= 21) {
      status = "mastered";
    } else if (sm2Result.repetitions <= 2) {
      status = "learning";
    } else {
      status = "review";
    }

    updateSet = {
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      status,
      dueDate: sm2Result.nextReviewDate,
      lastReviewedAt: new Date(),
      version: progress.version + 1,
    };
  }

  const rows = await db
    .update(cardProgress)
    .set(updateSet)
    .where(eq(cardProgress.id, progress.id))
    .returning();

  // Append review to session (if sessionId provided)
  if (data.sessionId) {
    const review = {
      id: crypto.randomUUID(),
      cardId: progress.cardId,
      rating: data.rating,
      responseTimeMs: data.responseTimeMs ?? 0,
      reviewedAt: new Date().toISOString(),
    };
    await db
      .update(studySessions)
      .set({
        reviews: sql`${studySessions.reviews} || ${JSON.stringify([review])}::jsonb`,
      })
      .where(
        and(
          eq(studySessions.id, data.sessionId),
          eq(studySessions.userId, user.id)
        )
      );
  }

  // Update deck stats when mastered status changes
  if (status === "mastered" && previousStatus !== "mastered") {
    await db
      .update(decks)
      .set({
        stats: sql`jsonb_set(${decks.stats}, '{masteredCards}', to_jsonb((${decks.stats}->>'masteredCards')::int + 1))`,
      })
      .where(eq(decks.id, progress.deckId));
  } else if (status !== "mastered" && previousStatus === "mastered") {
    await db
      .update(decks)
      .set({
        stats: sql`jsonb_set(${decks.stats}, '{masteredCards}', to_jsonb(GREATEST(0, (${decks.stats}->>'masteredCards')::int - 1)))`,
      })
      .where(eq(decks.id, progress.deckId));
  }

  return c.json({
    updatedProgress: rows[0]!,
    nextReviewDate: updateSet.dueDate,
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

  const session = results[0];
  if (!session) {
    throw new AppError(404, "Session not found", "NOT_FOUND");
  }

  // Compute stats from accumulated reviews
  const reviews = (session.reviews ?? []) as Array<{
    rating: number;
    responseTimeMs: number;
  }>;
  const cardsStudied = reviews.length;
  const correctCount = reviews.filter((r) => r.rating >= 3).length;
  const incorrectCount = cardsStudied - correctCount;
  const totalTimeMs = reviews.reduce((sum, r) => sum + (r.responseTimeMs ?? 0), 0);
  const averageTimeMs = cardsStudied > 0 ? Math.round(totalTimeMs / cardsStudied) : 0;

  const rows = await db
    .update(studySessions)
    .set({
      endedAt: new Date(),
      stats: { cardsStudied, correctCount, incorrectCount, averageTimeMs },
    })
    .where(eq(studySessions.id, id))
    .returning();

  return c.json(rows[0]!);
});

// Initialize card progress for new cards
studyRoutes.post("/decks/:deckId/init-progress", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));

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
    .filter((card) => !existingCardIds.has(card.id));

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

// List study sessions (history)
studyRoutes.get("/sessions", async (c) => {
  const user = c.get("user");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const offset = Number(c.req.query("offset") ?? 0);

  const sessions = await db
    .select({
      id: studySessions.id,
      deckId: studySessions.deckId,
      deckName: decks.name,
      startedAt: studySessions.startedAt,
      endedAt: studySessions.endedAt,
      reviews: studySessions.reviews,
      stats: studySessions.stats,
    })
    .from(studySessions)
    .leftJoin(decks, eq(studySessions.deckId, decks.id))
    .where(eq(studySessions.userId, user.id))
    .orderBy(desc(studySessions.startedAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studySessions)
    .where(eq(studySessions.userId, user.id));

  return c.json({
    sessions,
    total: countResult?.count ?? 0,
  });
});

// Detailed study stats
studyRoutes.get("/stats/detailed", async (c) => {
  const user = c.get("user");

  // Card status distribution across all decks
  const statusCounts = await db
    .select({
      status: cardProgress.status,
      count: sql<number>`count(*)::int`,
    })
    .from(cardProgress)
    .where(and(eq(cardProgress.userId, user.id), eq(cardProgress.tombstone, false)))
    .groupBy(cardProgress.status);

  const cardDistribution: Record<string, number> = {};
  for (const row of statusCounts) {
    cardDistribution[row.status] = row.count;
  }

  // Daily review counts and accuracy for last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentSessions = await db
    .select({
      startedAt: studySessions.startedAt,
      reviews: studySessions.reviews,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, user.id),
        gte(studySessions.startedAt, fourteenDaysAgo)
      )
    )
    .orderBy(studySessions.startedAt);

  // Aggregate by day using individual review ratings
  const dailyData: Record<string, { reviews: number; correct: number; total: number }> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    dailyData[key] = { reviews: 0, correct: 0, total: 0 };
  }

  for (const session of recentSessions) {
    const key = new Date(session.startedAt).toISOString().slice(0, 10);
    if (dailyData[key]) {
      const reviewsArr = session.reviews as Array<{ rating: number }> | null;
      if (reviewsArr && reviewsArr.length > 0) {
        dailyData[key].reviews += reviewsArr.length;
        dailyData[key].total += reviewsArr.length;
        dailyData[key].correct += reviewsArr.filter((r) => r.rating >= 3).length;
      }
    }
  }

  const dailyReviews = Object.entries(dailyData).map(([date, data]) => ({
    date,
    reviews: data.reviews,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : null,
  }));

  // Total sessions count
  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studySessions)
    .where(eq(studySessions.userId, user.id));

  return c.json({
    cardDistribution,
    dailyReviews,
    totalSessions: sessionCount?.count ?? 0,
  });
});
