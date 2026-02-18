import { describe, test, expect } from "bun:test";
import { getLimits, TIER_LIMITS, requireFeature, checkCardLimit } from "./feature-gates";
import { AppError } from "../middleware/error-handler";

// Note: checkDeckLimit is async and depends on DB, tested in integration tests.
// Here we test the synchronous, pure functions.

describe("TIER_LIMITS", () => {
  test("free tier has correct limits", () => {
    expect(TIER_LIMITS.free).toEqual({
      maxDecks: 5,
      maxCardsPerDeck: 100,
      dailyReviewLimit: 50,
      canUseAI: true,
      aiGenerationLimit: 10,
      canListPaidDecks: false,
      canUseOffline: false,
    });
  });

  test("fluent tier has unlimited limits", () => {
    expect(TIER_LIMITS.fluent).toEqual({
      maxDecks: Infinity,
      maxCardsPerDeck: Infinity,
      dailyReviewLimit: Infinity,
      canUseAI: true,
      aiGenerationLimit: Infinity,
      canListPaidDecks: true,
      canUseOffline: true,
    });
  });
});

describe("getLimits", () => {
  test("returns free tier limits", () => {
    const limits = getLimits("free");
    expect(limits.maxDecks).toBe(5);
    expect(limits.maxCardsPerDeck).toBe(100);
    expect(limits.dailyReviewLimit).toBe(50);
    expect(limits.aiGenerationLimit).toBe(10);
  });

  test("returns fluent tier limits", () => {
    const limits = getLimits("fluent");
    expect(limits.maxDecks).toBe(Infinity);
    expect(limits.maxCardsPerDeck).toBe(Infinity);
    expect(limits.dailyReviewLimit).toBe(Infinity);
    expect(limits.canListPaidDecks).toBe(true);
    expect(limits.canUseOffline).toBe(true);
  });
});

describe("requireFeature", () => {
  test("does not throw when fluent user accesses paid features", () => {
    expect(() => requireFeature("fluent", "canListPaidDecks")).not.toThrow();
    expect(() => requireFeature("fluent", "canUseOffline")).not.toThrow();
    expect(() => requireFeature("fluent", "canUseAI")).not.toThrow();
  });

  test("throws for free user accessing canListPaidDecks", () => {
    expect(() => requireFeature("free", "canListPaidDecks")).toThrow(AppError);
    try {
      requireFeature("free", "canListPaidDecks");
    } catch (e) {
      expect((e as AppError).statusCode).toBe(403);
      expect((e as AppError).code).toBe("FLUENT_REQUIRED");
    }
  });

  test("throws for free user accessing canUseOffline", () => {
    expect(() => requireFeature("free", "canUseOffline")).toThrow(AppError);
  });

  test("does not throw for free user accessing canUseAI", () => {
    // AI is available for free tier (with limits)
    expect(() => requireFeature("free", "canUseAI")).not.toThrow();
  });
});

describe("checkCardLimit", () => {
  test("does not throw for fluent tier", () => {
    expect(() => checkCardLimit("fluent", 99999)).not.toThrow();
  });

  test("does not throw when below limit", () => {
    expect(() => checkCardLimit("free", 99)).not.toThrow();
  });

  test("throws at exact limit (100 cards)", () => {
    expect(() => checkCardLimit("free", 100)).toThrow(AppError);
    try {
      checkCardLimit("free", 100);
    } catch (e) {
      expect((e as AppError).statusCode).toBe(403);
      expect((e as AppError).code).toBe("CARD_LIMIT_REACHED");
    }
  });

  test("throws above limit", () => {
    expect(() => checkCardLimit("free", 150)).toThrow(AppError);
  });

  test("does not throw at count 99 (one below limit)", () => {
    expect(() => checkCardLimit("free", 99)).not.toThrow();
  });
});
