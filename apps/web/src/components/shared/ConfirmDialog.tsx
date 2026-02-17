import { Modal } from "./Modal";
import { Button } from "@flashcard/ui";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-neutral-600">{message}</p>
      <div className="mt-5 flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            variant === "danger"
              ? "bg-error-500 hover:bg-error-600"
              : "bg-primary-500 hover:bg-primary-600"
          }`}
        >
          {isLoading ? "..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
