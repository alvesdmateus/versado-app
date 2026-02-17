import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  href: string;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeKey: string;
  onNavigate: (href: string) => void;
  className?: string;
}

export function BottomNav({
  items,
  activeKey,
  onNavigate,
  className,
}: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-neutral-0",
        className
      )}
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-primary-500" : "text-neutral-400"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
