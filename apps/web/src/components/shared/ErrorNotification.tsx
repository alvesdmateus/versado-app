import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Logo, Button } from "@flashcard/ui";

export interface ErrorNotificationProps {
  isOpen: boolean;
  title: string;
  description: string;
  errorCode: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorNotification({
  isOpen,
  title,
  description,
  errorCode,
  onRetry,
  onDismiss,
}: ErrorNotificationProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  useEffect(() => {
    if (isOpen) contentRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onDismiss();
  }

  function handleRetry() {
    onDismiss();
    onRetry?.();
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-title"
        aria-describedby="error-desc"
        className="w-full max-w-sm rounded-2xl bg-neutral-0 p-6 text-center shadow-xl outline-none animate-in zoom-in-95 duration-150"
      >
        {/* Logo with error color tint */}
        <div
          className="mx-auto mb-4 inline-flex"
          style={
            {
              "--color-primary-100": "var(--color-error-100)",
              "--color-primary-200": "var(--color-error-200)",
              "--color-primary-300": "var(--color-error-300)",
              "--color-primary-500": "var(--color-error-500)",
            } as React.CSSProperties
          }
        >
          <Logo size="md" />
        </div>

        <h2
          id="error-title"
          className="text-lg font-bold text-neutral-900"
        >
          {title}
        </h2>

        <p
          id="error-desc"
          className="mt-2 text-sm text-neutral-500"
        >
          {description}
        </p>

        {onRetry && (
          <Button fullWidth className="mt-6" onClick={handleRetry}>
            Try Again
          </Button>
        )}

        <button
          onClick={onDismiss}
          className="mt-3 text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Dismiss
        </button>

        <p className="mt-4 text-xs text-neutral-300">{errorCode}</p>
      </div>
    </div>,
    document.body
  );
}
