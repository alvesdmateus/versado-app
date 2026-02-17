/** Access token lifetime in seconds (15 minutes) */
export const ACCESS_TOKEN_EXPIRY = 15 * 60;

/** Refresh token lifetime in seconds (7 days) */
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

/** bcrypt cost factor */
export const BCRYPT_ROUNDS = 12;

/** Cookie name for the refresh token */
export const REFRESH_TOKEN_COOKIE = "flashcard_refresh_token";

/** Maximum failed login attempts before account lockout */
export const MAX_LOGIN_ATTEMPTS = 10;

/** Account lockout duration in seconds (15 minutes) */
export const LOCKOUT_DURATION = 15 * 60;
