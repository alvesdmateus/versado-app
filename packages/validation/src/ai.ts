import { z } from "zod";
import { idSchema } from "./common";

export const generateFlashcardsSchema = z.object({
  deckId: idSchema,
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(500, "Prompt must be at most 500 characters").trim(),
  count: z.number().int().min(1).max(20).default(10),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

export const extractFlashcardsSchema = z.object({
  deckId: idSchema,
  text: z.string().min(50, "Text must be at least 50 characters").max(15000, "Text must be at most 15,000 characters").trim(),
  count: z.number().int().min(1).max(30).default(10),
});

export type ExtractFlashcardsInput = z.infer<typeof extractFlashcardsSchema>;
