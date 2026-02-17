import { z } from "zod";

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const sortDirectionSchema = z.enum(["asc", "desc"]).default("desc");

export const tagsSchema = z
  .array(z.string().min(1).max(50).trim())
  .max(20)
  .default([]);
