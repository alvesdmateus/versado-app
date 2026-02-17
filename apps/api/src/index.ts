import { createApp } from "./app";
import { env } from "./env";

const app = createApp();

console.log(`Flashcard API starting on port ${env.PORT}...`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
