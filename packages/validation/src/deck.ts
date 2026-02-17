import { z } from "zod";
import { tagsSchema } from "./common";

const deckVisibilitySchema = z.enum([
  "private",
  "shared",
  "public",
  "marketplace",
]);

const studyAlgorithmSchema = z.enum(["sm2", "fsrs"]);

const deckSettingsSchema = z.object({
  newCardsPerDay: z.number().int().min(1).max(500).default(20),
  reviewsPerDay: z.number().int().min(1).max(1000).default(100),
  algorithm: studyAlgorithmSchema.default("sm2"),
});

export const createDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name is required")
    .max(100, "Deck name must be at most 100 characters")
    .trim(),
  description: z.string().max(1000).trim().default(""),
  tags: tagsSchema,
  visibility: deckVisibilitySchema.default("private"),
  settings: deckSettingsSchema.partial().default({}),
});

export const updateDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name is required")
    .max(100, "Deck name must be at most 100 characters")
    .trim()
    .optional(),
  description: z.string().max(1000).trim().optional(),
  tags: tagsSchema.optional(),
  visibility: deckVisibilitySchema.optional(),
  settings: deckSettingsSchema.partial().optional(),
  coverImageUrl: z.string().url().max(2048).nullable().optional(),
});

export const listDecksSchema = z.object({
  visibility: deckVisibilitySchema.optional(),
  tag: z.string().max(50).optional(),
  search: z.string().max(100).trim().optional(),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type ListDecksInput = z.infer<typeof listDecksSchema>;
