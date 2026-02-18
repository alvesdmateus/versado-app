import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.test before any app code imports env.ts
const envPath = resolve(import.meta.dir, "../../.env.test");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  const value = trimmed.slice(eqIndex + 1);
  process.env[key] = value;
}

// Now we can safely import app code
import { createApp } from "../app";
import { db } from "../db";
import { sign } from "../lib/jwt";
import { hashPassword } from "../lib/hash";
import {
  users,
  decks,
  flashcards,
  cardProgress,
  studySessions,
  refreshTokens,
  purchases,
  subscriptions,
  marketplaceReviews,
  follows,
} from "../db/schema";
import type { UserTier } from "@versado/core/entities";

// Create a shared app instance for tests
export const app = createApp();

/**
 * Make a test request to the app (no HTTP server needed).
 */
export function testRequest(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return app.request(path, init);
}

/**
 * Make an authenticated test request.
 */
export function authRequest(
  path: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  // Set IP for rate limiting
  headers.set("x-forwarded-for", `test-${Math.random()}`);
  return app.request(path, { ...init, headers });
}

/**
 * Create a test user directly in the DB and return their info + JWT.
 */
export async function createTestUser(overrides?: {
  email?: string;
  displayName?: string;
  tier?: UserTier;
}) {
  const email = overrides?.email ?? `test-${crypto.randomUUID()}@example.com`;
  const displayName = overrides?.displayName ?? "Test User";
  const tier = overrides?.tier ?? "free";
  const passwordHash = await hashPassword("Password1");

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName, tier })
    .returning();

  const token = sign({
    sub: user!.id,
    email: user!.email,
    tier: user!.tier,
  });

  return { user: user!, token };
}

/**
 * Create a test deck owned by a user.
 */
export async function createTestDeck(
  ownerId: string,
  overrides?: { name?: string; visibility?: string }
) {
  const [deck] = await db
    .insert(decks)
    .values({
      ownerId,
      name: overrides?.name ?? "Test Deck",
      visibility: (overrides?.visibility as any) ?? "private",
    })
    .returning();
  return deck!;
}

/**
 * Create a test flashcard in a deck.
 */
export async function createTestFlashcard(
  deckId: string,
  overrides?: { front?: string; back?: string }
) {
  const [card] = await db
    .insert(flashcards)
    .values({
      deckId,
      front: overrides?.front ?? "Test Front",
      back: overrides?.back ?? "Test Back",
    })
    .returning();
  return card!;
}

/**
 * Truncate all tables for a clean slate between tests.
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await db.delete(follows);
  await db.delete(marketplaceReviews);
  await db.delete(purchases);
  await db.delete(subscriptions);
  await db.delete(studySessions);
  await db.delete(cardProgress);
  await db.delete(flashcards);
  await db.delete(decks);
  await db.delete(refreshTokens);
  await db.delete(users);
}
