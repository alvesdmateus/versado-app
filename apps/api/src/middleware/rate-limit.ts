import type { Context, Next } from "hono";

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const windows = new Map<string, RateLimitWindow>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of windows) {
    if (window.resetAt < now) {
      windows.delete(key);
    }
  }
}, 60_000);

export function rateLimitMiddleware(maxRequests = 100, windowMs = 60_000) {
  return async (c: Context, next: Next) => {
    const key =
      c.req.header("x-forwarded-for") ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    const window = windows.get(key);

    if (!window || window.resetAt < now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
    } else if (window.count >= maxRequests) {
      c.header("Retry-After", String(Math.ceil((window.resetAt - now) / 1000)));
      return c.json({ error: "Too many requests" }, 429);
    } else {
      window.count++;
    }

    await next();
  };
}
