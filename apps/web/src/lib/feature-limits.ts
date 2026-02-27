import type { UserTier } from "@versado/core/entities";

export interface TierLimits {
  maxDecks: number;
  maxCardsPerDeck: number;
  dailyReviewLimit: number;
  canUseAI: boolean;
  aiGenerationLimit: number;
  canListPaidDecks: boolean;
  canUseOffline: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxDecks: 5,
    maxCardsPerDeck: 100,
    dailyReviewLimit: 50,
    canUseAI: true,
    aiGenerationLimit: 5,
    canListPaidDecks: false,
    canUseOffline: false,
  },
  fluent: {
    maxDecks: Infinity,
    maxCardsPerDeck: Infinity,
    dailyReviewLimit: Infinity,
    canUseAI: true,
    aiGenerationLimit: Infinity,
    canListPaidDecks: true,
    canUseOffline: true,
  },
};

export function getTierLimits(tier: UserTier) {
  return TIER_LIMITS[tier];
}
