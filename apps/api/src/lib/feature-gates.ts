import type { UserTier } from "@flashcard/core/entities";
import { sql, eq, and } from "drizzle-orm";
import { db } from "../db";
import { decks } from "../db/schema";
import { AppError } from "../middleware/error-handler";

export interface TierLimits {
  maxDecks: number;
  maxCardsPerDeck: number;
  canUseAI: boolean;
  aiGenerationLimit: number;
  canListPaidDecks: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxDecks: 5,
    maxCardsPerDeck: 100,
    canUseAI: true,
    aiGenerationLimit: 10,
    canListPaidDecks: false,
  },
  premium: {
    maxDecks: Infinity,
    maxCardsPerDeck: Infinity,
    canUseAI: true,
    aiGenerationLimit: Infinity,
    canListPaidDecks: true,
  },
  team: {
    maxDecks: Infinity,
    maxCardsPerDeck: Infinity,
    canUseAI: true,
    aiGenerationLimit: Infinity,
    canListPaidDecks: true,
  },
};

export function getLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function requireFeature(
  tier: UserTier,
  feature: keyof Pick<TierLimits, "canUseAI" | "canListPaidDecks">
) {
  const limits = getLimits(tier);
  if (!limits[feature]) {
    throw new AppError(
      403,
      "This feature requires a premium subscription",
      "PREMIUM_REQUIRED"
    );
  }
}

export async function checkDeckLimit(userId: string, tier: UserTier) {
  const limits = getLimits(tier);
  if (limits.maxDecks === Infinity) return;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(decks)
    .where(and(eq(decks.ownerId, userId), eq(decks.tombstone, false)));

  if ((result?.count ?? 0) >= limits.maxDecks) {
    throw new AppError(
      403,
      `Free plan is limited to ${limits.maxDecks} decks. Upgrade to Premium for unlimited decks.`,
      "DECK_LIMIT_REACHED"
    );
  }
}

export function checkCardLimit(tier: UserTier, currentCount: number) {
  const limits = getLimits(tier);
  if (limits.maxCardsPerDeck === Infinity) return;

  if (currentCount >= limits.maxCardsPerDeck) {
    throw new AppError(
      403,
      `Free plan is limited to ${limits.maxCardsPerDeck} cards per deck. Upgrade to Premium for unlimited cards.`,
      "CARD_LIMIT_REACHED"
    );
  }
}
