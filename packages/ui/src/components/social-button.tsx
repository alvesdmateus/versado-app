import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

export function SocialButton({
  icon,
  children,
  className,
  ...props
}: SocialButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors",
        "hover:bg-neutral-50 hover:border-neutral-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:border-primary-500",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
