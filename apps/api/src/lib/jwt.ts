import jwt from "jsonwebtoken";
import type { TokenPayload } from "@flashcard/auth";
import { ACCESS_TOKEN_EXPIRY } from "@flashcard/auth";
import { env } from "../env";

export function sign(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function verify(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
