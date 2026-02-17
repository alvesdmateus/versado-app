import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500",
        variant === "secondary" &&
          "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-500",
        variant === "ghost" &&
          "text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-500",
        size === "sm" && "h-8 px-3 text-sm gap-1.5",
        size === "md" && "h-10 px-4 text-sm gap-2",
        size === "lg" && "h-12 px-6 text-base gap-2.5",
        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
