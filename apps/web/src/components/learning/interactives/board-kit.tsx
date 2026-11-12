import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { INK, MUTE, PEG, SEAM } from "../bands";

/**
 * Shared SVG building blocks for interactive boards: a peg lattice
 * (the geoboard ground) and a labelled coordinate plane.
 */

export function Svg({
  width,
  height,
  label,
  children,
  box,
  anchoring = false,
  gutter,
}: {
  width: number;
  height: number;
  label: string;
  children: ReactNode;
  /** Optional crop: fit the visible figure instead of the whole lattice. */
  box?: { x: number; y: number; w: number; h: number };
  /** Stage-1 anchoring: zero numbers or notation on the board (bible §2, Stage 1). */
  anchoring?: boolean;
  /** Extra room left of / below the board for axis rails, outside the board's own coordinates. */
  gutter?: { left?: number; bottom?: number };
}) {
  const left = gutter?.left ?? 0;
  const bottom = gutter?.bottom ?? 0;
  const vb = box ?? { x: 0, y: 0, w: width, h: height };
  return (
    <svg
      viewBox={`${vb.x - left} ${vb.y} ${vb.w + left} ${vb.h + bottom}`}
      className={`block h-auto w-full touch-none select-none${anchoring ? " gb-anchoring" : ""}`}
      role="img"
      aria-label={label}
      style={{ fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </svg>
  );
}

/** Pegs at every integer lattice point of a rectangular region. */
export function Lattice({
  cols,
  rows,
  unit,
  ox = 0,
  oy = 0,
  r = 1.8,
}: {
  cols: number;
  rows: number;
  unit: number;
  ox?: number;
  oy?: number;
  r?: number;
}) {
  const pegs = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) out.push({ x: ox + i * unit, y: oy + j * unit });
    return out;
  }, [cols, rows, unit, ox, oy]);
  return (
    <g aria-hidden>
      {pegs.map((p) => (
        <circle key={`${p.x}:${p.y}`} cx={p.x} cy={p.y} r={r} fill={PEG} />
      ))}
    </g>
  );
}

export interface PlaneScale {
  x: (v: number) => number;
  y: (v: number) => number;
  /** Inverse of x / y: a board (viewBox) coordinate back to a plane value, for dragging. */
  fromX: (px: number) => number;
  fromY: (py: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xUnit: number;
  yUnit: number;
}

export function usePlane(opts: {
  width: number;
  height: number;
  pad: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}): PlaneScale {
  const { width, height, pad, xMin, xMax, yMin, yMax } = opts;
  return useMemo(() => {
    const xUnit = (width - pad * 2) / (xMax - xMin);
    const yUnit = (height - pad * 2) / (yMax - yMin);
    return {
      x: (v: number) => pad + (v - xMin) * xUnit,
      y: (v: number) => height - pad - (v - yMin) * yUnit,
      fromX: (px: number) => xMin + (px - pad) / xUnit,
      fromY: (py: number) => yMin + (height - pad - py) / yUnit,
      xMin,
      xMax,
      yMin,
      yMax,
      xUnit,
      yUnit,
    };
  }, [width, height, pad, xMin, xMax, yMin, yMax]);
}

/** Tick labels sit off their peg and knock out whatever is drawn behind them. */
const KNOCKOUT = {
  paintOrder: "stroke",
  stroke: "var(--color-gb-ground)",
  strokeWidth: 3,
  strokeLinejoin: "round",
} as const;

/** Pegs on integer coordinates, axes through the origin, tabular tick labels on the axes. */
/** Tick labels: render LAST so they sit above plotted marks, knocked out from them. */
export function PlaneTicks({
  s,
  yStep = 1,
  avoid = [],
}: {
  s: PlaneScale;
  yStep?: number;
  /** Plane points carrying marks (targets, start dots): tick labels next to them step aside. */
  avoid?: { x: number; y: number }[];
}) {
  const near = (px: number, py: number) => avoid.some((a) => Math.hypot(s.x(a.x) - px, s.y(a.y) - py) < 16);
  const xs: number[] = [];
  for (let v = Math.ceil(s.xMin); v <= s.xMax; v++) if (v !== 0 && !near(s.x(v) + 9, s.y(0) + 11)) xs.push(v);
  const ys: number[] = [];
  for (let v = Math.ceil(s.yMin); v <= s.yMax; v++)
    if (v !== 0 && v % yStep === 0 && !near(s.x(0) - 11, s.y(v) - 9)) ys.push(v);
  const x0 = s.x(0);
  const y0 = s.y(0);
  return (
    <g aria-hidden>
      {xs.map((v) => (
        <text key={`x${v}`} x={s.x(v) + 5} y={y0 + 15} fontSize={11} fill={MUTE} textAnchor="start" {...KNOCKOUT}>
          {v}
        </text>
      ))}
      {ys.map((v) => (
        <text key={`y${v}`} x={x0 - 7} y={s.y(v) - 5} fontSize={11} fill={MUTE} textAnchor="end" {...KNOCKOUT}>
          {v}
        </text>
      ))}
      <text x={x0 - 7} y={y0 + 15} fontSize={11} fill={MUTE} textAnchor="end" {...KNOCKOUT}>
        0
      </text>
    </g>
  );
}

/**
 * Keeps a label's baseline out of the x-axis tick-label row (drawn at y0 + 15), moving it just
 * above the axis or just below the row so it never prints on top of the numbers.
 */
export function clearOfXTicks(s: PlaneScale, y: number, down: boolean): number {
  const y0 = s.y(0);
  if (y <= y0 + 3 || y >= y0 + 30) return y;
  return down ? y0 + 32 : y0 - 6;
}

/** Pegs and axes only; pair with <PlaneTicks /> drawn after the marks. */
export function PlaneGrid({ s }: { s: PlaneScale; yStep?: number }) {
  const xs: number[] = [];
  for (let v = Math.ceil(s.xMin); v <= s.xMax; v++) xs.push(v);
  const ys: number[] = [];
  for (let v = Math.ceil(s.yMin); v <= s.yMax; v++) ys.push(v);
  const x0 = s.x(0);
  const y0 = s.y(0);
  return (
    <g aria-hidden>
      {xs.map((xv) =>
        ys.map((yv) => <circle key={`${xv}:${yv}`} cx={s.x(xv)} cy={s.y(yv)} r={1.6} fill={PEG} />)
      )}
      <line x1={s.x(s.xMin)} x2={s.x(s.xMax)} y1={y0} y2={y0} stroke={SEAM} strokeWidth={1.5} />
      <line x1={x0} x2={x0} y1={s.y(s.yMin)} y2={s.y(s.yMax)} stroke={SEAM} strokeWidth={1.5} />
    </g>
  );
}

/** A small label chip anchored to a point on the board (spatial contiguity). */
export function Tag({
  x,
  y,
  children,
  color = INK,
  anchor = "middle",
  size = 13,
  weight = 700,
  k = 1,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
  weight?: number;
  /** Scale factor when the board is cropped, so labels keep their on-screen size. */
  k?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size * k}
      fontWeight={weight}
      fill={color}
      textAnchor={anchor}
      paintOrder="stroke"
      stroke="var(--color-gb-ground)"
      strokeWidth={4 * k}
      strokeLinejoin="round"
    >
      {children}
    </text>
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Back-out easing: a short overshoot, then settle — the band's elastic snap. */
function easeOutBack(t: number) {
  const c1 = 1.56;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

/**
 * Settle numeric values with the world's signature spring (≤240ms, slight overshoot).
 * Returns the displayed values; snaps instantly under reduced motion or when disabled.
 */
export function useSettle(target: number[], enabled = true, ms = 240): number[] {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  const key = target.join("|");

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!enabled || prefersReducedMotion()) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const k = easeOutBack(t);
      const next = target.map((v, i) => (origin[i] ?? v) + (v - (origin[i] ?? v)) * k);
      from.current = next;
      setShown(next);
      if (t < 1) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [key, enabled, ms]); // eslint-disable-line react-hooks/exhaustive-deps

  return enabled ? shown : target;
}

/** Clip a line y = m·x + b to the plane's visible box. */
export function lineEnds(s: PlaneScale, m: number, b: number) {
  const pts: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => {
    if (x >= s.xMin - 1e-9 && x <= s.xMax + 1e-9 && y >= s.yMin - 1e-9 && y <= s.yMax + 1e-9) pts.push({ x, y });
  };
  push(s.xMin, m * s.xMin + b);
  push(s.xMax, m * s.xMax + b);
  if (m !== 0) {
    push((s.yMin - b) / m, s.yMin);
    push((s.yMax - b) / m, s.yMax);
  }
  pts.sort((p, q) => p.x - q.x);
  if (pts.length < 2) return null;
  return { x1: s.x(pts[0]!.x), y1: s.y(pts[0]!.y), x2: s.x(pts[pts.length - 1]!.x), y2: s.y(pts[pts.length - 1]!.y) };
}
