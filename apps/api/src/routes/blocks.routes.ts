import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { idSchema } from "@versado/validation";
import { db } from "../db";
import { users, userBlocks } from "../db/schema";
import { validate } from "../lib/validate";
import { AppError } from "../middleware/error-handler";
import { rateLimitMiddleware } from "../middleware/rate-limit";

export const blocksRoutes = new Hono();

blocksRoutes.use(
  "*",
  rateLimitMiddleware({
    maxRequests: 20,
    windowMs: 60_000,
    keyExtractor: (c) => `blocks:${c.get("user").id}`,
  })
);

// Block a user
blocksRoutes.post("/:userId", async (c) => {
  const user = c.get("user");
  const targetId = validate(idSchema, c.req.param("userId"));

  if (targetId === user.id) {
    throw new AppError(400, "Cannot block yourself", "SELF_BLOCK");
  }

  // Verify target user exists
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);

  if (!target) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  await db
    .insert(userBlocks)
    .values({ blockerId: user.id, blockedUserId: targetId })
    .onConflictDoNothing();

  return c.json({ success: true }, 201);
});

// Unblock a user
blocksRoutes.delete("/:userId", async (c) => {
  const user = c.get("user");
  const targetId = validate(idSchema, c.req.param("userId"));

  await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, user.id),
        eq(userBlocks.blockedUserId, targetId)
      )
    );

  return c.json({ success: true });
});

// List blocked user IDs
blocksRoutes.get("/", async (c) => {
  const user = c.get("user");

  const rows = await db
    .select({ blockedUserId: userBlocks.blockedUserId })
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, user.id));

  return c.json({
    blockedUserIds: rows.map((r) => r.blockedUserId),
  });
});
