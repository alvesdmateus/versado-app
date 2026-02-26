import { sql } from "drizzle-orm";
import { db } from "../db";
import { users, cardProgress } from "../db/schema";
import { sendPushToUser } from "../services/push.service";
import { env } from "../env";

export function startReminderJob() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.log("[reminder] VAPID keys not configured, reminder job disabled");
    return;
  }

  console.log("[reminder] Reminder job started (checking every 60s)");

  setInterval(async () => {
    try {
      const now = new Date();
      const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;

      // Find users with pushAlerts=true and a reminderTime matching current HH:MM
      const eligibleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          sql`
            (${users.preferences}->>'pushAlerts')::boolean = true
            AND ${users.preferences}->'reminderTimes' @> ${JSON.stringify([currentTime])}::jsonb
          `
        );

      for (const user of eligibleUsers) {
        try {
          const [dueCount] = await db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(cardProgress)
            .where(
              sql`
                ${cardProgress.userId} = ${user.id}
                AND ${cardProgress.dueDate} <= NOW()
                AND ${cardProgress.tombstone} = false
              `
            );

          if (dueCount && dueCount.count > 0) {
            await sendPushToUser(user.id, {
              title: "Time to study!",
              body: `You have ${dueCount.count} card${dueCount.count === 1 ? "" : "s"} due for review.`,
              url: "/",
            });
          }
        } catch (err) {
          console.error(`[reminder] Failed to notify user ${user.id}:`, err);
        }
      }
    } catch (err) {
      console.error("[reminder] Job error:", err);
    }
  }, 60_000);
}
