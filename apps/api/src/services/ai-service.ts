import { eq } from "drizzle-orm";
import type { UserTier } from "@flashcard/core/entities";
import { openai } from "../lib/openai";
import { db } from "../db";
import { users } from "../db/schema";
import { TIER_LIMITS } from "../lib/feature-gates";
import { AppError } from "../middleware/error-handler";

interface GeneratedCard {
  front: string;
  back: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

export async function generateFlashcards(
  prompt: string,
  count: number
): Promise<GeneratedCard[]> {
  let response;
  try {
    response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a flashcard generator. Given a topic, create high-quality flashcards for studying.

Return a JSON object with this exact structure:
{
  "cards": [
    {
      "front": "Question or term",
      "back": "Answer or definition",
      "tags": ["tag1", "tag2"],
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Rules:
- Create exactly ${count} cards
- Front should be a clear question or term
- Back should be a concise, accurate answer
- Tags should be 1-3 relevant topic keywords
- Difficulty should reflect the complexity of the concept
- Vary difficulty across cards when appropriate
- Keep answers focused and memorable`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 401) {
      throw new AppError(503, "AI service is not configured. Please set a valid OpenAI API key.", "AI_SERVICE_UNAVAILABLE");
    }
    if (err.status === 429) {
      throw new AppError(429, "AI rate limit exceeded. Please try again later.", "AI_RATE_LIMITED");
    }
    throw new AppError(503, "AI service is temporarily unavailable. Please try again later.", "AI_SERVICE_UNAVAILABLE");
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new AppError(500, "Failed to generate flashcards", "AI_GENERATION_FAILED");
  }

  const parsed = JSON.parse(content) as { cards: GeneratedCard[] };
  if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    throw new AppError(500, "AI returned invalid response", "AI_GENERATION_FAILED");
  }

  return parsed.cards.slice(0, count);
}

export async function checkAIUsage(userId: string, tier: UserTier) {
  const limits = TIER_LIMITS[tier];
  if (limits.aiGenerationLimit === Infinity) return;

  const result = await db
    .select({ aiGenerationsUsed: users.aiGenerationsUsed })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const used = result[0]?.aiGenerationsUsed ?? 0;
  if (used >= limits.aiGenerationLimit) {
    throw new AppError(
      403,
      `Free plan is limited to ${limits.aiGenerationLimit} AI generations. Upgrade to Premium for unlimited generations.`,
      "AI_LIMIT_REACHED"
    );
  }
}

export async function incrementAIUsage(userId: string) {
  const result = await db
    .select({ aiGenerationsUsed: users.aiGenerationsUsed })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const current = result[0]?.aiGenerationsUsed ?? 0;
  await db
    .update(users)
    .set({ aiGenerationsUsed: current + 1 })
    .where(eq(users.id, userId));
}

export async function getAIUsage(userId: string, tier: UserTier) {
  const limits = TIER_LIMITS[tier];
  const result = await db
    .select({ aiGenerationsUsed: users.aiGenerationsUsed })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    used: result[0]?.aiGenerationsUsed ?? 0,
    limit: limits.aiGenerationLimit,
  };
}
