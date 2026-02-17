import type { UserTier } from "@flashcard/core/entities";

export const TIER_LIMITS: Record<
  UserTier,
  {
    maxDecks: number;
    maxCardsPerDeck: number;
    canUseAI: boolean;
    aiGenerationLimit: number;
  }
> = {
  free: { maxDecks: 5, maxCardsPerDeck: 100, canUseAI: true, aiGenerationLimit: 10 },
  premium: { maxDecks: Infinity, maxCardsPerDeck: Infinity, canUseAI: true, aiGenerationLimit: Infinity },
  team: { maxDecks: Infinity, maxCardsPerDeck: Infinity, canUseAI: true, aiGenerationLimit: Infinity },
};

export function getTierLimits(tier: UserTier) {
  return TIER_LIMITS[tier];
}
