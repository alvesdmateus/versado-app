import { Hono } from "hono";
import { eq } from "drizzle-orm";
import {
  updateProfileSchema,
  changePasswordSchema,
  updatePreferencesSchema,
} from "@flashcard/validation";
import { db } from "../db";
import { users } from "../db/schema";
import { AppError } from "../middleware/error-handler";
import { hashPassword, verifyPassword } from "../lib/hash";
import { validate } from "../lib/validate";

export const profileRoutes = new Hono();

// Update profile (display name, avatar)
profileRoutes.patch("/", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json();
  const data = validate(updateProfileSchema, body);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

  const rows = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, authUser.id))
    .returning();

  const user = rows[0]!;
  return c.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
    createdAt: user.createdAt,
  });
});

// Change password
profileRoutes.post("/change-password", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json();
  const data = validate(changePasswordSchema, body);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const valid = await verifyPassword(data.currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(400, "Current password is incorrect", "INVALID_PASSWORD");
  }

  const newHash = await hashPassword(data.newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, authUser.id));

  return c.json({ success: true });
});

// Get preferences
profileRoutes.get("/preferences", async (c) => {
  const authUser = c.get("user");

  const [user] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  return c.json(user.preferences);
});

// Update preferences (partial merge)
profileRoutes.patch("/preferences", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json();
  const data = validate(updatePreferencesSchema, body);

  const [existing] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const merged = { ...existing.preferences, ...data };

  const rows = await db
    .update(users)
    .set({ preferences: merged, updatedAt: new Date() })
    .where(eq(users.id, authUser.id))
    .returning({ preferences: users.preferences });

  return c.json(rows[0]!.preferences);
});
