import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Card } from "./card";

export interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendIcon?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendIcon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex-1 min-w-0 p-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="text-xl font-bold text-neutral-900">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-medium text-success-500">
          {trendIcon}
          <span>{trend}</span>
        </div>
      )}
    </Card>
  );
}
