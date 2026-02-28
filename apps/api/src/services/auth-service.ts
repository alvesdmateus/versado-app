import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  refreshTokens,
  passwordResetTokens,
  emailVerificationTokens,
} from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/hash";
import { sign } from "../lib/jwt";
import { REFRESH_TOKEN_EXPIRY } from "@versado/auth";
import type { AuthResponse, PublicProfile } from "@versado/auth";
import { AppError } from "../middleware/error-handler";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../lib/email";

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
    emailVerified: user.emailVerified,
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
    .values({ email, passwordHash, displayName, acceptedTermsAt: new Date() })
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

  // Send verification email (fire-and-forget)
  const verificationToken = crypto.randomUUID();
  const verificationHash = await hashToken(verificationToken);
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    tokenHash: verificationHash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  sendVerificationEmail(user.email, verificationToken).catch(console.error);

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

  if (!user.passwordHash) {
    throw new AppError(
      401,
      "This account uses Google Sign-In. Please sign in with Google.",
      "OAUTH_ONLY_ACCOUNT"
    );
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

export async function forgotPassword(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Silent return to prevent email enumeration
  if (!user) return;

  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  await sendPasswordResetEmail(email, token);
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const tokenHash = await hashToken(token);

  const [stored] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!stored) {
    throw new AppError(
      400,
      "Invalid or expired reset token",
      "INVALID_RESET_TOKEN"
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, stored.userId));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, stored.id));

    // Revoke all refresh tokens for security
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, stored.userId),
          isNull(refreshTokens.revokedAt)
        )
      );
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = await hashToken(token);

  const [stored] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!stored) {
    throw new AppError(
      400,
      "Invalid or expired verification token",
      "INVALID_VERIFICATION_TOKEN"
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, stored.userId));

    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, stored.id));
  });
}

export async function resendVerificationEmail(
  email: string
): Promise<void> {
  const [user] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Silent return to prevent enumeration
  if (!user || user.emailVerified) return;

  // Invalidate existing tokens
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailVerificationTokens.userId, user.id),
        isNull(emailVerificationTokens.usedAt)
      )
    );

  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await sendVerificationEmail(email, token);
}

export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  displayName: string,
  avatarUrl: string | null
): Promise<{ auth: AuthResponse; refreshToken: string }> {
  // 1. Look up by googleId (returning user)
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  if (!user) {
    // 2. Look up by email to link an existing email/password account
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      const updated = await db
        .update(users)
        .set({
          googleId,
          avatarUrl: existing.avatarUrl ?? avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      user = updated[0]!;
    }
  }

  if (!user) {
    // 3. Create new Google-only user
    const created = await db
      .insert(users)
      .values({
        email,
        passwordHash: null,
        googleId,
        displayName,
        avatarUrl,
        emailVerified: true,
        acceptedTermsAt: new Date(),
      })
      .returning();
    user = created[0]!;
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
