import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@flashcard/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
}

const SIZE_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) contentRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
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
        className={cn(
          "w-full rounded-2xl bg-neutral-0 shadow-xl outline-none animate-in zoom-in-95 duration-150",
          SIZE_MAP[size]
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            {title && (
              <h2 className="text-lg font-semibold text-neutral-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto -mr-1 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
