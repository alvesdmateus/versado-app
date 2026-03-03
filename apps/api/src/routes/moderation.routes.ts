import { Hono } from "hono";
import { createReportSchema } from "@versado/validation";
import { db } from "../db";
import { reports } from "../db/schema";
import { validate } from "../lib/validate";
import { AppError } from "../middleware/error-handler";
import { rateLimitMiddleware } from "../middleware/rate-limit";

export const moderationRoutes = new Hono();

// Submit a report
moderationRoutes.post(
  "/reports",
  rateLimitMiddleware({
    maxRequests: 5,
    windowMs: 60_000,
    keyExtractor: (c) => `reports:${c.get("user").id}`,
  }),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const { targetType, targetId, reason, details } = validate(
      createReportSchema,
      body
    );

    if (targetType === "user" && targetId === user.id) {
      throw new AppError(400, "Cannot report yourself", "SELF_REPORT");
    }

    await db.insert(reports).values({
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      details: details ?? null,
    });

    return c.json({ success: true }, 201);
  }
);
