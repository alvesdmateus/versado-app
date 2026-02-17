import { Hono } from "hono";
import { eq, and, gte } from "drizzle-orm";
import { db } from "../db";
import { decks, cardProgress, studySessions } from "../db/schema";

export const dashboardRoutes = new Hono();

// Get aggregate dashboard stats
dashboardRoutes.get("/", async (c) => {
  const user = c.get("user");

  // Get all user's decks
  const userDecks = await db
    .select()
    .from(decks)
    .where(and(eq(decks.ownerId, user.id), eq(decks.tombstone, false)));

  // Get all card progress for this user
  const allProgress = await db
    .select()
    .from(cardProgress)
    .where(
      and(eq(cardProgress.userId, user.id), eq(cardProgress.tombstone, false))
    );

  const now = new Date();
  const mastered = allProgress.filter((p) => p.status === "mastered").length;
  const dueToday = allProgress.filter((p) => p.dueDate <= now).length;

  // Get study sessions for streak and accuracy calculation (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, user.id),
        gte(studySessions.startedAt, thirtyDaysAgo)
      )
    );

  // Compute accuracy from recent sessions
  let totalStudied = 0;
  let totalCorrect = 0;
  for (const session of recentSessions) {
    totalStudied += session.stats.cardsStudied;
    totalCorrect += session.stats.correctCount;
  }
  const accuracy = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

  // Compute streak: consecutive days with at least one session
  const sessionDates = new Set<string>();
  for (const session of recentSessions) {
    sessionDates.add(session.startedAt.toISOString().slice(0, 10));
  }

  const todayStr = now.toISOString().slice(0, 10);
  const streakActive = sessionDates.has(todayStr);

  let streakDays = 0;
  const checkDate = new Date(now);
  // If user hasn't studied today, start checking from yesterday
  if (!streakActive) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (sessionDates.has(checkDate.toISOString().slice(0, 10))) {
    streakDays++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Build deck summaries with progress
  const deckSummaries = userDecks.map((deck) => {
    const total = deck.stats.totalCards;
    const masteredInDeck = deck.stats.masteredCards;
    const progress = total > 0 ? Math.round((masteredInDeck / total) * 100) : 0;

    return {
      id: deck.id,
      name: deck.name,
      cardCount: total,
      coverImageUrl: deck.coverImageUrl,
      progress,
    };
  });

  return c.json({
    mastered,
    dueToday,
    accuracy,
    streakDays,
    streakActive,
    decks: deckSummaries,
  });
});
