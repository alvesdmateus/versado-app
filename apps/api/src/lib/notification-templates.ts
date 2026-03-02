/**
 * Motivational push notification templates.
 * Each template is a function that receives context and returns { title, body }.
 */

interface StreakContext {
  dueCount: number;
  streakDays: number;
  streakActive: boolean; // studied today already
}

interface NotificationMessage {
  title: string;
  body: string;
}

// ── Templates for users WITH an active streak ────────────────────────

const streakKeepGoing: Array<(ctx: StreakContext) => NotificationMessage> = [
  (ctx) => ({
    title: `${ctx.streakDays}-day streak! Keep it alive!`,
    body: `You have ${ctx.dueCount} card${ctx.dueCount === 1 ? "" : "s"} waiting. A quick session keeps the momentum going.`,
  }),
  (ctx) => ({
    title: "Don't break the chain!",
    body: `${ctx.streakDays} days strong — ${ctx.dueCount} card${ctx.dueCount === 1 ? "" : "s"} to review today. You've got this!`,
  }),
  (ctx) => ({
    title: "Your streak is counting on you!",
    body: `${ctx.dueCount} card${ctx.dueCount === 1 ? " is" : "s are"} due. ${ctx.streakDays} days in a row — let's make it ${ctx.streakDays + 1}!`,
  }),
  (ctx) => ({
    title: "Consistency is your superpower!",
    body: `${ctx.streakDays}-day streak and ${ctx.dueCount} card${ctx.dueCount === 1 ? "" : "s"} ready for review. Keep showing up!`,
  }),
  (ctx) => ({
    title: "You're on fire!",
    body: `${ctx.streakDays} days in a row! Review your ${ctx.dueCount} due card${ctx.dueCount === 1 ? "" : "s"} to keep the flame alive.`,
  }),
];

// ── Templates for users with NO streak (0 days) ─────────────────────

const streakStart: Array<(ctx: StreakContext) => NotificationMessage> = [
  (ctx) => ({
    title: "Start something great today!",
    body: `${ctx.dueCount} card${ctx.dueCount === 1 ? " is" : "s are"} waiting for you. One session is all it takes to start a streak.`,
  }),
  (ctx) => ({
    title: "Today could be Day 1!",
    body: `You have ${ctx.dueCount} card${ctx.dueCount === 1 ? "" : "s"} to review. Start your streak — future you will thank you.`,
  }),
  (ctx) => ({
    title: "A fresh start awaits!",
    body: `${ctx.dueCount} card${ctx.dueCount === 1 ? "" : "s"} due for review. Jump in and begin building your streak!`,
  }),
  (ctx) => ({
    title: "Your cards miss you!",
    body: `It's been a while — ${ctx.dueCount} card${ctx.dueCount === 1 ? " is" : "s are"} ready to review. Let's kick off a new streak!`,
  }),
  (ctx) => ({
    title: "Small steps, big results!",
    body: `Just ${ctx.dueCount} card${ctx.dueCount === 1 ? "" : "s"} to go. A quick review today plants the seed for a new streak.`,
  }),
];

/**
 * Pick a random notification message based on streak context.
 */
export function getNotificationMessage(ctx: StreakContext): NotificationMessage {
  const templates = ctx.streakDays > 0 ? streakKeepGoing : streakStart;
  const index = Math.floor(Math.random() * templates.length);
  // Arrays are statically populated above, so index is always valid
  return templates[index]!(ctx);
}
