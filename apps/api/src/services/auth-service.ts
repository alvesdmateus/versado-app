import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db";
import { users, refreshTokens } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/hash";
import { sign } from "../lib/jwt";
import { REFRESH_TOKEN_EXPIRY } from "@flashcard/auth";
import type { AuthResponse, PublicProfile } from "@flashcard/auth";
import { AppError } from "../middleware/error-handler";

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hashBuffer).toString("hex");
}

function toPublicProfile(
  user: typeof users.$inferSelect
): PublicProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
    createdAt: user.createdAt,
  };
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<{ auth: AuthResponse; refreshToken: string }> {
  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(password);

  const rows = await db
    .insert(users)
    .values({ email, passwordHash, displayName })
    .returning();
  const user = rows[0]!;

  const accessToken = sign({
    sub: user.id,
    email: user.email,
    tier: user.tier,
  });

  const refreshToken = crypto.randomUUID();
  const tokenHash = await hashToken(refreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
  });

  return {
    auth: { accessToken, user: toPublicProfile(user) },
    refreshToken,
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ auth: AuthResponse; refreshToken: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const accessToken = sign({
    sub: user.id,
    email: user.email,
    tier: user.tier,
  });

  const refreshToken = crypto.randomUUID();
  const tokenHash = await hashToken(refreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
  });

  return {
    auth: { accessToken, user: toPublicProfile(user) },
    refreshToken,
  };
}

export async function refresh(
  token: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenHash = await hashToken(token);

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt))
    )
    .limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, "Invalid or expired refresh token", "INVALID_REFRESH");
  }

  // Revoke old token (rotation)
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, stored.id));

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, stored.userId))
    .limit(1);

  if (!user) {
    throw new AppError(401, "User not found", "USER_NOT_FOUND");
  }

  // Issue new pair
  const accessToken = sign({
    sub: user.id,
    email: user.email,
    tier: user.tier,
  });

  const newRefreshToken = crypto.randomUUID();
  const newTokenHash = await hashToken(newRefreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function getUserProfile(
  userId: string
): Promise<PublicProfile | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ? toPublicProfile(user) : null;
}
