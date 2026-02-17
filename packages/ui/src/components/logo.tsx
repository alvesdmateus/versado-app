import { cn } from "../lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
} as const;

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <svg
        className={cn(sizeMap[size])}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="80" height="80" rx="20" fill="var(--color-primary-100)" />

        {/* Back card — lightest, 30deg clockwise */}
        <rect
          x="25"
          y="18"
          width="26"
          height="36"
          rx="5"
          fill="var(--color-primary-200)"
          stroke="var(--color-primary-100)"
          strokeWidth="2"
          transform="rotate(28 38 36)"
        />

        {/* Middle card — medium blue, vertical */}
        <rect
          x="25"
          y="18"
          width="26"
          height="36"
          rx="5"
          fill="var(--color-primary-300)"
          stroke="var(--color-primary-100)"
          strokeWidth="2"
        />

        {/* Front card — primary blue, 18deg counter-clockwise */}
        <rect
          x="25"
          y="18"
          width="26"
          height="36"
          rx="5"
          fill="var(--color-primary-500)"
          stroke="var(--color-primary-100)"
          strokeWidth="2"
          transform="rotate(-18 38 36)"
        />

        {/* Circle on front card — upper left, background color */}
        <circle cx="32" cy="29" r="2.5" fill="var(--color-primary-100)" />
      </svg>
    </div>
  );
}
