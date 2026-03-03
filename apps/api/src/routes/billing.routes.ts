import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createCheckoutSchema } from "@versado/validation";
import * as billingService from "../services/billing-service";
import { validate } from "../lib/validate";
import { AppError } from "../middleware/error-handler";
import { db } from "../db";
import { users } from "../db/schema";

export const billingRoutes = new Hono();

// Get available prices for the Fluent product
billingRoutes.get("/prices", async (c) => {
  const prices = await billingService.getProductPrices();
  return c.json({ prices });
});

// Create Stripe Checkout session
billingRoutes.post("/checkout", async (c) => {
  const user = c.get("user");
  if (user.tier === "fluent") {
    throw new AppError(400, "Already on Fluent plan", "ALREADY_FLUENT");
  }

  const body = await c.req.json();
  const { priceId, couponId } = validate(createCheckoutSchema, body);
  const url = await billingService.createCheckoutSession(
    user.id,
    user.email,
    priceId,
    couponId
  );
  return c.json({ url });
});

// Get current subscription
billingRoutes.get("/subscription", async (c) => {
  const user = c.get("user");
  const subscription = await billingService.getSubscription(user.id);
  return c.json({ subscription });
});

// Cancel subscription at period end
billingRoutes.post("/cancel", async (c) => {
  const user = c.get("user");
  const subscription = await billingService.getSubscription(user.id);
  if (!subscription) {
    throw new AppError(404, "No active subscription", "NO_SUBSCRIPTION");
  }
  await billingService.cancelSubscription(subscription.stripeSubscriptionId);
  return c.json({ success: true });
});

// Resume canceled subscription
billingRoutes.post("/resume", async (c) => {
  const user = c.get("user");
  const subscription = await billingService.getSubscription(user.id);
  if (!subscription) {
    throw new AppError(404, "No active subscription", "NO_SUBSCRIPTION");
  }
  await billingService.resumeSubscription(subscription.stripeSubscriptionId);
  return c.json({ success: true });
});

// Create Stripe Customer Portal session
billingRoutes.post("/portal", async (c) => {
  const user = c.get("user");
  const [dbUser] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser?.stripeCustomerId) {
    throw new AppError(400, "No billing account", "NO_BILLING_ACCOUNT");
  }

  const url = await billingService.createBillingPortalSession(
    dbUser.stripeCustomerId
  );
  return c.json({ url });
});
