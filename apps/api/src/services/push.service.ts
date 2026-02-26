import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { pushSubscriptions } from "../db/schema";
import { env } from "../env";

let initialized = false;

function ensureInitialized() {
  if (initialized || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:noreply@versado.app",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
  initialized = true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  ensureInitialized();
  if (!initialized) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
        throw err;
      }
    })
  );
}
