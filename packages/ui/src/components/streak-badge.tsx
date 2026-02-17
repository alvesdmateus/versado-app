import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface StreakBadgeProps {
  count: number;
  icon?: ReactNode;
  className?: string;
}

export function StreakBadge({ count, icon, className }: StreakBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5",
        className
      )}
    >
      {icon}
      <span className="text-sm font-bold text-success-700">{count}</span>
    </div>
  );
}
