import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { pushSubscriptions } from "../db/schema";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushRoutes = new Hono();

// Subscribe — save push subscription for authenticated user
pushRoutes.post("/subscribe", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid subscription", details: parsed.error.issues }, 400);
  }

  const { endpoint, keys } = parsed.data;

  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

  return c.json({ success: true });
});

// Unsubscribe — remove push subscription by endpoint
pushRoutes.delete("/subscribe", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { endpoint } = body;

  if (endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );
  }

  return c.json({ success: true });
});
