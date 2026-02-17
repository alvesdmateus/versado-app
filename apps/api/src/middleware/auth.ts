import type { Context, Next } from "hono";
import { verify } from "../lib/jwt";
import type { AuthUser } from "@flashcard/auth";

// Extend Hono context to include auth user
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid authorization header" }, 401);
    }

    const token = header.slice(7);
    const payload = verify(token);
    if (!payload) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    c.set("user", {
      id: payload.sub,
      email: payload.email,
      tier: payload.tier,
    });

    await next();
  };
}
