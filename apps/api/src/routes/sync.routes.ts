import { Hono } from "hono";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { decks, flashcards, cardProgress } from "../db/schema";

export const syncRoutes = new Hono();

// Pull — get all changes since a given timestamp
syncRoutes.get("/pull", async (c) => {
  const user = c.get("user");
  const since = c.req.query("since");
  const sinceDate = since ? new Date(since) : new Date(0);

  // Fetch all entities updated after `since` (include tombstoned for client-side cleanup)
  const [changedDecks, changedCardsRaw, changedProgress] = await Promise.all([
    db
      .select()
      .from(decks)
      .where(and(eq(decks.ownerId, user.id), gt(decks.updatedAt, sinceDate))),
    db
      .select({ flashcard: flashcards })
      .from(flashcards)
      .innerJoin(decks, eq(flashcards.deckId, decks.id))
      .where(
        and(eq(decks.ownerId, user.id), gt(flashcards.updatedAt, sinceDate))
      ),
    db
      .select()
      .from(cardProgress)
      .where(
        and(
          eq(cardProgress.userId, user.id),
          gt(cardProgress.updatedAt, sinceDate)
        )
      ),
  ]);

  // Unwrap the joined flashcard results
  const changedCards = changedCardsRaw.map((row) => row.flashcard);

  return c.json({
    decks: changedDecks,
    flashcards: changedCards,
    cardProgress: changedProgress,
    serverTime: new Date().toISOString(),
  });
});

const syncChangeSchema = z.object({
  id: z.string().uuid(),
  collection: z.enum(["decks", "flashcards", "card-progress"]),
  entityId: z.string().uuid(),
  operation: z.enum(["create", "update", "delete"]),
  data: z.record(z.unknown()),
});

const syncPushSchema = z.object({
  changes: z.array(syncChangeSchema).max(100),
});

// Push — receive batch of client changes
syncRoutes.post("/push", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = syncPushSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request body", details: parsed.error.issues }, 400);
  }
  const { changes } = parsed.data;

  const results: Array<{
    outboxId: string;
    success: boolean;
    conflict?: boolean;
    serverVersion?: number;
    serverData?: Record<string, unknown>;
  }> = [];

  for (const change of changes) {
    try {
      const result = await processChange(user.id, change);
      results.push({ outboxId: change.id, ...result });
    } catch {
      results.push({ outboxId: change.id, success: false });
    }
  }

  return c.json({ results, serverTime: new Date().toISOString() });
});

async function processChange(
  userId: string,
  change: {
    collection: string;
    entityId: string;
    operation: string;
    data: Record<string, unknown>;
  }
): Promise<{
  success: boolean;
  conflict?: boolean;
  serverVersion?: number;
  serverData?: Record<string, unknown>;
}> {
  const { collection, entityId, operation, data } = change;

  if (collection === "decks") {
    return processDeckChange(userId, entityId, operation, data);
  }
  if (collection === "flashcards") {
    return processFlashcardChange(userId, entityId, operation, data);
  }
  if (collection === "card-progress") {
    return processCardProgressChange(userId, entityId, operation, data);
  }

  return { success: false };
}

async function processDeckChange(
  userId: string,
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<{
  success: boolean;
  conflict?: boolean;
  serverVersion?: number;
  serverData?: Record<string, unknown>;
}> {
  if (operation === "create") {
    await db.insert(decks).values({
      id: entityId,
      ownerId: userId,
      name: data.name as string,
      description: (data.description as string) ?? "",
    });
    return { success: true };
  }

  // Verify ownership
  const [existing] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, entityId), eq(decks.ownerId, userId)))
    .limit(1);

  if (!existing) return { success: false };

  // Version conflict check
  const clientVersion = (data.version as number) ?? 0;
  if (existing.version > clientVersion) {
    return {
      success: false,
      conflict: true,
      serverVersion: existing.version,
      serverData: existing as unknown as Record<string, unknown>,
    };
  }

  if (operation === "update") {
    const updateData: Record<string, unknown> = {
      version: existing.version + 1,
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    await db.update(decks).set(updateData).where(eq(decks.id, entityId));
    return { success: true };
  }

  if (operation === "delete") {
    await db
      .update(decks)
      .set({ tombstone: true, version: existing.version + 1, updatedAt: new Date() })
      .where(eq(decks.id, entityId));
    return { success: true };
  }

  return { success: false };
}

async function processFlashcardChange(
  userId: string,
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<{
  success: boolean;
  conflict?: boolean;
  serverVersion?: number;
  serverData?: Record<string, unknown>;
}> {
  if (operation === "create") {
    // Verify deck ownership
    const deckId = data.deckId as string;
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId)))
      .limit(1);

    if (!deck) return { success: false };

    await db.insert(flashcards).values({
      id: entityId,
      deckId,
      front: data.front as string,
      back: data.back as string,
    });
    return { success: true };
  }

  // Verify ownership via deck join
  const [existing] = await db
    .select({ flashcard: flashcards })
    .from(flashcards)
    .innerJoin(decks, eq(flashcards.deckId, decks.id))
    .where(and(eq(flashcards.id, entityId), eq(decks.ownerId, userId)))
    .limit(1);

  if (!existing) return { success: false };

  const clientVersion = (data.version as number) ?? 0;
  if (existing.flashcard.version > clientVersion) {
    return {
      success: false,
      conflict: true,
      serverVersion: existing.flashcard.version,
      serverData: existing.flashcard as unknown as Record<string, unknown>,
    };
  }

  if (operation === "update") {
    const updateData: Record<string, unknown> = {
      version: existing.flashcard.version + 1,
      updatedAt: new Date(),
    };
    if (data.front !== undefined) updateData.front = data.front;
    if (data.back !== undefined) updateData.back = data.back;

    await db.update(flashcards).set(updateData).where(eq(flashcards.id, entityId));
    return { success: true };
  }

  if (operation === "delete") {
    await db
      .update(flashcards)
      .set({
        tombstone: true,
        version: existing.flashcard.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(flashcards.id, entityId));
    return { success: true };
  }

  return { success: false };
}

async function processCardProgressChange(
  userId: string,
  entityId: string,
  operation: string,
  data: Record<string, unknown>
): Promise<{
  success: boolean;
  conflict?: boolean;
  serverVersion?: number;
  serverData?: Record<string, unknown>;
}> {
  if (operation === "create") {
    return { success: false }; // Progress is created via init-progress endpoint
  }

  const [existing] = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.id, entityId), eq(cardProgress.userId, userId)))
    .limit(1);

  if (!existing) return { success: false };

  const clientVersion = (data.version as number) ?? 0;
  if (existing.version > clientVersion) {
    return {
      success: false,
      conflict: true,
      serverVersion: existing.version,
      serverData: existing as unknown as Record<string, unknown>,
    };
  }

  if (operation === "update") {
    const updateData: Record<string, unknown> = {
      version: existing.version + 1,
      updatedAt: new Date(),
    };
    if (data.easeFactor !== undefined) updateData.easeFactor = data.easeFactor;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.repetitions !== undefined) updateData.repetitions = data.repetitions;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate as string);
    if (data.lastReviewedAt !== undefined)
      updateData.lastReviewedAt = new Date(data.lastReviewedAt as string);

    await db.update(cardProgress).set(updateData).where(eq(cardProgress.id, entityId));
    return { success: true };
  }

  if (operation === "delete") {
    await db
      .update(cardProgress)
      .set({ tombstone: true, version: existing.version + 1, updatedAt: new Date() })
      .where(eq(cardProgress.id, entityId));
    return { success: true };
  }

  return { success: false };
}
