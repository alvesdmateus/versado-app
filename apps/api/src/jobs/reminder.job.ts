import { sql } from "drizzle-orm";
import { eq, and, gte } from "drizzle-orm";
import { db } from "../db";
import { users, cardProgress, studySessions } from "../db/schema";
import { sendPushToUser } from "../services/push.service";
import { getNotificationMessage } from "../lib/notification-templates";
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
            // Compute streak for this user (last 30 days of sessions)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentSessions = await db
              .select({ startedAt: studySessions.startedAt })
              .from(studySessions)
              .where(
                and(
                  eq(studySessions.userId, user.id),
                  gte(studySessions.startedAt, thirtyDaysAgo)
                )
              );

            const sessionDates = new Set<string>();
            for (const session of recentSessions) {
              sessionDates.add(session.startedAt.toISOString().slice(0, 10));
            }

            const todayStr = now.toISOString().slice(0, 10);
            const streakActive = sessionDates.has(todayStr);

            let streakDays = 0;
            const checkDate = new Date(now);
            if (!streakActive) {
              checkDate.setDate(checkDate.getDate() - 1);
            }
            while (sessionDates.has(checkDate.toISOString().slice(0, 10))) {
              streakDays++;
              checkDate.setDate(checkDate.getDate() - 1);
            }

            const message = getNotificationMessage({
              dueCount: dueCount.count,
              streakDays,
              streakActive,
            });

            await sendPushToUser(user.id, {
              title: message.title,
              body: message.body,
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
