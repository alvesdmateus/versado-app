import { useState, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@flashcard/ui";

interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button onClick={() => setIsOpen((prev) => !prev)}>{trigger}</button>
      {isOpen && (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-200 bg-neutral-0 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors",
                item.variant === "danger"
                  ? "text-error-500 hover:bg-error-50"
                  : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              {item.icon && <span className="h-4 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
