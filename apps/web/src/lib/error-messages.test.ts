import { describe, test, expect } from "bun:test";
import { getErrorInfo, getErrorInfoFromError } from "./error-messages";
import { ApiError } from "./api-client";

describe("getErrorInfo", () => {
  describe("code-based mapping", () => {
    test("AI_LIMIT_REACHED returns correct info", () => {
      const info = getErrorInfo(403, "AI_LIMIT_REACHED");
      expect(info.title).toBe("AI Limit Reached");
      expect(info.description).toContain("AI generation limit");
      expect(info.errorCode).toBe("ERROR: 403_AI_LIMIT_REACHED");
    });

    test("REVIEW_LIMIT_REACHED returns correct info", () => {
      const info = getErrorInfo(403, "REVIEW_LIMIT_REACHED");
      expect(info.title).toBe("Daily Review Limit");
      expect(info.description).toContain("daily review limit");
    });

    test("TIER_LIMIT returns correct info", () => {
      const info = getErrorInfo(403, "TIER_LIMIT");
      expect(info.title).toBe("Plan Limit Reached");
    });

    test("AI_SERVICE_UNAVAILABLE returns correct info", () => {
      const info = getErrorInfo(503, "AI_SERVICE_UNAVAILABLE");
      expect(info.title).toBe("AI Unavailable");
    });

    test("AI_RATE_LIMITED returns correct info", () => {
      const info = getErrorInfo(503, "AI_RATE_LIMITED");
      expect(info.title).toBe("AI Service Busy");
    });
  });

  describe("status-based fallback", () => {
    test("status 0 returns connection failed", () => {
      const info = getErrorInfo(0);
      expect(info.title).toBe("Connection Failed");
      expect(info.errorCode).toBe("ERROR: NETWORK_FAILURE");
    });

    test("status 401 returns session expired", () => {
      const info = getErrorInfo(401);
      expect(info.title).toBe("Session Expired");
    });

    test("status 403 returns access denied", () => {
      const info = getErrorInfo(403);
      expect(info.title).toBe("Access Denied");
    });

    test("status 429 returns too many requests", () => {
      const info = getErrorInfo(429);
      expect(info.title).toBe("Too Many Requests");
    });

    test("status 500 returns server error", () => {
      const info = getErrorInfo(500);
      expect(info.title).toBe("Server Error");
    });

    test("status 503 returns service unavailable", () => {
      const info = getErrorInfo(503);
      expect(info.title).toBe("Service Unavailable");
    });
  });

  describe("generic fallback", () => {
    test("unknown status returns generic error", () => {
      const info = getErrorInfo(418);
      expect(info.title).toBe("Something Went Wrong");
      expect(info.errorCode).toBe("ERROR: 418");
    });
  });

  describe("error code format", () => {
    test("includes code in error code when present", () => {
      const info = getErrorInfo(403, "CUSTOM_CODE");
      expect(info.errorCode).toBe("ERROR: 403_CUSTOM_CODE");
    });

    test("uses only status when no code", () => {
      const info = getErrorInfo(500);
      expect(info.errorCode).toBe("ERROR: 500");
    });
  });
});

describe("getErrorInfoFromError", () => {
  test("handles ApiError correctly", () => {
    const error = new ApiError(403, "Limit reached", "AI_LIMIT_REACHED");
    const info = getErrorInfoFromError(error);
    expect(info.title).toBe("AI Limit Reached");
  });

  test("handles unknown error", () => {
    const info = getErrorInfoFromError(new Error("random"));
    expect(info.title).toBe("Something Went Wrong");
    expect(info.errorCode).toBe("ERROR: UNKNOWN");
  });

  test("handles non-Error objects", () => {
    const info = getErrorInfoFromError("string error");
    expect(info.title).toBe("Something Went Wrong");
  });
});
