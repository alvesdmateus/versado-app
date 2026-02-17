import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";

export function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const [updateFn, setUpdateFn] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      setUpdateFn(() => detail.updateSW);
      setShow(true);
    }

    window.addEventListener("sw-update-available", handleUpdate);
    return () => window.removeEventListener("sw-update-available", handleUpdate);
  }, []);

  if (!show) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-primary-500 px-4 py-2.5 text-white shadow-md">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        <span className="text-sm font-medium">A new version is available</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateFn?.(true)}
          className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/30"
        >
          Refresh
        </button>
        <button
          onClick={() => setShow(false)}
          className="rounded-md p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
