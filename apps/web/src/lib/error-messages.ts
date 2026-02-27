import type { TFunction } from "i18next";
import { ApiError } from "./api-client";

export interface ErrorInfo {
  title: string;
  description: string;
  errorCode: string;
}

const CODE_KEY_MAP: Record<string, string> = {
  AI_LIMIT_REACHED: "codes.aiLimitReached",
  TIER_LIMIT: "codes.tierLimit",
  REVIEW_LIMIT_REACHED: "codes.reviewLimitReached",
  DECK_LIMIT_REACHED: "codes.deckLimitReached",
  CARD_LIMIT_REACHED: "codes.cardLimitReached",
  ACCOUNT_LOCKED: "codes.accountLocked",
  AI_SERVICE_UNAVAILABLE: "codes.aiServiceUnavailable",
  AI_RATE_LIMITED: "codes.aiRateLimited",
};

const STATUS_KEY_MAP: Record<number, string> = {
  0: "statuses.network",
  401: "statuses.unauthorized",
  403: "statuses.forbidden",
  429: "statuses.tooManyRequests",
  500: "statuses.serverError",
  503: "statuses.serviceUnavailable",
};

function buildErrorCode(status: number, code?: string): string {
  if (status === 0) return "ERROR: NETWORK_FAILURE";
  return code ? `ERROR: ${status}_${code}` : `ERROR: ${status}`;
}

export function getErrorInfo(
  t: TFunction,
  status: number,
  code?: string,
  _message?: string
): ErrorInfo {
  const errorCode = buildErrorCode(status, code);

  // Check code-specific mapping first
  if (code && CODE_KEY_MAP[code]) {
    const key = CODE_KEY_MAP[code];
    return { title: t(`${key}.title`), description: t(`${key}.description`), errorCode };
  }

  // Fall back to status-based mapping
  const statusKey = STATUS_KEY_MAP[status];
  if (statusKey) {
    return { title: t(`${statusKey}.title`), description: t(`${statusKey}.description`), errorCode };
  }

  // Generic fallback
  return { title: t("default.title"), description: t("default.description"), errorCode };
}

export function getErrorInfoFromError(t: TFunction, error: unknown): ErrorInfo {
  if (error instanceof ApiError) {
    return getErrorInfo(t, error.status, error.code, error.message);
  }
  return { title: t("default.title"), description: t("default.description"), errorCode: "ERROR: UNKNOWN" };
}
