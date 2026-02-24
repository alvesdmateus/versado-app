import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@versado/ui";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onDismiss: () => void;
}

const ICON_MAP = {
  success: <CheckCircle className="h-5 w-5 text-success-500" />,
  error: <XCircle className="h-5 w-5 text-error-500" />,
  info: <Info className="h-5 w-5 text-primary-500" />,
} as const;

const BORDER_MAP = {
  success: "border-l-success-500",
  error: "border-l-error-500",
  info: "border-l-primary-500",
} as const;

export function Toast({ message, type, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-l-4 bg-neutral-0 px-4 py-3 shadow-lg animate-in slide-in-from-bottom-2 duration-200",
        BORDER_MAP[type]
      )}
    >
      {ICON_MAP[type]}
      <p className="flex-1 text-sm text-neutral-700">{message}</p>
      <button
        onClick={onDismiss}
        className="rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
