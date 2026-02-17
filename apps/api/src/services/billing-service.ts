import { eq } from "drizzle-orm";
import { stripe } from "../lib/stripe";
import { db } from "../db";
import { users, subscriptions } from "../db/schema";
import { env } from "../env";

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.WEB_URL}/billing?success=true`,
    cancel_url: `${env.WEB_URL}/billing?canceled=true`,
    metadata: { userId },
  });

  return session.url!;
}

export async function createBillingPortalSession(
  stripeCustomerId: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${env.WEB_URL}/profile`,
  });
  return session.url;
}

export async function getSubscription(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub ?? null;
}

export async function cancelSubscription(stripeSubscriptionId: string) {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(stripeSubscriptionId: string) {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}
