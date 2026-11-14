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

/**
 * A seam stretched between two pegs, with its label hooked on the left:
 * the board's way of dividing a list into groups.
 */
export function PegDivider({ label, count, id, className }: { label: string; count?: number; id?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gb-peg" />
      <h2 id={id} className="shrink-0 text-xs font-semibold text-gb-mute">
        {label}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-gb-seam" />
      {count !== undefined && (
        <span aria-hidden className="shrink-0 text-xs font-semibold tabular-nums text-gb-mute">
          {count}
        </span>
      )}
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gb-peg" />
    </div>
  );
}

/** A track's mark: one band hooked across a 3×3 peg square. Dashed = not here yet. */
export function TrackGlyph({ color, dashed, className }: { color: string; dashed?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-12 w-12 shrink-0", className)} aria-hidden>
      {[8, 24, 40].map((x) => [8, 24, 40].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill="var(--color-gb-peg)" />))}
      <polyline
        points="8,40 24,8 40,24 8,40"
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeDasharray={dashed ? "4 4" : undefined}
      />
    </svg>
  );
}

/** Modules done, as an ink band on a seam rail. */
export function ProgressRail({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <span aria-hidden className={cn("relative block h-1 w-full overflow-hidden rounded-full bg-gb-seam", className)}>
      <span className="absolute inset-y-0 left-0 rounded-full bg-gb-ink" style={{ width: `${pct}%` }} />
    </span>
  );
}

/** "Due" as a pill: blue tinted from the band, matching the dashed ring on the peg and the due links. */
export function DuePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums text-band-blue",
        "bg-[color-mix(in_srgb,var(--color-band-blue)_14%,transparent)]",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Progress under a track or chapter title: "N of M modules" (or a state such as Locked / Done), plus due
 * checks as the blue pill. Shared by every card and panel so the rail is never the only progress cue.
 */
export function ProgressCaption({ label, due = 0, dueLabel, className }: { label: string; due?: number; dueLabel?: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-xs font-semibold tabular-nums text-gb-mute", className)}>
      <span>{label}</span>
      {due > 0 && dueLabel && <DuePill>{dueLabel}</DuePill>}
    </span>
  );
}
