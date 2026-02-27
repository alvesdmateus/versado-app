import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const { t } = useTranslation("errors");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div role="alert" aria-live="assertive" className="flex items-center justify-center gap-2 bg-warning-500 px-4 py-2 text-white">
      <WifiOff className="h-4 w-4" />
      <span className="text-xs font-medium">
        {t("offline.message")}
      </span>
    </div>
  );
}
