import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { IndexedDBAdapter } from "@flashcard/storage";
import {
  SyncStorage,
  SyncClient,
  SyncEngine,
  type SyncStatus,
  type SyncEvent,
} from "@flashcard/sync";
import { useAuth } from "@/hooks/useAuth";
import { getAccessToken } from "@/lib/api-client";
import { setSyncInstances } from "@/lib/sync-aware-api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface SyncContextValue {
  syncStatus: SyncStatus;
  pendingChanges: number;
  lastSyncedAt: string | null;
  sync: () => Promise<void>;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const engineRef = useRef<SyncEngine | null>(null);
  const storageRef = useRef<SyncStorage | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in — tear down if active
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      storageRef.current = null;
      setSyncInstances(null, null);
      setSyncStatus("idle");
      setPendingChanges(0);
      return;
    }

    // Initialize sync
    const adapter = new IndexedDBAdapter();
    const storage = new SyncStorage(adapter);
    const client = new SyncClient({
      baseUrl: API_BASE,
      getToken: () => getAccessToken(),
    });
    const engine = new SyncEngine(storage, client);

    engineRef.current = engine;
    storageRef.current = storage;
    setSyncInstances(engine, storage);

    const unsubscribe = engine.onEvent((event: SyncEvent) => {
      setSyncStatus(event.status);
      setPendingChanges(event.pendingChanges);
      if (event.type === "sync-complete") {
        setLastSyncedAt(new Date().toISOString());
      }
    });

    engine.start();

    return () => {
      unsubscribe();
      engine.stop();
      engineRef.current = null;
      storageRef.current = null;
      setSyncInstances(null, null);
    };
  }, [isAuthenticated]);

  const sync = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.sync();
    }
  }, []);

  return (
    <SyncContext.Provider
      value={{ syncStatus, pendingChanges, lastSyncedAt, sync }}
    >
      {children}
    </SyncContext.Provider>
  );
}
