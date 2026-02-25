import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { env } from "./env";
import { errorHandler } from "./middleware/error-handler";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth.routes";
import { deckRoutes } from "./routes/decks.routes";
import { flashcardRoutes } from "./routes/flashcards.routes";
import { studyRoutes } from "./routes/study.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { profileRoutes } from "./routes/profile.routes";
import { marketplaceRoutes } from "./routes/marketplace.routes";
import { syncRoutes } from "./routes/sync.routes";
import { billingRoutes } from "./routes/billing.routes";
import { webhookRoutes } from "./routes/webhook.routes";
import { aiRoutes } from "./routes/ai.routes";
import { socialRoutes } from "./routes/social.routes";

export function createApp() {
  const app = new Hono();

  // Global middleware
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: env.WEB_URL,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    })
  );
  app.use("*", secureHeaders());
  app.onError(errorHandler);

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Public routes
  app.route("/auth", authRoutes);
  app.route("/webhooks", webhookRoutes);

  // Protected routes
  const api = new Hono();
  api.use("*", rateLimitMiddleware(100, 60_000));
  api.use("*", authMiddleware());
  api.use(
    "*",
    rateLimitMiddleware({
      maxRequests: 200,
      windowMs: 60_000,
      keyExtractor: (c) => `user:${c.get("user").id}`,
    })
  );
  api.route("/decks", deckRoutes);
  api.route("/flashcards", flashcardRoutes);
  api.route("/study", studyRoutes);
  api.route("/dashboard", dashboardRoutes);
  api.route("/profile", profileRoutes);
  api.route("/marketplace", marketplaceRoutes);
  api.route("/sync", syncRoutes);
  api.route("/billing", billingRoutes);
  api.route("/ai", aiRoutes);
  api.route("/social", socialRoutes);

  app.route("/api", api);

  return app;
}
