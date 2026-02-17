import { z } from "zod";
import { idSchema, tagsSchema } from "./common";

const difficultySchema = z.enum(["easy", "medium", "hard"]);

const cardSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("manual") }),
  z.object({ type: z.literal("ai"), prompt: z.string().max(500).optional() }),
  z.object({ type: z.literal("imported"), source: z.string().max(255) }),
]);

export const createFlashcardSchema = z.object({
  deckId: idSchema,
  front: z
    .string()
    .min(1, "Front side is required")
    .max(5000, "Front side must be at most 5000 characters")
    .trim(),
  back: z
    .string()
    .min(1, "Back side is required")
    .max(5000, "Back side must be at most 5000 characters")
    .trim(),
  tags: tagsSchema,
  difficulty: difficultySchema.default("medium"),
  source: cardSourceSchema.default({ type: "manual" }),
});

export const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, "Front side is required")
    .max(5000)
    .trim()
    .optional(),
  back: z
    .string()
    .min(1, "Back side is required")
    .max(5000)
    .trim()
    .optional(),
  tags: tagsSchema.optional(),
  difficulty: difficultySchema.optional(),
});

export const batchCreateFlashcardsSchema = z.object({
  deckId: idSchema,
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(5000).trim(),
        back: z.string().min(1).max(5000).trim(),
        tags: tagsSchema,
        difficulty: difficultySchema.default("medium"),
      })
    )
    .min(1, "At least one card is required")
    .max(100, "Maximum 100 cards per batch"),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type BatchCreateFlashcardsInput = z.infer<
  typeof batchCreateFlashcardsSchema
>;
