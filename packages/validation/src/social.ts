import { z } from "zod";
import { idSchema, paginationSchema } from "./common";

export const followUserSchema = z.object({
  userId: idSchema,
});

export const followTagSchema = z.object({
  tag: z.string().min(1).max(50).trim(),
});

export const feedQuerySchema = paginationSchema.extend({
  filter: z.enum(["all", "users", "tags"]).default("all"),
});

export const popularDecksQuerySchema = paginationSchema.extend({
  period: z.enum(["week", "month", "all"]).default("month"),
});

export type FollowUserInput = z.infer<typeof followUserSchema>;
export type FollowTagInput = z.infer<typeof followTagSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
export type PopularDecksQueryInput = z.infer<typeof popularDecksQuerySchema>;
