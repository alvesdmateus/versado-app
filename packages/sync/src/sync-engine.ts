import type { SyncClient } from "./sync-client";
import type { SyncStorage } from "./sync-storage";
import type {
  SyncCollection,
  SyncEvent,
  SyncOperation,
  SyncStatus,
} from "./types";

const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const MAX_RETRIES = 5;

type SyncListener = (event: SyncEvent) => void;

export class SyncEngine {
  private status: SyncStatus = "idle";
  private listeners: Set<SyncListener> = new Set();
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;

  constructor(
    private readonly storage: SyncStorage,
    private readonly client: SyncClient
  ) {}

  // --- Lifecycle ---

  start(): void {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      if (!navigator.onLine) {
        this.setStatus("offline");
      } else {
        // Initial sync on start
        this.sync().catch(() => {});
      }
    }

    // Periodic sync
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync().catch(() => {});
      }
    }, SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // --- Event System ---

  onEvent(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  async getPendingCount(): Promise<number> {
    return this.storage.getOutboxCount();
  }

  // --- Queue Changes ---

  async queueChange(
    collection: SyncCollection,
    entityId: string,
    operation: SyncOperation,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.storage.addToOutbox(collection, entityId, operation, data);
    this.emit();

    // Try immediate sync if online
    if (navigator.onLine && !this.isSyncing) {
      this.sync().catch(() => {});
    }
  }

  // --- Sync Cycle ---

  async sync(): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      this.setStatus("offline");
      return;
    }

    this.isSyncing = true;
    this.setStatus("syncing");

    try {
      // 1. Push local changes
      await this.push();

      // 2. Pull remote changes
      await this.pull();

      this.setStatus("idle");
    } catch {
      this.setStatus("error");
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Push ---

  private async push(): Promise<void> {
    const outbox = await this.storage.getOutbox();
    if (outbox.length === 0) return;

    // Filter out entries that exceeded max retries
    const eligible = outbox.filter((e) => e.retries < MAX_RETRIES);
    if (eligible.length === 0) {
      // Remove stale entries
      await this.storage.removeFromOutboxMany(outbox.map((e) => e.id));
      return;
    }

    try {
      const response = await this.client.push(eligible);
      const toRemove: string[] = [];

      for (const result of response.results) {
        if (result.success) {
          toRemove.push(result.outboxId);
        } else if (result.conflict) {
          // Server wins — remove from outbox, server data will come via pull
          toRemove.push(result.outboxId);
        } else {
          // Transient failure — increment retry
          await this.storage.incrementRetry(result.outboxId);
        }
      }

      if (toRemove.length > 0) {
        await this.storage.removeFromOutboxMany(toRemove);
      }

      await this.storage.setMetadata({ lastPushedAt: response.serverTime });
    } catch {
      // Increment retries for all entries on network failure
      for (const entry of eligible) {
        await this.storage.incrementRetry(entry.id);
      }
    }
  }

  // --- Pull ---

  private async pull(): Promise<void> {
    const meta = await this.storage.getMetadata();

    try {
      const response = await this.client.pull(meta.lastPulledAt);

      // Cache pulled data locally
      await this.storage.cacheDecks(response.decks);
      await this.storage.cacheCards(response.flashcards);
      await this.storage.cacheCardProgress(response.cardProgress);

      // Handle tombstoned entities — remove from local cache
      for (const deck of response.decks) {
        if (deck.tombstone === true) {
          await this.storage.removeCachedEntity("decks", deck.id as string);
        }
      }
      for (const card of response.flashcards) {
        if (card.tombstone === true) {
          await this.storage.removeCachedEntity("flashcards", card.id as string);
        }
      }
      for (const progress of response.cardProgress) {
        if (progress.tombstone === true) {
          await this.storage.removeCachedEntity("card-progress", progress.id as string);
        }
      }

      await this.storage.setMetadata({ lastPulledAt: response.serverTime });
    } catch {
      // Pull failure is non-fatal; will retry next cycle
    }
  }

  // --- Internals ---

  private handleOnline = (): void => {
    this.sync().catch(() => {});
  };

  private handleOffline = (): void => {
    this.setStatus("offline");
  };

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emit();
  }

  private async emit(): Promise<void> {
    const pending = await this.storage.getOutboxCount();
    const event: SyncEvent = {
      type:
        this.status === "error"
          ? "sync-error"
          : this.status === "idle"
            ? "sync-complete"
            : "status-change",
      status: this.status,
      pendingChanges: pending,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break the engine
      }
    }
  }
}
