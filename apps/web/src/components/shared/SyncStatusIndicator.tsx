import type { SyncStatus } from "@flashcard/sync";
import { useSync } from "@/hooks/useSync";

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string; animate?: boolean }> = {
  idle: { color: "bg-emerald-400", label: "Synced" },
  syncing: { color: "bg-blue-400", label: "Syncing", animate: true },
  offline: { color: "bg-amber-400", label: "Offline" },
  error: { color: "bg-red-400", label: "Sync error" },
};

export function SyncStatusIndicator() {
  const { syncStatus, pendingChanges } = useSync();

  const config = STATUS_CONFIG[syncStatus];

  return (
    <button
      onClick={undefined}
      className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100"
      title={`${config.label}${pendingChanges > 0 ? ` (${pendingChanges} pending)` : ""}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${config.color} ${
          config.animate ? "animate-pulse" : ""
        }`}
      />
      {syncStatus === "offline" && <span>Offline</span>}
      {syncStatus === "error" && <span>Error</span>}
      {pendingChanges > 0 && syncStatus !== "offline" && syncStatus !== "error" && (
        <span>{pendingChanges}</span>
      )}
    </button>
  );
}
