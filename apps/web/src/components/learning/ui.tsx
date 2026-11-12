import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@versado/ui";

export function PrimaryButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-[5px] bg-gb-ink px-5 text-base font-bold text-gb-ground transition-[transform,opacity] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-35",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-[5px] border border-gb-seam px-5 text-base font-semibold text-gb-ink transition-colors hover:border-gb-mute disabled:opacity-40",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Four hairline segments: the lesson blueprint as a progress rail. */
export function StageRail({ stage, labels }: { stage: number; labels: string[] }) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <ol className="flex flex-1 gap-1" aria-label={`${stage} / ${labels.length}`}>
        {labels.map((label, i) => (
          <li key={label} className="flex-1">
            <span
              className={cn(
                "block h-1 rounded-full transition-colors duration-200",
                i + 1 < stage ? "bg-gb-ink" : i + 1 === stage ? "bg-band-red" : "bg-gb-seam"
              )}
            />
            <span className="sr-only">
              {label}
              {i + 1 === stage ? " (current)" : ""}
            </span>
          </li>
        ))}
      </ol>
      <span className="shrink-0 text-xs font-semibold text-gb-mute">{labels[stage - 1]}</span>
    </div>
  );
}

/** The board sits on a hairline-seamed panel; no shadows anywhere in this world. */
export function BoardPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[6px] border border-gb-seam bg-gb-ground p-2", className)}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gb-seam border-t-gb-ink motion-reduce:animate-none"
      aria-hidden
    />
  );
}
