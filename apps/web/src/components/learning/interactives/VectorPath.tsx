import type { ModuleSpec } from "@versado/core";
import { bandColor, fmt, signed } from "../bands";
import { Arrow, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/**
 * Moves add up: a trip of two moves (first blue, second amber, tip to tail) ends where one straight
 * shortcut (emerald) ends. Exploring bends the second move; predicting builds the shortcut while the
 * second move floats apart, and the reveal snaps it onto the first one's tip.
 */

const W = 340;
const H = 340;
const RANGE = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 } as const;

type P = { x: number; y: number };

const EXPLORE_START: P = { x: -4, y: -3 };
const ANCHOR = { start: { x: -4, y: -1 }, u: { x: 3, y: 2 }, v: { x: 2, y: -3 } };

function inside(s: PlaneScale, p: P) {
  return p.x >= s.xMin && p.x <= s.xMax && p.y >= s.yMin && p.y <= s.yMax;
}

/** Start the trip so its whole path is centred on the plane. */
export function tripStart(u: P, v: P): P {
  const xs = [0, u.x, u.x + v.x];
  const ys = [0, u.y, u.y + v.y];
  return {
    x: Math.round(-(Math.min(...xs) + Math.max(...xs)) / 2),
    y: Math.round(-(Math.min(...ys) + Math.max(...ys)) / 2),
  };
}

/** A spot for the floating second move: on the board, away from the trip's real chaining point. */
function floatStart(s: PlaneScale, start: P, u: P, v: P): P {
  const chained = { x: start.x + u.x, y: start.y + u.y };
  const spots: P[] = [
    { x: 4, y: -4 },
    { x: -4, y: 4 },
    { x: 4, y: 4 },
    { x: -4, y: -4 },
    { x: 0, y: -4 },
    { x: 0, y: 4 },
  ];
  const fit = (p: P) => ({ x: Math.min(s.xMax, Math.max(s.xMin, p.x + v.x)) - v.x, y: Math.min(s.yMax, Math.max(s.yMin, p.y + v.y)) - v.y });
  for (const spot of spots) {
    const p = fit(spot);
    const far = Math.hypot(p.x - chained.x, p.y - chained.y) > 2.5 && Math.hypot(p.x - start.x, p.y - start.y) > 1.5;
    if (far && inside(s, p) && inside(s, { x: p.x + v.x, y: p.y + v.y })) return p;
  }
  return fit(spots[0]!);
}

function movesOf(spec: ModuleSpec, stage: number, values: Values, target: Values) {
  if (stage === 2) {
    const f = spec.stage2Exploration.fixed ?? {};
    return { u: { x: f.ux ?? 0, y: f.uy ?? 0 }, v: { x: values.vx ?? 0, y: values.vy ?? 0 } };
  }
  return { u: { x: target.ux ?? 0, y: target.uy ?? 0 }, v: { x: target.vx ?? 0, y: target.vy ?? 0 } };
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 26, ...RANGE });
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const emerald = bandColor("emerald");
  const red = bandColor("red");
  const slate = bandColor("slate");
  const board = useBoardInput(input, values);

  const { u, v } = movesOf(spec, stage, values, target);
  const start = stage === 2 ? EXPLORE_START : tripStart(u, v);
  const chained = { x: start.x + u.x, y: start.y + u.y };
  const predicting = stage === 3;
  const revealed = !predicting || verdict !== null || guide != null;
  const floating = floatStart(s, start, u, v);
  // The second move springs from where it floated onto the first move's tip at the reveal.
  const settle = stage !== 1 && guide == null;
  const [vx0, vy0] = useSettle(revealed ? [chained.x, chained.y] : [floating.x, floating.y], settle) as [number, number];
  const [svx, svy] = useSettle([v.x, v.y], settle) as [number, number];
  const [sx, sy] = useSettle([values.sx ?? 0, values.sy ?? 0], settle) as [number, number];

  if (stage === 1) {
    const { start: a, u: au, v: av } = ANCHOR;
    const t1 = span(anchorT, 0, 0.3);
    const t2 = span(anchorT, 0.3, 0.6);
    const t3 = span(anchorT, 0.65, 1);
    const mid = { x: a.x + au.x * t1, y: a.y + au.y * t1 };
    const end = { x: a.x + au.x + av.x * t2, y: a.y + au.y + av.y * t2 };
    const token = t2 > 0 ? end : mid;
    const finish = { x: a.x + au.x + av.x, y: a.y + au.y + av.y };
    return (
      <Svg anchoring width={W} height={H} label="A token takes two moves; a single shortcut reaches the same spot">
        <PlaneGrid s={s} />
        <circle cx={s.x(a.x)} cy={s.y(a.y)} r={5} fill={slate} />
        {t1 > 0 && <Arrow x1={s.x(a.x)} y1={s.y(a.y)} x2={s.x(mid.x)} y2={s.y(mid.y)} color={blue} />}
        {t2 > 0 && <Arrow x1={s.x(a.x + au.x)} y1={s.y(a.y + au.y)} x2={s.x(end.x)} y2={s.y(end.y)} color={amber} />}
        {t3 > 0 && (
          <Arrow x1={s.x(a.x)} y1={s.y(a.y)} x2={s.x(lerp(a.x, finish.x, t3))} y2={s.y(lerp(a.y, finish.y, t3))} color={emerald} width={5} />
        )}
        <circle cx={s.x(token.x)} cy={s.y(token.y)} r={7} fill="var(--color-gb-ink)" />
      </Svg>
    );
  }

  const formal = stage === 4;
  const sum = { x: u.x + v.x, y: u.y + v.y };
  const end = { x: start.x + sum.x, y: start.y + sum.y };
  // While exploring the shortcut is computed; while predicting it is the learner's own arrow.
  const shortcut = predicting ? { x: sx, y: sy } : { x: u.x + svx, y: u.y + svy };
  const rshort = predicting ? { x: values.sx ?? 0, y: values.sy ?? 0 } : sum;
  const tip = { x: start.x + rshort.x, y: start.y + rshort.y };
  const missed = predicting && verdict !== null && !verdict.correct;
  const morphing = guide != null && guide < 1;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";
  const mid = (a: P, d: P) => ({ x: s.x(a.x + d.x / 2), y: s.y(a.y + d.y / 2) });

  const uMid = mid(start, u);
  const vMid = { x: s.x(vx0 + svx / 2), y: s.y(vy0 + svy / 2) };
  const sMid = mid(start, shortcut);

  return (
    <Svg
      width={W}
      height={H}
      label={`First move ${fmt(u.x)}, ${fmt(u.y)}; second move ${fmt(v.x)}, ${fmt(v.y)}; shortcut ${fmt(rshort.x)}, ${fmt(rshort.y)}`}
      gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}
    >
      <PlaneGrid s={s} />
      <circle cx={s.x(start.x)} cy={s.y(start.y)} r={6} fill={slate} />

      <Arrow x1={s.x(start.x)} y1={s.y(start.y)} x2={s.x(chained.x)} y2={s.y(chained.y)} color={blue} />
      <g key={pulse} className={predicting ? undefined : "gb-pulse"}>
        <Arrow x1={s.x(vx0)} y1={s.y(vy0)} x2={s.x(vx0 + svx)} y2={s.y(vy0 + svy)} color={amber} opacity={revealed ? 1 : 0.85} />
      </g>

      {/* Diagnosis: where the trip really ends, and the gap to the learner's shortcut */}
      {missed && (
        <g>
          <line x1={s.x(tip.x)} y1={s.y(tip.y)} x2={s.x(end.x)} y2={s.y(end.y)} stroke={red} strokeWidth={2.5} strokeDasharray="5 4" className="gb-march" />
          <circle cx={s.x(end.x)} cy={s.y(end.y)} r={11} fill="none" stroke={red} strokeWidth={2.5} />
        </g>
      )}

      <Arrow
        x1={s.x(start.x)}
        y1={s.y(start.y)}
        x2={s.x(start.x + shortcut.x)}
        y2={s.y(start.y + shortcut.y)}
        color={emerald}
        width={5}
        opacity={0.95}
      />

      {!morphing && (
        <g>
          <Tag x={uMid.x - 8} y={uMid.y - 8} color={blue} anchor="end" size={12}>
            {formal ? "u" : `${signed(u.x)}, ${signed(u.y)}`}
          </Tag>
          <Tag x={vMid.x + 8} y={vMid.y - 8} color={amber} anchor="start" size={12}>
            {formal ? "v" : `${signed(v.x)}, ${signed(v.y)}`}
          </Tag>
          {(!predicting || ((rshort.x !== 0 || rshort.y !== 0) && (rshort.x !== u.x || rshort.y !== u.y))) && (
            <Tag x={sMid.x} y={sMid.y + 20} color={emerald} size={12}>
              {formal ? "u + v" : `${signed(rshort.x)}, ${signed(rshort.y)}`}
            </Tag>
          )}
        </g>
      )}

      <PlaneTicks s={s} avoid={[start, tip, chained, ...(missed ? [end] : [])]} />
      {/* The shortcut's steps ride the axes; thumbs sit level with its tip */}
      <Rails
        input={input}
        values={values}
        bind={{
          sx: { axis: "x", at: (x) => s.x(start.x + x), cross: H + RAIL_CROSS, reach: s.y(tip.y) },
          sy: { axis: "y", at: (y) => s.y(start.y + y), cross: -RAIL_CROSS, reach: s.x(tip.x) },
          vx: { axis: "x", at: (x) => s.x(chained.x + x), cross: H + RAIL_CROSS, reach: s.y(chained.y + v.y) },
          vy: { axis: "y", at: (y) => s.y(chained.y + y), cross: -RAIL_CROSS, reach: s.x(chained.x + v.x) },
        }}
      />
      {(board.can("vx") || board.can("vy")) && (
        <PlaneHandle
          x={s.x(chained.x + v.x)}
          y={s.y(chained.y + v.y)}
          color={amber}
          onDrag={(pt) => {
            board.set("vx", s.fromX(pt.x) - chained.x);
            board.set("vy", s.fromY(pt.y) - chained.y);
          }}
        />
      )}
      {(board.can("sx") || board.can("sy")) && (
        <PlaneHandle
          x={s.x(tip.x)}
          y={s.y(tip.y)}
          color={emerald}
          cursor={board.can("sx") && board.can("sy") ? "move" : board.can("sx") ? "ew-resize" : "ns-resize"}
          onDrag={(pt) => {
            board.set("sx", s.fromX(pt.x) - start.x);
            board.set("sy", s.fromY(pt.y) - start.y);
          }}
        />
      )}
    </Svg>
  );
}

function solve(target: Values): Values {
  return { sx: (target.ux ?? 0) + (target.vx ?? 0), sy: (target.uy ?? 0) + (target.vy ?? 0) };
}

export const vectorPath: InteractiveDefinition = {
  Board,
  axes: { vx: "x", vy: "y", sx: "x", sy: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3) return { sx: 0, sy: 0 };
    const v: Values = { ...(spec.stage2Exploration.fixed ?? {}) };
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(_spec, target) {
    // The shortcut's tip may reach anywhere on the board, so each rail spans the board from the start.
    const start = tripStart({ x: target.ux ?? 0, y: target.uy ?? 0 }, { x: target.vx ?? 0, y: target.vy ?? 0 });
    return [
      { variableName: "sx", label: "Across", min: RANGE.xMin - start.x, max: RANGE.xMax - start.x, step: 1, colorToken: "emerald" },
      { variableName: "sy", label: "Up", min: RANGE.yMin - start.y, max: RANGE.yMax - start.y, step: 1, colorToken: "emerald" },
    ];
  },
  solve,
  evaluate(values, target, tolerance) {
    const goal = solve(target);
    const sx = values.sx ?? 0;
    const sy = values.sy ?? 0;
    const near = (a: number, b: number) => Math.abs(a - b) <= tolerance + 1e-9;
    const is = (x: number, y: number) => near(sx, x) && near(sy, y);
    const correct = is(goal.sx!, goal.sy!);
    const delta = Math.hypot(sx - goal.sx!, sy - goal.sy!);
    if (correct) return { correct, delta: 0 };
    const u = { x: target.ux ?? 0, y: target.uy ?? 0 };
    const v = { x: target.vx ?? 0, y: target.vy ?? 0 };
    if (is(u.x, u.y) || is(v.x, v.y)) return { correct, delta, kind: "partial" };
    if (is(u.x - v.x, u.y - v.y) || is(v.x - u.x, v.y - u.y)) return { correct, delta, kind: "sign" };
    return { correct, delta };
  },
  formatDelta(v) {
    return `${fmt(v.delta)} off`;
  },
};
