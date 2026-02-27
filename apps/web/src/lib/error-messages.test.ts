import { describe, test, expect } from "bun:test";
import { getErrorInfo, getErrorInfoFromError } from "./error-messages";
import { ApiError } from "./api-client";

// Mock t function that returns the key path — simulates i18next returning the translation
// For testing, we use the English strings directly via a simple lookup
const translations: Record<string, string> = {
  "codes.aiLimitReached.title": "AI Limit Reached",
  "codes.aiLimitReached.description": "You've reached your AI generation limit. Go Fluent for unlimited generations.",
  "codes.tierLimit.title": "Plan Limit Reached",
  "codes.tierLimit.description": "You've reached a limit on your current plan. Go Fluent for more.",
  "codes.reviewLimitReached.title": "Daily Review Limit",
  "codes.reviewLimitReached.description": "You've reached your daily review limit. Go Fluent for unlimited reviews.",
  "codes.deckLimitReached.title": "Deck Limit Reached",
  "codes.deckLimitReached.description": "You've reached the maximum number of decks on your plan. Go Fluent for unlimited decks.",
  "codes.cardLimitReached.title": "Card Limit Reached",
  "codes.cardLimitReached.description": "You've reached the maximum number of cards per deck. Go Fluent for unlimited cards.",
  "codes.accountLocked.title": "Account Locked",
  "codes.accountLocked.description": "Too many failed login attempts. Please try again later.",
  "codes.aiServiceUnavailable.title": "AI Unavailable",
  "codes.aiServiceUnavailable.description": "The AI service is temporarily unavailable. Please try again in a few minutes.",
  "codes.aiRateLimited.title": "AI Service Busy",
  "codes.aiRateLimited.description": "The AI service is currently overloaded. Please wait a moment and try again.",
  "statuses.network.title": "Connection Failed",
  "statuses.network.description": "Unable to reach the server. Check your internet connection and try again.",
  "statuses.unauthorized.title": "Session Expired",
  "statuses.unauthorized.description": "Your session has expired. Please sign in again.",
  "statuses.forbidden.title": "Access Denied",
  "statuses.forbidden.description": "You don't have permission to perform this action.",
  "statuses.tooManyRequests.title": "Too Many Requests",
  "statuses.tooManyRequests.description": "You're making requests too quickly. Please wait a moment and try again.",
  "statuses.serverError.title": "Server Error",
  "statuses.serverError.description": "Something went wrong on our end. Please try again later.",
  "statuses.serviceUnavailable.title": "Service Unavailable",
  "statuses.serviceUnavailable.description": "The service is temporarily unavailable. Please try again in a few minutes.",
  "default.title": "Something Went Wrong",
  "default.description": "An unexpected error occurred. Please try again.",
};

const t = ((key: string) => translations[key] ?? key) as unknown as import("i18next").TFunction;

describe("getErrorInfo", () => {
  describe("code-based mapping", () => {
    test("AI_LIMIT_REACHED returns correct info", () => {
      const info = getErrorInfo(t, 403, "AI_LIMIT_REACHED");
      expect(info.title).toBe("AI Limit Reached");
      expect(info.description).toContain("AI generation limit");
      expect(info.errorCode).toBe("ERROR: 403_AI_LIMIT_REACHED");
    });

    test("REVIEW_LIMIT_REACHED returns correct info", () => {
      const info = getErrorInfo(t, 403, "REVIEW_LIMIT_REACHED");
      expect(info.title).toBe("Daily Review Limit");
      expect(info.description).toContain("daily review limit");
    });

    test("TIER_LIMIT returns correct info", () => {
      const info = getErrorInfo(t, 403, "TIER_LIMIT");
      expect(info.title).toBe("Plan Limit Reached");
    });

    test("AI_SERVICE_UNAVAILABLE returns correct info", () => {
      const info = getErrorInfo(t, 503, "AI_SERVICE_UNAVAILABLE");
      expect(info.title).toBe("AI Unavailable");
    });

    test("AI_RATE_LIMITED returns correct info", () => {
      const info = getErrorInfo(t, 503, "AI_RATE_LIMITED");
      expect(info.title).toBe("AI Service Busy");
    });
  });

  describe("status-based fallback", () => {
    test("status 0 returns connection failed", () => {
      const info = getErrorInfo(t, 0);
      expect(info.title).toBe("Connection Failed");
      expect(info.errorCode).toBe("ERROR: NETWORK_FAILURE");
    });

    test("status 401 returns session expired", () => {
      const info = getErrorInfo(t, 401);
      expect(info.title).toBe("Session Expired");
    });

    test("status 403 returns access denied", () => {
      const info = getErrorInfo(t, 403);
      expect(info.title).toBe("Access Denied");
    });

    test("status 429 returns too many requests", () => {
      const info = getErrorInfo(t, 429);
      expect(info.title).toBe("Too Many Requests");
    });

    test("status 500 returns server error", () => {
      const info = getErrorInfo(t, 500);
      expect(info.title).toBe("Server Error");
    });

    test("status 503 returns service unavailable", () => {
      const info = getErrorInfo(t, 503);
      expect(info.title).toBe("Service Unavailable");
    });
  });

  describe("generic fallback", () => {
    test("unknown status returns generic error", () => {
      const info = getErrorInfo(t, 418);
      expect(info.title).toBe("Something Went Wrong");
      expect(info.errorCode).toBe("ERROR: 418");
    });
  });

  describe("error code format", () => {
    test("includes code in error code when present", () => {
      const info = getErrorInfo(t, 403, "CUSTOM_CODE");
      expect(info.errorCode).toBe("ERROR: 403_CUSTOM_CODE");
    });

    test("uses only status when no code", () => {
      const info = getErrorInfo(t, 500);
      expect(info.errorCode).toBe("ERROR: 500");
    });
  });
});

describe("getErrorInfoFromError", () => {
  test("handles ApiError correctly", () => {
    const error = new ApiError(403, "Limit reached", "AI_LIMIT_REACHED");
    const info = getErrorInfoFromError(t, error);
    expect(info.title).toBe("AI Limit Reached");
  });

  test("handles unknown error", () => {
    const info = getErrorInfoFromError(t, new Error("random"));
    expect(info.title).toBe("Something Went Wrong");
    expect(info.errorCode).toBe("ERROR: UNKNOWN");
  });

  test("handles non-Error objects", () => {
    const info = getErrorInfoFromError(t, "string error");
    expect(info.title).toBe("Something Went Wrong");
  });
});
