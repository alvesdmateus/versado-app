import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { stripe } from "../lib/stripe";
import { env } from "../env";
import { db } from "../db";
import { users, subscriptions } from "../db/schema";
import type Stripe from "stripe";

export const webhookRoutes = new Hono();

webhookRoutes.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "Missing signature" }, 400);

  const rawBody = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription
      );
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return c.json({ received: true });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId || session.mode !== "subscription") return;

  const stripeSubscriptionId = session.subscription as string;
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Update user tier
  await db
    .update(users)
    .set({ tier: "fluent", updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Upsert subscription record
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const subData = {
    userId,
    stripeSubscriptionId: sub.id,
    stripePriceId: sub.items.data[0]!.price.id,
    status: sub.status,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set(subData)
      .where(eq(subscriptions.id, existing[0]!.id));
  } else {
    await db.insert(subscriptions).values(subData);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const [subRecord] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);
  if (!subRecord) return;

  const tier = sub.status === "active" ? "fluent" : "free";

  await db
    .update(subscriptions)
    .set({
      status: sub.status,
      stripePriceId: sub.items.data[0]!.price.id,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subRecord.id));

  await db
    .update(users)
    .set({ tier, updatedAt: new Date() })
    .where(eq(users.id, subRecord.userId));
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const [subRecord] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);
  if (!subRecord) return;

  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(subscriptions.id, subRecord.id));

  await db
    .update(users)
    .set({ tier: "free", updatedAt: new Date() })
    .where(eq(users.id, subRecord.userId));
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoice.subscription as string | null;
  if (!subId) return;

  const [subRecord] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subId))
    .limit(1);
  if (!subRecord) return;

  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(subscriptions.id, subRecord.id));

  // Downgrade user to free tier immediately on payment failure.
  // If Stripe retries and succeeds, handleSubscriptionUpdated() restores "fluent".
  await db
    .update(users)
    .set({ tier: "free", updatedAt: new Date() })
    .where(eq(users.id, subRecord.userId));
}
