import type { StorageAdapter } from "@flashcard/storage";
import type { OutboxEntry, SyncCollection, SyncMetadata, SyncOperation } from "./types";

const OUTBOX_COLLECTION = "sync-outbox";
const METADATA_COLLECTION = "sync-metadata";
const METADATA_ID = "sync-meta";

export class SyncStorage {
  constructor(private readonly storage: StorageAdapter) {}

  // --- Outbox ---

  async getOutbox(): Promise<OutboxEntry[]> {
    return this.storage.getAll<OutboxEntry>(OUTBOX_COLLECTION, {
      orderBy: { field: "timestamp", direction: "asc" },
    });
  }

  async getOutboxCount(): Promise<number> {
    return this.storage.count(OUTBOX_COLLECTION);
  }

  async addToOutbox(
    collection: SyncCollection,
    entityId: string,
    operation: SyncOperation,
    data: Record<string, unknown>
  ): Promise<OutboxEntry> {
    const entry: OutboxEntry = {
      id: crypto.randomUUID(),
      collection,
      entityId,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    await this.storage.set(OUTBOX_COLLECTION, entry.id, entry);
    return entry;
  }

  async removeFromOutbox(id: string): Promise<void> {
    await this.storage.delete(OUTBOX_COLLECTION, id);
  }

  async removeFromOutboxMany(ids: string[]): Promise<void> {
    await this.storage.deleteMany(OUTBOX_COLLECTION, ids);
  }

  async incrementRetry(id: string): Promise<void> {
    const entry = await this.storage.get<OutboxEntry>(OUTBOX_COLLECTION, id);
    if (entry) {
      await this.storage.set(OUTBOX_COLLECTION, id, {
        ...entry,
        retries: entry.retries + 1,
      });
    }
  }

  async clearOutbox(): Promise<void> {
    await this.storage.clear(OUTBOX_COLLECTION);
  }

  // --- Sync Metadata ---

  async getMetadata(): Promise<SyncMetadata> {
    const meta = await this.storage.get<SyncMetadata>(METADATA_COLLECTION, METADATA_ID);
    return meta ?? { id: METADATA_ID, lastPulledAt: null, lastPushedAt: null };
  }

  async setMetadata(updates: Partial<Omit<SyncMetadata, "id">>): Promise<void> {
    const current = await this.getMetadata();
    await this.storage.set(METADATA_COLLECTION, METADATA_ID, {
      ...current,
      ...updates,
    });
  }

  // --- Entity Cache ---

  async getCachedDecks(): Promise<Record<string, unknown>[]> {
    return this.storage.getAll("decks");
  }

  async getCachedCards(deckId: string): Promise<Record<string, unknown>[]> {
    return this.storage.query("flashcards", {
      filters: [{ field: "deckId", operator: "eq", value: deckId }],
    });
  }

  async getCachedCardProgress(deckId: string): Promise<Record<string, unknown>[]> {
    return this.storage.query("card-progress", {
      filters: [{ field: "deckId", operator: "eq", value: deckId }],
    });
  }

  async cacheDecks(decks: Record<string, unknown>[]): Promise<void> {
    if (decks.length === 0) return;
    await this.storage.setMany(
      "decks",
      decks.map((d) => ({ id: d.id as string, value: d }))
    );
  }

  async cacheCards(cards: Record<string, unknown>[]): Promise<void> {
    if (cards.length === 0) return;
    await this.storage.setMany(
      "flashcards",
      cards.map((c) => ({ id: c.id as string, value: c }))
    );
  }

  async cacheCardProgress(progress: Record<string, unknown>[]): Promise<void> {
    if (progress.length === 0) return;
    await this.storage.setMany(
      "card-progress",
      progress.map((p) => ({ id: p.id as string, value: p }))
    );
  }

  async removeCachedEntity(collection: string, id: string): Promise<void> {
    await this.storage.delete(collection, id);
  }
}
