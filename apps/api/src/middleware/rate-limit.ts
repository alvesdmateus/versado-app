import type { Context, Next } from "hono";

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  keyExtractor?: (c: Context) => string;
}

const windows = new Map<string, RateLimitWindow>();

// --- Account Lockout ---

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null;
}

const lockouts = new Map<string, LockoutEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function isAccountLocked(email: string): { locked: boolean; retryAfterSeconds?: number } {
  const entry = lockouts.get(email.toLowerCase());
  if (!entry?.lockedUntil) return { locked: false };
  const now = Date.now();
  if (entry.lockedUntil < now) {
    lockouts.delete(email.toLowerCase());
    return { locked: false };
  }
  return {
    locked: true,
    retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
  };
}

export function recordFailedLogin(email: string): void {
  const key = email.toLowerCase();
  const entry = lockouts.get(key) ?? { failedAttempts: 0, lockedUntil: null };
  entry.failedAttempts += 1;
  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  lockouts.set(key, entry);
}

export function clearFailedLogins(email: string): void {
  lockouts.delete(email.toLowerCase());
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of windows) {
    if (window.resetAt < now) {
      windows.delete(key);
    }
  }
  for (const [key, entry] of lockouts) {
    if (entry.lockedUntil && entry.lockedUntil < now) {
      lockouts.delete(key);
    }
  }
}, 60_000);

function getIp(c: Context): string {
  return c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
}

export function rateLimitMiddleware(
  optionsOrMax: RateLimitOptions | number = 100,
  windowMsParam?: number
) {
  const options: RateLimitOptions =
    typeof optionsOrMax === "number"
      ? { maxRequests: optionsOrMax, windowMs: windowMsParam }
      : optionsOrMax;

  const maxRequests = options.maxRequests ?? 100;
  const windowMs = options.windowMs ?? 60_000;
  const keyExtractor = options.keyExtractor;

  return async (c: Context, next: Next) => {
    const key = keyExtractor ? keyExtractor(c) : getIp(c);
    const now = Date.now();
    const window = windows.get(key);

    if (!window || window.resetAt < now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
    } else if (window.count >= maxRequests) {
      const retryAfter = Math.ceil((window.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(Math.ceil(window.resetAt / 1000)));
      return c.json({ error: "Too many requests" }, 429);
    } else {
      window.count++;
    }

    await next();

    // Set rate limit headers on successful responses
    const current = windows.get(key);
    if (current) {
      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", String(Math.max(0, maxRequests - current.count)));
      c.header("X-RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));
    }
  };
}
