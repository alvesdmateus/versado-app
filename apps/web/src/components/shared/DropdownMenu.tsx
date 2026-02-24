import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { cn } from "@versado/ui";

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, close]);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(0);
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) {
          close();
          items[activeIndex].onClick();
        }
        break;
    }
  }

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [isOpen, activeIndex]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          if (isOpen) {
            close();
          } else {
            setIsOpen(true);
            setActiveIndex(0);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>
      {isOpen && (
        <div
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-200 bg-neutral-0 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(el) => { itemRefs.current[index] = el; }}
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => {
                close();
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
