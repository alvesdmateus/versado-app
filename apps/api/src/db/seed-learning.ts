import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { loadLearningContent } from "../content";
import { createDrizzleLearningRepositories } from "../repositories/learning-drizzle";

/**
 * Upserts versioned learning content (src/content) into the database.
 * Idempotent: safe to run on every deploy. Works against any DATABASE_URL
 * (local Docker Postgres in dev, Neon or another provider in prod).
 */
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const repos = createDrizzleLearningRepositories(drizzle(client, { schema }));

try {
  for (const { track, chapters, modules } of loadLearningContent()) {
    await repos.tracks.upsert(track);
    for (const chapter of chapters) await repos.chapters.upsert(chapter);
    for (const module of modules) await repos.modules.upsert(module);
    console.log(`Seeded track "${track.id}" with ${chapters.length} chapters and ${modules.length} modules`);
  }
} finally {
  await client.end();
}
