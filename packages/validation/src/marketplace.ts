import { z } from "zod";
import { idSchema, paginationSchema } from "./common";

export const listMarketplaceSchema = paginationSchema.extend({
  search: z.string().max(100).trim().optional(),
  tag: z.string().max(50).optional(),
  sortBy: z
    .enum(["newest", "popular", "rating", "price_asc", "price_desc"])
    .default("popular"),
  minRating: z.coerce.number().min(1).max(5).optional(),
});

export const purchaseDeckSchema = z.object({
  deckId: idSchema,
});

export const createReviewSchema = z.object({
  deckId: idSchema,
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .max(1000, "Review must be at most 1000 characters")
    .trim()
    .optional(),
});

export const listDeckSchema = z.object({
  deckId: idSchema,
  price: z
    .number()
    .int()
    .min(0, "Price cannot be negative")
    .max(9999, "Maximum price is $99.99"),
});

export const unlistDeckSchema = z.object({
  deckId: idSchema,
});

export type ListMarketplaceInput = z.infer<typeof listMarketplaceSchema>;
export type PurchaseDeckInput = z.infer<typeof purchaseDeckSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListDeckInput = z.infer<typeof listDeckSchema>;
export type UnlistDeckInput = z.infer<typeof unlistDeckSchema>;
