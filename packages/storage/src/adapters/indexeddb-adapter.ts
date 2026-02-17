import { openDB, type IDBPDatabase } from "idb";
import type {
  StorageAdapter,
  QueryOptions,
  QueryFilter,
  TransactionContext,
} from "../storage-adapter";

const DB_NAME = "flashcard-app";
const DB_VERSION = 2;

const COLLECTIONS = [
  "decks", "flashcards", "users", "card-progress", "study-sessions",
  "sync-outbox", "sync-metadata",
] as const;

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<IDBPDatabase> | null = null;

  private async getDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    if (!this.initPromise) {
      this.initPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          // Version 1: original collections
          if (oldVersion < 1) {
            for (const collection of ["decks", "flashcards", "users", "card-progress", "study-sessions"] as const) {
              if (!db.objectStoreNames.contains(collection)) {
                const store = db.createObjectStore(collection, { keyPath: "id" });
                if (collection === "flashcards") {
                  store.createIndex("deckId", "deckId");
                  store.createIndex("_tombstone", "_tombstone");
                }
                if (collection === "card-progress") {
                  store.createIndex("userId", "userId");
                  store.createIndex("deckId", "deckId");
                  store.createIndex("cardId", "cardId");
                  store.createIndex("dueDate", "dueDate");
                }
                if (collection === "study-sessions") {
                  store.createIndex("userId", "userId");
                  store.createIndex("deckId", "deckId");
                }
              }
            }
          }

          // Version 2: sync collections
          if (oldVersion < 2) {
            if (!db.objectStoreNames.contains("sync-outbox")) {
              const outbox = db.createObjectStore("sync-outbox", { keyPath: "id" });
              outbox.createIndex("collection", "collection");
              outbox.createIndex("timestamp", "timestamp");
            }
            if (!db.objectStoreNames.contains("sync-metadata")) {
              db.createObjectStore("sync-metadata", { keyPath: "id" });
            }
          }
        },
      });
    }

    this.db = await this.initPromise;
    return this.db;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const db = await this.getDB();
    const result = await db.get(collection, id);
    return (result as T) ?? null;
  }

  async set<T>(collection: string, id: string, value: T): Promise<void> {
    const db = await this.getDB();
    await db.put(collection, { ...value, id });
  }

  async delete(collection: string, id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(collection, id);
  }

  async getAll<T>(collection: string, options?: QueryOptions): Promise<T[]> {
    const db = await this.getDB();
    let results = (await db.getAll(collection)) as T[];

    if (options) {
      results = this.applyQueryOptions(results, options);
    }

    return results;
  }

  async setMany<T>(collection: string, items: Array<{ id: string; value: T }>): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(collection, "readwrite");
    const store = tx.objectStore(collection);

    await Promise.all([
      ...items.map((item) => store.put({ ...item.value, id: item.id })),
      tx.done,
    ]);
  }

  async deleteMany(collection: string, ids: string[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(collection, "readwrite");
    const store = tx.objectStore(collection);

    await Promise.all([...ids.map((id) => store.delete(id)), tx.done]);
  }

  async query<T>(collection: string, options: QueryOptions): Promise<T[]> {
    return this.getAll<T>(collection, options);
  }

  async count(collection: string, options?: QueryOptions): Promise<number> {
    if (!options?.filters) {
      const db = await this.getDB();
      return db.count(collection);
    }

    const results = await this.getAll(collection, options);
    return results.length;
  }

  async transaction<T>(
    collections: string[],
    mode: "readonly" | "readwrite",
    operation: (tx: TransactionContext) => Promise<T>
  ): Promise<T> {
    const db = await this.getDB();
    const tx = db.transaction(collections, mode);

    const context: TransactionContext = {
      async get<U>(col: string, id: string): Promise<U | null> {
        const store = tx.objectStore(col);
        const result = await store.get(id);
        return (result as U) ?? null;
      },
      async set<U>(col: string, id: string, value: U): Promise<void> {
        const store = tx.objectStore(col);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (store as any).put({ ...value, id });
      },
      async delete(col: string, id: string): Promise<void> {
        const store = tx.objectStore(col);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (store as any).delete(id);
      },
      async getAll<U>(col: string): Promise<U[]> {
        const store = tx.objectStore(col);
        return (await store.getAll()) as U[];
      },
    };

    try {
      const result = await operation(context);
      await tx.done;
      return result;
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  async clear(collection?: string): Promise<void> {
    const db = await this.getDB();

    if (collection) {
      await db.clear(collection);
    } else {
      const tx = db.transaction(COLLECTIONS as unknown as string[], "readwrite");
      await Promise.all([
        ...COLLECTIONS.map((col) => tx.objectStore(col).clear()),
        tx.done,
      ]);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  private applyQueryOptions<T>(results: T[], options: QueryOptions): T[] {
    let filtered = results;

    // Apply filters
    if (options.filters) {
      filtered = filtered.filter((item) =>
        options.filters!.every((filter) => this.matchesFilter(item, filter))
      );
    }

    // Apply ordering
    if (options.orderBy) {
      const { field, direction } = options.orderBy;
      filtered.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return direction === "asc" ? comparison : -comparison;
      });
    }

    // Apply pagination
    if (options.offset !== undefined) {
      filtered = filtered.slice(options.offset);
    }
    if (options.limit !== undefined) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  private matchesFilter(item: unknown, filter: QueryFilter): boolean {
    const value = (item as Record<string, unknown>)[filter.field];

    switch (filter.operator) {
      case "eq":
        return value === filter.value;
      case "gt":
        return (value as number) > (filter.value as number);
      case "gte":
        return (value as number) >= (filter.value as number);
      case "lt":
        return (value as number) < (filter.value as number);
      case "lte":
        return (value as number) <= (filter.value as number);
      case "in":
        return (filter.value as unknown[]).includes(value);
      default:
        return false;
    }
  }
}
