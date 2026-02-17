export interface QueryFilter {
  field: string;
  operator: "eq" | "gt" | "gte" | "lt" | "lte" | "in";
  value: unknown;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: { field: string; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

export interface StorageAdapter {
  // Single item operations
  get<T>(collection: string, id: string): Promise<T | null>;
  set<T>(collection: string, id: string, value: T): Promise<void>;
  delete(collection: string, id: string): Promise<void>;

  // Bulk operations
  getAll<T>(collection: string, options?: QueryOptions): Promise<T[]>;
  setMany<T>(collection: string, items: Array<{ id: string; value: T }>): Promise<void>;
  deleteMany(collection: string, ids: string[]): Promise<void>;

  // Query
  query<T>(collection: string, options: QueryOptions): Promise<T[]>;
  count(collection: string, options?: QueryOptions): Promise<number>;

  // Transaction support
  transaction<T>(
    collections: string[],
    mode: "readonly" | "readwrite",
    operation: (tx: TransactionContext) => Promise<T>
  ): Promise<T>;

  // Lifecycle
  clear(collection?: string): Promise<void>;
  close(): Promise<void>;
}

export interface TransactionContext {
  get<T>(collection: string, id: string): Promise<T | null>;
  set<T>(collection: string, id: string, value: T): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  getAll<T>(collection: string): Promise<T[]>;
}
