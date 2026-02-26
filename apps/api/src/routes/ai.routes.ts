import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { generateFlashcardsSchema } from "@versado/validation";
import { db } from "../db";
import { decks } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { validate } from "../lib/validate";
import {
  generateFlashcards,
  checkAIUsage,
  incrementAIUsage,
  getAIUsage,
} from "../services/ai-service";

export const aiRoutes = new Hono();

// Stricter rate limit for AI generation: 10 requests per minute per user
aiRoutes.use(
  "/generate",
  rateLimitMiddleware({
    maxRequests: 10,
    windowMs: 60_000,
    keyExtractor: (c) => `ai:${c.get("user").id}`,
  })
);

// Generate flashcards from prompt (preview only, not saved)
aiRoutes.post("/generate", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = validate(generateFlashcardsSchema, body);

  // Verify deck ownership
  const deckResults = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, data.deckId), eq(decks.tombstone, false)))
    .limit(1);
  const deck = deckResults[0];

  if (!deck) {
    throw new AppError(404, "Deck not found", "NOT_FOUND");
  }
  if (deck.ownerId !== user.id) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  // Check usage limit
  await checkAIUsage(user.id, user.tier);

  // Generate cards
  const cards = await generateFlashcards(data.prompt, data.count ?? 10);

  // Increment usage counter
  await incrementAIUsage(user.id);

  return c.json({ cards });
});

// Get AI generation usage
aiRoutes.get("/usage", async (c) => {
  const user = c.get("user");
  const usage = await getAIUsage(user.id, user.tier);
  return c.json(usage);
});
