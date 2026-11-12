import { LearningService, type LearningRepositories } from "@versado/core";
import { db } from "../db";
import { createDrizzleLearningRepositories } from "./learning-drizzle";

/**
 * Pluggable storage for skill-track learning. Defaults to the PostgreSQL adapter
 * (local Docker DB in dev, the DATABASE_URL provider in prod). Swap with
 * `setLearningRepositories()` to plug another backend or an in-memory store in tests.
 */
let repositories: LearningRepositories | null = null;

export function getLearningRepositories(): LearningRepositories {
  repositories ??= createDrizzleLearningRepositories(db);
  return repositories;
}

export function setLearningRepositories(repos: LearningRepositories | null) {
  repositories = repos;
}

export function getLearningService(): LearningService {
  return new LearningService(getLearningRepositories());
}
