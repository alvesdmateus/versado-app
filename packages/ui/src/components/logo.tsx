import { cn } from "../lib/cn";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6",
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
} as const;

/*
 * The Versado mark: a V drawn as a square-root sign, built as a solid block with its depth
 * up and to the left. Geometry on a 256 grid, generated with the masters in apps/web/brand/.
 */

/** Depth faces, drawn behind the front face. "top" faces catch more light than "side" faces. */
export const VERSADO_MARK_DEPTH = [
  { kind: "side", points: "69.5,151.9 115.7,232.0 99.7,216.0 53.5,135.9" },
  { kind: "side", points: "163.3,48.0 119.1,173.8 103.1,157.8 147.3,32.0" },
  { kind: "top", points: "230.6,48.0 163.3,48.0 147.3,32.0 214.6,32.0" },
  { kind: "side", points: "41.4,131.1 57.3,158.9 41.3,142.9 25.4,115.1" },
  { kind: "top", points: "81.2,108.1 41.4,131.1 25.4,115.1 65.2,92.1" },
] as const;

/** The front face of the block mark. On its own it is the one-colour mark. */
export const VERSADO_MARK_FRONT =
  "57.3,158.9 69.5,151.9 115.7,232.0 132.6,232.0 186.0,80.0 230.6,80.0 230.6,48.0 163.3,48.0 119.1,173.8 81.2,108.1 41.4,131.1";

/** Heavier flat cut for 24 px and below, where the depth faces turn to noise. */
export const VERSADO_MARK_SMALL =
  "52.3,153.3 61.0,148.3 105.2,225.0 129.1,225.0 181.8,75.0 223.6,75.0 223.6,35.0 153.5,35.0 111.2,155.3 75.7,93.7 32.4,118.7";

const DEPTH_OPACITY = { top: 0.8, side: 0.5 } as const;

/**
 * App-icon style logo: the white mark on a solid brand-blue tile, the same in both themes.
 * A caller can retint the tile by setting `--logo-tile` on an ancestor (e.g. the error dialog).
 */
export function Logo({ size = "md", className }: LogoProps) {
  const small = size === "xs";

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      <svg
        className={sizeMap[size]}
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="256" height="256" rx="56" style={{ fill: "var(--logo-tile, #2d6be6)" }} />
        {small ? (
          <polygon
            points={VERSADO_MARK_SMALL}
            fill="#fff"
            transform="translate(23.04 23.04) scale(0.82)"
          />
        ) : (
          <g transform="translate(32 32) scale(0.75)" fill="#fff">
            {VERSADO_MARK_DEPTH.map((face) => (
              <polygon key={face.points} points={face.points} fillOpacity={DEPTH_OPACITY[face.kind]} />
            ))}
            <polygon points={VERSADO_MARK_FRONT} />
          </g>
        )}
      </svg>
    </span>
  );
}
