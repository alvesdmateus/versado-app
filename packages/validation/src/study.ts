import { z } from "zod";
import { idSchema } from "./common";

export const reviewRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const submitReviewSchema = z.object({
  progressId: idSchema,
  rating: reviewRatingSchema,
  responseTimeMs: z.number().int().min(0).max(300_000).default(0),
  sessionId: idSchema.optional(),
  forceMaster: z.boolean().optional(),
});

export const startSessionSchema = z.object({
  deckId: idSchema,
  cardsPerSession: z.number().int().min(1).max(100).default(20),
  includeNew: z.boolean().default(true),
});

export const startExamSchema = z.object({
  trackId: z.string().min(1),
});

export const submitExamAnswerSchema = z.object({
  examSessionId: idSchema,
  cardId: idSchema,
  knew: z.boolean(),
});

export const completeExamSchema = z.object({
  examSessionId: idSchema,
  timeSpentSeconds: z.number().int().min(0),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type StartExamInput = z.infer<typeof startExamSchema>;
export type SubmitExamAnswerInput = z.infer<typeof submitExamAnswerSchema>;
export type CompleteExamInput = z.infer<typeof completeExamSchema>;
