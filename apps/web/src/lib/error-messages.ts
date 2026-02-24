import { ApiError } from "./api-client";

export interface ErrorInfo {
  title: string;
  description: string;
  errorCode: string;
}

const CODE_MAP: Record<string, { title: string; description: string }> = {
  // 403 specific codes
  AI_LIMIT_REACHED: {
    title: "AI Limit Reached",
    description:
      "You've reached your AI generation limit. Go Fluent for unlimited generations.",
  },
  TIER_LIMIT: {
    title: "Plan Limit Reached",
    description:
      "You've reached a limit on your current plan. Go Fluent for more.",
  },
  REVIEW_LIMIT_REACHED: {
    title: "Daily Review Limit",
    description:
      "You've reached your daily review limit. Go Fluent for unlimited reviews.",
  },
  DECK_LIMIT_REACHED: {
    title: "Deck Limit Reached",
    description:
      "You've reached the maximum number of decks on your plan. Go Fluent for unlimited decks.",
  },
  CARD_LIMIT_REACHED: {
    title: "Card Limit Reached",
    description:
      "You've reached the maximum number of cards per deck. Go Fluent for unlimited cards.",
  },
  ACCOUNT_LOCKED: {
    title: "Account Locked",
    description:
      "Too many failed login attempts. Please try again later.",
  },
  // 503 specific codes
  AI_SERVICE_UNAVAILABLE: {
    title: "AI Unavailable",
    description:
      "The AI service is temporarily unavailable. Please try again in a few minutes.",
  },
  AI_RATE_LIMITED: {
    title: "AI Service Busy",
    description:
      "The AI service is currently overloaded. Please wait a moment and try again.",
  },
};

const STATUS_MAP: Record<number, { title: string; description: string }> = {
  0: {
    title: "Connection Failed",
    description:
      "Unable to reach the server. Check your internet connection and try again.",
  },
  401: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again.",
  },
  403: {
    title: "Access Denied",
    description: "You don't have permission to perform this action.",
  },
  429: {
    title: "Too Many Requests",
    description:
      "You're making requests too quickly. Please wait a moment and try again.",
  },
  500: {
    title: "Server Error",
    description: "Something went wrong on our end. Please try again later.",
  },
  503: {
    title: "Service Unavailable",
    description:
      "The service is temporarily unavailable. Please try again in a few minutes.",
  },
};

const DEFAULT_INFO = {
  title: "Something Went Wrong",
  description: "An unexpected error occurred. Please try again.",
};

function buildErrorCode(status: number, code?: string): string {
  if (status === 0) return "ERROR: NETWORK_FAILURE";
  return code ? `ERROR: ${status}_${code}` : `ERROR: ${status}`;
}

export function getErrorInfo(
  status: number,
  code?: string,
  _message?: string
): ErrorInfo {
  // Check code-specific mapping first
  if (code && CODE_MAP[code]) {
    return { ...CODE_MAP[code], errorCode: buildErrorCode(status, code) };
  }

  // Fall back to status-based mapping
  const statusInfo = STATUS_MAP[status];
  if (statusInfo) {
    return { ...statusInfo, errorCode: buildErrorCode(status, code) };
  }

  // Generic fallback
  return { ...DEFAULT_INFO, errorCode: buildErrorCode(status, code) };
}

export function getErrorInfoFromError(error: unknown): ErrorInfo {
  if (error instanceof ApiError) {
    return getErrorInfo(error.status, error.code, error.message);
  }
  return { ...DEFAULT_INFO, errorCode: "ERROR: UNKNOWN" };
}
