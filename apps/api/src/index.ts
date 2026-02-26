import { createApp } from "./app";
import { env } from "./env";
import { startReminderJob } from "./jobs/reminder.job";

const app = createApp();

console.log(`Versado API starting on port ${env.PORT}...`);
startReminderJob();

export default {
  port: env.PORT,
  fetch: app.fetch,
};
