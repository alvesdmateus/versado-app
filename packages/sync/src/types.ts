export type SyncCollection = "decks" | "flashcards" | "card-progress";
export type SyncOperation = "create" | "update" | "delete";
export type SyncStatus = "idle" | "syncing" | "offline" | "error";

export interface OutboxEntry {
  id: string;
  collection: SyncCollection;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export interface SyncMetadata {
  id: string; // always "sync-meta" singleton
  lastPulledAt: string | null;
  lastPushedAt: string | null;
}

export interface PullResponse {
  decks: Record<string, unknown>[];
  flashcards: Record<string, unknown>[];
  cardProgress: Record<string, unknown>[];
  serverTime: string;
}

export interface PushResponse {
  results: PushResult[];
  serverTime: string;
}

export interface PushResult {
  outboxId: string;
  success: boolean;
  conflict?: boolean;
  serverVersion?: number;
  serverData?: Record<string, unknown>;
}

export type SyncEventType = "status-change" | "sync-complete" | "sync-error";

export interface SyncEvent {
  type: SyncEventType;
  status: SyncStatus;
  pendingChanges: number;
  error?: string;
}
