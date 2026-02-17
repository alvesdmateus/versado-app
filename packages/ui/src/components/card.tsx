import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl bg-neutral-0 shadow-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("text-lg font-semibold text-neutral-900", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("text-neutral-600", className)} {...props}>
      {children}
    </div>
  );
}
