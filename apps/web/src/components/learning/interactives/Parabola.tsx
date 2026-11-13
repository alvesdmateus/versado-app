import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, fmt, signed, INK, MUTE } from "../bands";
import { clearOfXTicks, PlaneGrid, PlaneTicks, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { DragArea, PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/**
 * Quadratics on a square-unit plane. One board, three modules, picked by the exposed controls:
 *  - "a":  y = a·x²            — bend and opening alone (vertex pinned at the origin).
 *  - "hk": y = a(x − h)² + k   — the vertex carries the whole curve (a held fixed or given by the target).
 *  - "bc": y = a·x² + b·x + c  — c is the crossing height, b is the lean (slope) of the curve there.
 */

const W = 340;
const PAD = 26;

/** Square-unit windows per mode. The general form is wider and taller so the vertex (−b/2, c − b²/4) stays on the board. */
const WINDOWS = {
  a: { xMin: -3, xMax: 3, yMin: -4, yMax: 4 },
  hk: { xMin: -2, xMax: 4, yMin: -2, yMax: 6 },
  bc: { xMin: -4, xMax: 4, yMin: -6, yMax: 6 },
  // Roots: the vertex travels down to k = −4 under a fixed axis at h = 2.
  roots: { xMin: -1, xMax: 5, yMin: -5, yMax: 3 },
} as const;

type WindowKey = keyof typeof WINDOWS;

function heightFor(key: WindowKey) {
  const w = WINDOWS[key];
  const unit = (W - PAD * 2) / (w.xMax - w.xMin);
  return PAD * 2 + unit * (w.yMax - w.yMin);
}

type Mode = "a" | "hk" | "bc";

function modeOf(spec: ModuleSpec): Mode {
  const names = spec.stage2Exploration.controls.map((c) => c.variableName);
  if (names.includes("h") || names.includes("k")) return "hk";
  if (names.includes("b") || names.includes("c")) return "bc";
  return "a";
}

const fixedOf = (spec: ModuleSpec): Values => spec.stage2Exploration.fixed ?? {};

/**
 * Roots view: the vertex form with only k under the learner's hand (a and h fixed).
 * Lowering the vertex through the floor makes the crossings — the roots — appear, merge and vanish.
 */
function isRootsView(spec: ModuleSpec): boolean {
  const names = spec.stage2Exploration.controls.map((c) => c.variableName);
  return names.length === 1 && names[0] === "k";
}

/** Where y = a(x − h)² + k meets the floor: h ± √(−k/a), or none. */
export function rootsOf(a: number, h: number, k: number): number[] {
  if (a === 0) return [];
  const q = -k / a;
  if (q < -1e-9) return [];
  if (Math.abs(q) <= 1e-9) return [h];
  const d = Math.sqrt(q);
  return [h - d, h + d];
}

/** Target points (x1,y1), (x2,y2)… in order. */
function targetPoints(target: Values) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 1; i <= 4; i++) {
    const x = target[`x${i}`];
    const y = target[`y${i}`];
    if (x !== undefined && y !== undefined) pts.push({ x, y });
  }
  return pts;
}

/** Evaluate the curve for any parameter set (vertex or general form). */
export function curve(mode: Mode, v: Values): (x: number) => number {
  const a = v.a ?? 1;
  if (mode === "bc") return (x) => a * x * x + (v.b ?? 0) * x + (v.c ?? 0);
  return (x) => a * (x - (v.h ?? 0)) ** 2 + (v.k ?? 0);
}

function solveFor(mode: Mode, target: Values, fixed: Values): Values {
  const [p1, p2] = targetPoints(target);
  if (mode === "a") {
    const h = fixed.h ?? 0;
    const k = fixed.k ?? 0;
    return { a: p1 ? (p1.y - k) / (p1.x - h) ** 2 : 1, h, k };
  }
  const a = target.a ?? fixed.a ?? 1;
  if (!p1 || !p2) return { a, h: 0, k: 0, b: 0, c: 0 };
  if (mode === "hk") {
    const h = (p1.x + p2.x) / 2 - (p1.y - p2.y) / (2 * a * (p1.x - p2.x));
    return { a, h, k: p1.y - a * (p1.x - h) ** 2 };
  }
  const r1 = p1.y - a * p1.x * p1.x;
  const r2 = p2.y - a * p2.x * p2.x;
  const b = (r1 - r2) / (p1.x - p2.x);
  return { a, b, c: r1 - b * p1.x };
}

/** Stage-1 anchoring motion per mode (t from 0 to 1), with no numbers on screen. */
function anchorParams(mode: Mode, t: number, fixed: Values, roots = false): Values {
  // Roots: the vertex sinks through the floor and rises back — two crossings, one, none.
  if (roots) return { a: fixed.a ?? 1, h: fixed.h ?? 2, k: 2 * Math.cos(2 * Math.PI * t) };
  if (mode === "a") return { a: 2 - 4 * t, h: fixed.h ?? 0, k: fixed.k ?? 0 }; // narrow up → flat line → narrow down
  if (mode === "hk") return { a: fixed.a ?? 1, h: 1 + 1.5 * Math.sin(2 * Math.PI * t), k: 1.5 + 1.5 * Math.cos(2 * Math.PI * t) };
  return { a: fixed.a ?? 1, b: 3 * Math.sin(2 * Math.PI * t), c: fixed.c ?? 1 }; // lean swings, the crossing stays
}

/**
 * Room for the rails this module's controls need, fixed for the whole lesson so the board never
 * resizes between stages: h needs the bottom, k and c the left.
 */
function railGutter(spec: ModuleSpec): { left?: number; bottom?: number } | undefined {
  const names = spec.stage2Exploration.controls.map((c) => c.variableName);
  const left = names.includes("k") || names.includes("c");
  const bottom = names.includes("h");
  if (!left && !bottom) return undefined;
  return { left: left ? RAIL_GUTTER : 0, bottom: bottom ? RAIL_GUTTER : 0 };
}

/** The curve as an SVG path over the window (clamped just past its edges). */
function curveD(s: PlaneScale, f: (x: number) => number): string {
  const step = (s.xMax - s.xMin) / 160;
  let d = "";
  for (let x = s.xMin; x <= s.xMax + 1e-9; x += step) {
    const y = Math.max(s.yMin - 2, Math.min(s.yMax + 2, f(x)));
    d += `${d ? "L" : "M"}${s.x(x).toFixed(1)},${s.y(y).toFixed(1)}`;
  }
  return d;
}

function CurvePath({ s, f, color, clipId }: { s: PlaneScale; f: (x: number) => number; color: string; clipId: string }) {
  return (
    <path d={curveD(s, f)} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${clipId})`} />
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const mode = modeOf(spec);
  const fixed = fixedOf(spec);
  const windowKey: WindowKey = isRootsView(spec) ? "roots" : mode;
  const H = heightFor(windowKey);
  const s = usePlane({ width: W, height: H, pad: PAD, ...WINDOWS[windowKey] });
  const clipId = useId().replace(/:/g, "");
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const violet = bandColor("violet");
  const emerald = bandColor("emerald");
  const red = bandColor("red");
  const rose = bandColor("rose");

  // Parameters not under the learner's hand come from the module (fixed) or from the target's own curve.
  const base = stage >= 3 ? { ...fixed, ...solveFor(mode, target, fixed) } : fixed;
  const rootsView = isRootsView(spec);
  const raw: Values = stage === 1 ? anchorParams(mode, anchorT, fixed, rootsView) : { ...base, ...values };
  const keys = mode === "bc" ? ["a", "b", "c"] : ["a", "h", "k"];
  const settled = useSettle(keys.map((key) => raw[key] ?? 0), stage !== 1 && guide == null);
  const p: Values = Object.fromEntries(keys.map((key, i) => [key, settled[i]!]));
  const f = curve(mode, p);
  const formal = stage === 4;
  const morphing = guide != null && guide < 1;
  const board = useBoardInput(input, values);
  const tick = (name: string) => (changed?.name === name ? changed.tick : 0);
  // b reads on its own touching line, left of the crossing (targets sit to the right), off the tick row.
  let bTagY = mode === "bc" ? Math.min(s.y(s.yMin) - 6, Math.max(s.y(s.yMax) + 14, s.y((p.c ?? 0) - 0.5 * (p.b ?? 0)) + 5)) : 0;
  if (mode === "bc" && Math.abs(bTagY - 5 - s.y(0)) < 12) bTagY -= 16;

  const pts = stage >= 3 ? targetPoints(target) : [];
  const vertex = mode === "bc" ? null : { x: p.h!, y: p.k! };
  const isPin = (q: { x: number; y: number }) => mode === "a" && q.x === (fixed.h ?? 0) && q.y === (fixed.k ?? 0);

  // Guided demo (hk): equal heights meet halfway — the axis of symmetry — and the vertex sits on it.
  const [g1, g2] = pts;
  const showHalf = guide != null && g1 && g2 && guide > 0.1;
  const showLevel = guide != null && guide > 0.45 && vertex;

  return (
    <Svg
      anchoring={stage === 1}
      width={W}
      height={H}
      label={`Parabola, ${(p.a ?? 0) > 0 ? "opening up" : (p.a ?? 0) < 0 ? "opening down" : "flat"}`}
      gutter={railGutter(spec)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={s.x(s.xMin)} y={s.y(s.yMax)} width={s.x(s.xMax) - s.x(s.xMin)} height={s.y(s.yMin) - s.y(s.yMax)} />
        </clipPath>
      </defs>
      <PlaneGrid s={s} />

      {/* a: one step out from the vertex, the curve rises (or drops) by a */}
      {mode === "a" && vertex && !morphing && (
        <g key={`a-${tick("a")}`} className="gb-pulse">
          <line x1={s.x(vertex.x)} y1={s.y(vertex.y)} x2={s.x(vertex.x + 1)} y2={s.y(vertex.y)} stroke={MUTE} strokeWidth={2} strokeDasharray="3 3" />
          <line x1={s.x(vertex.x + 1)} y1={s.y(vertex.y)} x2={s.x(vertex.x + 1)} y2={s.y(vertex.y + p.a!)} stroke={amber} strokeWidth={4} strokeLinecap="round" />
          <Tag
            x={s.x(vertex.x + 1) + 8}
            y={clearOfXTicks(s, (s.y(vertex.y) + s.y(vertex.y + p.a!)) / 2 + (Math.abs(p.a!) < 0.3 ? -12 : 5), p.a! < 0)}
            color={amber}
            anchor="start"
          >
            {formal ? `a = ${fmt(raw.a ?? 0)}` : signed(raw.a ?? 0)}
          </Tag>
        </g>
      )}

      {/* hk: axis of symmetry through h, and the vertex at height k */}
      {mode === "hk" && vertex && (
        <g>
          <line
            key={`h-${tick("h")}`}
            className="gb-pulse"
            x1={s.x(vertex.x)}
            x2={s.x(vertex.x)}
            y1={s.y(s.yMin)}
            y2={s.y(s.yMax)}
            stroke={emerald}
            strokeWidth={2}
            strokeDasharray="4 4"
            style={{ ["--sw" as string]: "2px" }}
          />
          {!morphing && (
            <Tag x={s.x(vertex.x) + 6} y={s.y(s.yMax) + 14} color={emerald} anchor="start">
              {formal ? `h = ${fmt(raw.h ?? 0)}` : fmt(raw.h ?? 0)}
            </Tag>
          )}
        </g>
      )}

      {/* bc: the lean b drawn as a short tangent at the crossing (0, c) */}
      {mode === "bc" && !morphing && (
        <g key={`b-${tick("b")}`} className="gb-pulse">
          <line x1={s.x(-1)} y1={s.y(p.c! - p.b!)} x2={s.x(1)} y2={s.y(p.c! + p.b!)} stroke={amber} strokeWidth={3} strokeLinecap="round" clipPath={`url(#${clipId})`} />
          <Tag x={s.x(-0.5) - 8} y={bTagY} color={amber} anchor="end">
            {formal ? `b = ${fmt(raw.b ?? 0)}` : signed(raw.b ?? 0)}
          </Tag>
        </g>
      )}

      {/* Guided demonstration overlays */}
      {showHalf && g1 && g2 && (
        <g>
          <line x1={s.x(g1.x)} y1={s.y(g1.y)} x2={s.x(g2.x)} y2={s.y(g2.y)} stroke={MUTE} strokeWidth={2.5} strokeDasharray="3 3" />
          <circle cx={s.x((g1.x + g2.x) / 2)} cy={s.y((g1.y + g2.y) / 2)} r={4} fill={MUTE} />
        </g>
      )}
      {showLevel && vertex && (
        <line x1={s.x(0)} y1={s.y(vertex.y)} x2={s.x(vertex.x)} y2={s.y(vertex.y)} stroke={violet} strokeWidth={2.5} strokeDasharray="3 3" />
      )}

      <CurvePath s={s} f={f} color={blue} clipId={clipId} />

      {/* Roots: where the curve meets the floor, as ink rings on the x-axis with their positions */}
      {rootsView &&
        (() => {
          const xs = rootsOf(p.a ?? 1, p.h ?? 0, p.k ?? 0).filter((x) => x >= s.xMin && x <= s.xMax);
          const touching = xs.length === 1;
          return (
            <g key={`roots-${xs.length}`} className="gb-pulse">
              {xs.map((x, i) => (
                <g key={i}>
                  <circle cx={s.x(x)} cy={s.y(0)} r={touching ? 9 : 7} fill="var(--color-gb-ground)" stroke={INK} strokeWidth={touching ? 3 : 2.5} />
                  {!morphing && (
                    <Tag x={s.x(x)} y={s.y(0) + 26} color={INK} size={12}>
                      {fmt(Math.round(x * 100) / 100)}
                    </Tag>
                  )}
                </g>
              ))}
            </g>
          );
        })()}

      {/* Sign error: the opening (a) or lean (b) the answer needed, as a dashed red arrow */}
      {verdict?.kind === "sign" && (() => {
        const goal = solveFor(mode, target, fixed);
        // a: the step bar one unit out must point the other way; b: the lean at the crossing must flip.
        const ox = mode === "bc" ? 0 : (vertex?.x ?? 0) + 1;
        const oy = mode === "bc" ? p.c! : (vertex?.y ?? 0);
        const dx = mode === "bc" ? 1.2 : 0;
        const dy = mode === "bc" ? Math.sign(goal.b!) * 1.2 : Math.sign(goal.a!) * 1.4;
        const x2 = s.x(ox + dx);
        const y2 = s.y(oy + dy);
        const ang = Math.atan2(y2 - s.y(oy), x2 - s.x(ox));
        const tip = (a: number) => `${x2 - 11 * Math.cos(a)},${y2 - 11 * Math.sin(a)}`;
        return (
          <g>
            <line x1={s.x(ox)} y1={s.y(oy)} x2={x2} y2={y2} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
            <polygon points={`${x2},${y2} ${tip(ang - 0.45)} ${tip(ang + 0.45)}`} fill={red} />
          </g>
        );
      })()}

      {/* Target points and, after a miss, the dashed gaps to the curve (kept on the board) */}
      {pts
        .filter((q) => !isPin(q))
        .map((q, i) => {
          const on = f(q.x);
          const gap = q.y - on;
          const missed = verdict && !verdict.correct && Math.abs(gap) > 1e-9;
          const shown = Math.min(s.yMax, Math.max(s.yMin, on));
          const cut = shown !== on;
          let tagY = (s.y(shown) + s.y(q.y)) / 2 + 5;
          if (Math.abs(tagY - 5 - s.y(0)) < 12) tagY -= 16;
          return (
            <g key={i}>
              {missed && (
                <>
                  <line x1={s.x(q.x)} y1={s.y(shown)} x2={s.x(q.x)} y2={s.y(q.y)} stroke={red} strokeWidth={2.5} strokeDasharray="5 4" className="gb-march" />
                  {cut && <line x1={s.x(q.x) - 7} x2={s.x(q.x) + 7} y1={s.y(shown)} y2={s.y(shown)} stroke={red} strokeWidth={2.5} />}
                  <Tag x={s.x(q.x) + 10} y={tagY} color={red} anchor="start" size={12}>
                    {signed(gap)}
                  </Tag>
                </>
              )}
              <circle cx={s.x(q.x)} cy={s.y(q.y)} r={11} fill="none" stroke={rose} strokeWidth={2} />
              <circle cx={s.x(q.x)} cy={s.y(q.y)} r={4.5} fill={rose} />
            </g>
          );
        })}

      {/* Vertex (a, hk) or crossing (bc), drawn above target marks */}
      {mode === "a" && vertex && <circle cx={s.x(vertex.x)} cy={s.y(vertex.y)} r={5.5} fill={INK} />}
      {mode === "hk" && vertex && (
        <g key={`k-${tick("k")}`}>
          <circle className="gb-pulse" cx={s.x(vertex.x)} cy={s.y(vertex.y)} r={7} fill={violet} stroke="var(--color-gb-ground)" strokeWidth={2} />
          {!morphing && (
            <Tag x={s.x(vertex.x) + 12} y={s.y(vertex.y) + ((p.a ?? 1) > 0 ? 20 : -12)} color={violet} anchor="start">
              {formal ? `k = ${fmt(raw.k ?? 0)}` : fmt(raw.k ?? 0)}
            </Tag>
          )}
        </g>
      )}
      {mode === "bc" && (
        <g key={`c-${tick("c")}`}>
          <circle className="gb-pulse" cx={s.x(0)} cy={s.y(p.c!)} r={7} fill={violet} stroke="var(--color-gb-ground)" strokeWidth={2} />
          {!morphing && (
            <Tag x={s.x(0) - 12} y={s.y(p.c!) - 10} color={violet} anchor="end">
              {formal ? `c = ${fmt(raw.c ?? 0)}` : fmt(raw.c ?? 0)}
            </Tag>
          )}
        </g>
      )}

      <PlaneTicks
        s={s}
        avoid={[
          ...pts,
          ...(rootsView ? rootsOf(p.a ?? 1, p.h ?? 0, p.k ?? 0).map((x) => ({ x, y: 0 })) : []),
          ...(vertex ? [vertex] : []),
          ...(mode === "bc" ? [{ x: 0, y: p.c! }, { x: -0.5, y: p.c! - 0.5 * p.b! }] : []),
        ]}
      />
      {/* Positions ride rails: h along the bottom (under the vertex), k and c up the left (level with them) */}
      <Rails
        input={input}
        values={raw}
        bind={{
          h: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(p.k ?? 0) },
          k: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(p.h ?? 0) },
          c: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(0) },
        }}
      />

      {/* Direct manipulation: bend the curve itself, or carry its vertex / crossing point */}
      {(board.can("a") || board.can("b")) && (
        <DragArea
          onDrag={(pt) => {
            const x = s.fromX(pt.x);
            const y = s.fromY(pt.y);
            if (mode === "a") {
              const dx = x - (raw.h ?? 0);
              if (Math.abs(dx) >= 0.35) board.set("a", (y - (raw.k ?? 0)) / (dx * dx));
            } else if (mode === "bc" && Math.abs(x) >= 0.35) {
              board.set("b", (y - (raw.a ?? 1) * x * x - (raw.c ?? 0)) / x);
            }
          }}
        >
          <path d={curveD(s, curve(mode, raw))} fill="none" stroke="transparent" strokeWidth={26} clipPath={`url(#${clipId})`} />
        </DragArea>
      )}
      {board.can("a") && mode === "a" && (
        <PlaneHandle
          x={s.x((raw.h ?? 0) + 1)}
          y={s.y((raw.k ?? 0) + (raw.a ?? 0))}
          color={amber}
          cursor="ns-resize"
          r={6}
          onDrag={(pt) => board.set("a", s.fromY(pt.y) - (raw.k ?? 0))}
        />
      )}
      {(board.can("h") || board.can("k")) && (
        <PlaneHandle
          x={s.x(raw.h ?? 0)}
          y={s.y(raw.k ?? 0)}
          color={violet}
          cursor={board.can("h") && board.can("k") ? "move" : board.can("k") ? "ns-resize" : "ew-resize"}
          onDrag={(pt) => {
            board.set("h", s.fromX(pt.x));
            board.set("k", s.fromY(pt.y));
          }}
        />
      )}
      {board.can("c") && mode === "bc" && (
        <PlaneHandle x={s.x(0)} y={s.y(raw.c ?? 0)} color={violet} cursor="ns-resize" onDrag={(pt) => board.set("c", s.fromY(pt.y))} />
      )}
    </Svg>
  );
}

/** Parameters the learner controls start neutral at the prediction gate. */
const NEUTRAL: Values = { a: 1, h: 0, k: 0, b: 0, c: 0 };

/** Spec-less fallback (never used by the player, which always passes the spec). */
const DEFAULT_SPEC = { stage2Exploration: { controls: [], fixed: {} } } as unknown as ModuleSpec;

export const parabola: InteractiveDefinition = {
  Board,
  axes: { h: "x", k: "y", c: "y" },
  initialValues(spec, stage, target) {
    const mode = modeOf(spec);
    const fixed = fixedOf(spec);
    if (stage === 4) return solveFor(mode, target, fixed);
    const controls = spec.stage2Exploration.controls;
    if (stage === 3) {
      const v: Values = { ...fixed, ...solveFor(mode, target, fixed) };
      for (const c of controls) v[c.variableName] = NEUTRAL[c.variableName] ?? 0;
      return v;
    }
    const v: Values = { ...fixed };
    for (const c of controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(spec) {
    return spec.stage2Exploration.controls.map((c) => ({
      variableName: c.variableName,
      label: c.label,
      min: c.min,
      max: c.max,
      step: c.step,
      colorToken: c.colorToken,
    }));
  },
  solve(target, spec = DEFAULT_SPEC) {
    return solveFor(modeOf(spec), target, fixedOf(spec));
  },
  evaluate(values, target, tolerance, spec = DEFAULT_SPEC) {
    const mode = modeOf(spec);
    const fixed = fixedOf(spec);
    const goal = solveFor(mode, target, fixed);
    const params: Values = { ...fixed, ...goal, ...values };
    const f = curve(mode, params);
    const gaps = targetPoints(target)
      .filter((q) => !(mode === "a" && q.x === (fixed.h ?? 0) && q.y === (fixed.k ?? 0)))
      .map((q) => q.y - f(q.x));
    const worst = gaps.reduce((w, g) => (Math.abs(g) > Math.abs(w) ? g : w), 0);
    const correct = gaps.every((g) => Math.abs(g) <= tolerance + 1e-9);
    // Opening the wrong way (a) or leaning the wrong way at the crossing (b) is the misconception to name.
    if (!correct && isRootsView(spec) && (params.a ?? 1) * (params.k ?? 0) > 0) {
      return { correct, delta: worst, kind: "noRoots" as const };
    }
    if (!correct && mode === "hk" && gaps.length >= 2) {
      const equal = gaps.every((g) => Math.abs(g - gaps[0]!) <= 1e-9);
      return { correct, delta: worst, kind: equal ? ("height" as const) : ("axis" as const) };
    }
    const key = mode === "a" ? "a" : mode === "bc" ? "b" : null;
    const signError =
      !correct &&
      key !== null &&
      (goal[key] ?? 0) !== 0 &&
      (params[key] ?? 0) !== 0 &&
      Math.sign(params[key]!) !== Math.sign(goal[key]!);
    return signError ? { correct, delta: worst, kind: "sign" as const } : { correct, delta: worst };
  },
  formatDelta(v) {
    return signed(v.delta);
  },
};
