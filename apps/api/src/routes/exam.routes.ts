import { Hono } from "hono";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  startExamSchema,
  submitExamAnswerSchema,
  completeExamSchema,
  idSchema,
} from "@versado/validation";
import { getTrack, isValidTrackId } from "@versado/core";
import { db } from "../db";
import { examSessions, flashcards, decks } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { validate } from "../lib/validate";
import { checkExamLimit } from "../lib/feature-gates";

export const examRoutes = new Hono();

examRoutes.post("/start", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { trackId } = validate(startExamSchema, body);

  if (!isValidTrackId(trackId)) {
    throw new AppError(400, "Invalid track ID", "INVALID_TRACK");
  }

  const track = getTrack(trackId);
  if (!track.examMode.enabled) {
    throw new AppError(400, "Exam mode is not available for this track", "EXAM_NOT_AVAILABLE");
  }

  await checkExamLimit(user.id, user.tier, trackId, track.freeExamSimulations);

  const tagFilter = track.tagFilter;
  const cards = await db
    .select({
      id: flashcards.id,
      front: flashcards.front,
      back: flashcards.back,
    })
    .from(flashcards)
    .innerJoin(decks, eq(flashcards.deckId, decks.id))
    .where(
      and(
        eq(flashcards.tombstone, false),
        eq(decks.tombstone, false),
        sql`${decks.tags} @> ${JSON.stringify(tagFilter)}::jsonb`
      )
    )
    .orderBy(sql`random()`)
    .limit(track.examMode.questionCount);

  if (cards.length === 0) {
    throw new AppError(404, "No cards available for this track", "NO_CARDS");
  }

  const timeLimitSeconds = track.examMode.timeLimitMinutes * 60;

  const [session] = await db
    .insert(examSessions)
    .values({
      userId: user.id,
      trackId,
      questionCount: cards.length,
      passingScore: track.examMode.passingScore,
      timeLimitSeconds,
    })
    .returning();

  return c.json({
    id: session!.id,
    cards,
    timeLimitSeconds,
    questionCount: cards.length,
    passingScore: track.examMode.passingScore,
  });
});

examRoutes.post("/answer", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { examSessionId, cardId, knew } = validate(submitExamAnswerSchema, body);

  const [session] = await db
    .select()
    .from(examSessions)
    .where(
      and(eq(examSessions.id, examSessionId), eq(examSessions.userId, user.id))
    );

  if (!session) {
    throw new AppError(404, "Exam session not found", "SESSION_NOT_FOUND");
  }
  if (session.completedAt) {
    throw new AppError(400, "Exam session already completed", "SESSION_COMPLETED");
  }

  const newAnswer = { cardId, knew, answeredAt: new Date().toISOString() };
  const updatedAnswers = [...session.answers, newAnswer];

  await db
    .update(examSessions)
    .set({ answers: updatedAnswers })
    .where(eq(examSessions.id, examSessionId));

  return c.json({ answersSubmitted: updatedAnswers.length });
});

examRoutes.patch("/:id/complete", async (c) => {
  const user = c.get("user");
  const examSessionId = validate(idSchema, c.req.param("id"));
  const body = await c.req.json();
  const { timeSpentSeconds } = validate(completeExamSchema, {
    ...body,
    examSessionId,
  });

  const [session] = await db
    .select()
    .from(examSessions)
    .where(
      and(eq(examSessions.id, examSessionId), eq(examSessions.userId, user.id))
    );

  if (!session) {
    throw new AppError(404, "Exam session not found", "SESSION_NOT_FOUND");
  }
  if (session.completedAt) {
    throw new AppError(400, "Exam session already completed", "SESSION_COMPLETED");
  }

  const correctCount = session.answers.filter((a) => a.knew).length;
  const score = Math.round((correctCount / session.questionCount) * 100);
  const passed = score >= session.passingScore;

  const [result] = await db
    .update(examSessions)
    .set({
      correctCount,
      passed,
      timeSpentSeconds,
      completedAt: new Date(),
    })
    .where(eq(examSessions.id, examSessionId))
    .returning();

  return c.json({
    id: result!.id,
    passed: result!.passed,
    correctCount: result!.correctCount,
    questionCount: result!.questionCount,
    passingScore: result!.passingScore,
    timeSpentSeconds: result!.timeSpentSeconds,
    score,
  });
});

examRoutes.get("/history", async (c) => {
  const user = c.get("user");
  const trackId = c.req.query("trackId");

  const conditions = [
    eq(examSessions.userId, user.id),
    sql`${examSessions.completedAt} IS NOT NULL`,
  ];
  if (trackId) {
    conditions.push(eq(examSessions.trackId, trackId));
  }

  const sessions = await db
    .select({
      id: examSessions.id,
      trackId: examSessions.trackId,
      questionCount: examSessions.questionCount,
      correctCount: examSessions.correctCount,
      passingScore: examSessions.passingScore,
      passed: examSessions.passed,
      timeSpentSeconds: examSessions.timeSpentSeconds,
      completedAt: examSessions.completedAt,
    })
    .from(examSessions)
    .where(and(...conditions))
    .orderBy(desc(examSessions.completedAt))
    .limit(20);

  return c.json({ sessions });
});
