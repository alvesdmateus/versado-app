import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, signed } from "../bands";
import { Arrow, clearOfXTicks, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values, Verdict } from "./types";

/** Choose an input, not a destination: its image under A must reach the fixed rose pin. */
const SIZE = 340;
const EPS = 1e-9;
type Point = { x: number; y: number };
type System = { a: number; b: number; c: number; d: number; bx: number; by: number };
const DEFAULT: System = { a: 2, b: 1, c: 0, d: 1, bx: 3, by: 1 };

/** Task context changes the map/pin; expected input coordinates never configure the case. */
export function systemOf(target: Values, spec?: ModuleSpec): System {
  const fixed = spec?.stage2Exploration.fixed ?? {};
  const pick = (k: keyof System) => target[k] ?? fixed[k] ?? DEFAULT[k];
  return { a: pick("a"), b: pick("b"), c: pick("c"), d: pick("d"), bx: pick("bx"), by: pick("by") };
}

export function transform(m: System, p: Point): Point {
  return { x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y };
}

function solve(target: Values, spec?: ModuleSpec): Values {
  if (target.x !== undefined && target.y !== undefined) return { x: target.x, y: target.y };
  const m = systemOf(target, spec);
  const determinant = m.a * m.d - m.b * m.c;
  if (Math.abs(determinant) > EPS) {
    return { x: (m.d * m.bx - m.b * m.by) / determinant, y: (m.a * m.by - m.c * m.bx) / determinant };
  }
  // A representative of a consistent singular system; every preimage is accepted by evaluate.
  const row = Math.hypot(m.a, m.b) > EPS ? [m.a, m.b, m.bx] : [m.c, m.d, m.by];
  const [a, b, rhs] = row as [number, number, number];
  const length2 = a * a + b * b;
  const p = length2 > EPS ? { x: a * rhs / length2, y: b * rhs / length2 } : { x: 0, y: 0 };
  const output = transform(m, p);
  return Math.hypot(output.x - m.bx, output.y - m.by) <= EPS ? p : {};
}

/** Keep off-plane landings visible as an edge tip without changing the question's scale. */
function edge(s: PlaneScale, p: Point): Point {
  const k = Math.max(1, p.x / s.xMax, p.x / s.xMin, p.y / s.yMax, p.y / s.yMin);
  return { x: p.x / k, y: p.y / k };
}

/** Clip the actual discrepancy, preserving its direction when the shadow leaves the plane. */
export function clipDiscrepancy(s: Pick<PlaneScale, "xMin" | "xMax" | "yMin" | "yMax">, p: Point, q: Point) {
  let enter = 0;
  let exit = 1;
  const axes: [number, number, number, number][] = [[p.x, q.x, s.xMin, s.xMax], [p.y, q.y, s.yMin, s.yMax]];
  for (const [start, finish, min, max] of axes) {
    const delta = finish - start;
    if (Math.abs(delta) <= EPS) {
      if (start < min || start > max) return null;
    } else {
      const a = (min - start) / delta;
      const b = (max - start) / delta;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return null;
    }
  }
  const at = (t: number) => ({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) });
  return { from: at(enter), to: at(exit) };
}

function WarpedGrid({ s, m }: { s: PlaneScale; m: System }) {
  return (
    <g stroke={bandColor("slate")} strokeWidth={1} opacity={0.22}>
      {Array.from({ length: 17 }, (_, i) => i - 8).flatMap((k) => {
        const pairs: [Point, Point][] = [[{ x: k, y: -16 }, { x: k, y: 16 }], [{ x: -16, y: k }, { x: 16, y: k }]];
        return pairs.map(([p, q], i) => {
          const a = transform(m, p);
          const b = transform(m, q);
          return <line key={`${k}-${i}`} x1={s.x(a.x)} y1={s.y(a.y)} x2={s.x(b.x)} y2={s.y(b.y)} />;
        });
      })}
    </g>
  );
}

/** The collapsed map sends a whole input line to (2,0), while (2,1) is unreachable. */
function SingularComparison() {
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const slate = bandColor("slate");
  return (
    <g data-system="singular-comparison">
      <line x1={14} y1={270} x2={70} y2={326} stroke={blue} strokeWidth={2} strokeDasharray="3 3" />
      {[{ x: 18, y: 274 }, { x: 42, y: 298 }, { x: 66, y: 322 }].map((p, i) => (
        <Arrow key={i} x1={18} y1={322} x2={p.x} y2={p.y} color={blue} width={2} head={8} opacity={0.45 + i * 0.2} />
      ))}
      <Tag x={77} y={286} color={blue} size={16}>∞</Tag>
      <Arrow x1={98} y1={301} x2={168} y2={301} color={slate} width={2} head={9} />
      <Tag x={133} y={326} color={slate} size={11}>A = [1 1; 0 0]</Tag>
      <Arrow x1={190} y1={310} x2={326} y2={310} color={amber} width={3} head={10} />
      <circle cx={254} cy={310} r={6} fill={rose} />
      <circle cx={254} cy={278} r={6} fill="none" stroke={rose} strokeWidth={3} />
      <line x1={254} y1={286} x2={254} y2={302} stroke={rose} strokeDasharray="3 3" strokeWidth={2} />
      <Tag x={264} y={269} color={rose} anchor="start" size={11}>(2, 1): 0</Tag>
      <Tag x={254} y={332} color={rose} size={11}>(2, 0): ∞</Tag>
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const formal = stage === 4;
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && !guided && verdict === null;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const s = usePlane({ width: SIZE, height: formal ? 228 : SIZE, pad: 30, xMin: -5, xMax: 5, yMin: formal ? -3 : -5, yMax: formal ? 3 : 5 });
  const clip = useId().replace(/:/g, "");
  const m = systemOf(stage >= 3 ? target : {}, spec);
  const pin = { x: m.bx, y: m.by };
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const red = bandColor("red");
  const slate = bandColor("slate");
  const board = useBoardInput(anchoring || guided ? undefined : input, values);
  const solution = solve(m);
  const approach = span(anchorT, 0.15, 1);
  const raw: Point = anchoring
    ? { x: lerp(-2, solution.x ?? 1, approach), y: lerp(-1, solution.y ?? 1, span(anchorT, 0.35, 0.95)) }
    : { x: values.x ?? 0, y: values.y ?? 0 };
  const [x, y] = useSettle([raw.x, raw.y], !anchoring && !guided) as [number, number];
  const p = { x, y };
  const image = transform(m, p);
  const exact = transform(m, raw);
  const tip = edge(s, image);
  const end = edge(s, pin);
  const outside = Math.abs(image.x - tip.x) + Math.abs(image.y - tip.y) > EPS;
  const delta = { x: pin.x - exact.x, y: pin.y - exact.y };
  const gap = Math.hypot(delta.x, delta.y);
  const discrepancy = clipDiscrepancy(s, image, pin);
  const showTags = !anchoring && (!guided || guide >= 1);
  const pulse = changed?.name === "x" || changed?.name === "y" ? changed.tick : 0;
  const tag = (at: Point, text: string, color: string, below = false, side: "middle" | "start" | "end" = "middle", lift = 0) => {
    const width = text.length * 6.5;
    const offset = side === "start" ? 12 : side === "end" ? -12 : 0;
    const left = side === "end" ? width : side === "middle" ? width / 2 : 0;
    const right = side === "start" ? width : side === "middle" ? width / 2 : 0;
    return (
      <Tag
        x={clamp(s.x(at.x) + offset, left + 8, SIZE - right - 8)}
        y={clamp(clearOfXTicks(s, s.y(at.y) + (below ? 25 : -15) + lift, below), 16, formal ? 225 : SIZE - 4)}
        color={color} size={12} anchor={side}
      >
        {text}
      </Tag>
    );
  };
  const pair = (q: Point) => `(${fmt(q.x)}, ${fmt(q.y)})`;

  return (
    <Svg anchoring={anchoring} width={SIZE} height={SIZE} label={spec.targetSkill} gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}>
      <defs><clipPath id={clip}><rect x={s.x(s.xMin)} y={s.y(s.yMax)} width={280} height={formal ? 168 : 280} /></clipPath></defs>
      <PlaneGrid s={s} />
      <g clipPath={`url(#${clip})`}>
        {/* This is the fixed map, not the moving input's answer. It remains visible at the gate. */}
        <WarpedGrid s={s} m={m} />
        {anchoring && (
          <g opacity={0.3}>
            <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(-2)} y2={s.y(-1)} color={blue} dashed width={2} />
            <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(-5)} y2={s.y(-1)} color={amber} dashed width={2} />
          </g>
        )}
        {!hidden && <g data-system="shadow" key={`shadow-${pulse}`}>
          <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(tip.x)} y2={s.y(tip.y)} color={amber} />
          <circle className={anchoring || guided ? undefined : "gb-pulse"} cx={s.x(tip.x)} cy={s.y(tip.y)} r={6} fill={amber} stroke={amber} strokeWidth={0} style={{ ["--sw" as string]: "0px" }} />
        </g>}
        <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(p.x)} y2={s.y(p.y)} color={blue} width={5} />
        {!hidden && gap > EPS && discrepancy && <line data-system="gap" x1={s.x(discrepancy.from.x)} y1={s.y(discrepancy.from.y)} x2={s.x(discrepancy.to.x)} y2={s.y(discrepancy.to.y)} stroke={missed ? red : rose} strokeWidth={2.5} strokeDasharray={missed ? "6 4" : "3 3"} className={missed ? "gb-march" : undefined} />}
      </g>

      {/* The destination is always fixed, never an input handle. */}
      <g data-system="pin">
        <circle cx={s.x(end.x)} cy={s.y(end.y)} r={11} fill={bandFill("rose", 20)} stroke={rose} strokeWidth={2} />
        <line x1={s.x(end.x) - 5} x2={s.x(end.x) + 5} y1={s.y(end.y)} y2={s.y(end.y)} stroke={rose} strokeWidth={2} />
        <line x1={s.x(end.x)} x2={s.x(end.x)} y1={s.y(end.y) - 5} y2={s.y(end.y) + 5} stroke={rose} strokeWidth={2} />
      </g>
      {showTags && <>
        {tag(raw, `${formal ? "x = " : ""}${pair(raw)}`, blue, true, Math.hypot(raw.x - tip.x, raw.y - tip.y) < 2.5 && !hidden ? "end" : "middle")}
        {tag(end, `${formal ? "b = " : ""}${pair(pin)}`, rose)}
        {!hidden && tag(tip, `${formal ? "Ax = " : ""}${pair(exact)}`, amber, true, Math.hypot(raw.x - tip.x, raw.y - tip.y) < 2.5 ? "start" : "middle")}
        {formal && <Tag x={s.x(-4)} y={s.y(2.6)} color={slate} size={11} anchor="start">{`A = [${fmt(m.a)} ${fmt(m.b)}; ${fmt(m.c)} ${fmt(m.d)}]`}</Tag>}
      </>}
      {!hidden && outside && <line x1={s.x(tip.x) - 5} x2={s.x(tip.x) + 5} y1={s.y(tip.y) - 5} y2={s.y(tip.y) + 5} stroke={missed ? red : amber} strokeWidth={3} />}
      {!hidden && outside && gap > EPS && discrepancy && <line x1={s.x(discrepancy.from.x) - 5} x2={s.x(discrepancy.from.x) + 5} y1={s.y(discrepancy.from.y) - 5} y2={s.y(discrepancy.from.y) + 5} stroke={missed ? red : rose} strokeWidth={3} />}
      {missed && gap > EPS && discrepancy && (() => {
        const mid = { x: (discrepancy.from.x + discrepancy.to.x) / 2, y: (discrepancy.from.y + discrepancy.to.y) / 2 };
        const below = mid.y < pin.y - EPS;
        return tag(mid, `Δ (${signed(delta.x)}, ${signed(delta.y)})`, red, below, "middle", below ? 0 : -21);
      })()}
      {!anchoring && <PlaneTicks s={s} avoid={[raw, pin, ...(!hidden ? [tip] : [])]} />}
      {formal && <SingularComparison />}
      {!anchoring && !guided && <Rails input={input} values={values} bind={{
        x: { axis: "x", at: s.x, cross: SIZE + RAIL_CROSS, reach: s.y(raw.y) },
        y: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(raw.x) },
      }} />}
      {(board.can("x") || board.can("y")) && <PlaneHandle x={s.x(raw.x)} y={s.y(raw.y)} color={blue} cursor={board.can("x") && board.can("y") ? "move" : board.can("x") ? "ew-resize" : "ns-resize"} onDrag={(pt) => {
        board.set("x", s.fromX(pt.x));
        board.set("y", s.fromY(pt.y));
      }} />}
    </Svg>
  );
}

export const matrixSystem: InteractiveDefinition = {
  Board,
  axes: { x: "x", y: "y" },
  initialValues(spec, stage, target) {
    if (stage === 3) return { x: 0, y: 0 };
    if (stage === 4) return solve(target, spec);
    return Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
  },
  predictionControls(spec) {
    return ["x", "y"].map((name) => ({
      variableName: name,
      label: spec.stage2Exploration.controls.find((c) => c.variableName === name)?.label ?? name,
      min: -4, max: 4, step: 0.5, colorToken: "blue" as const,
    }));
  },
  solve,
  evaluate(values, target, tolerance, spec): Verdict {
    const m = systemOf(target, spec);
    if (!Number.isFinite(values.x) || !Number.isFinite(values.y)) return { correct: false, delta: Infinity };
    const output = transform(m, { x: values.x!, y: values.y! });
    const dx = output.x - m.bx;
    const dy = output.y - m.by;
    const correct = Math.hypot(dx, dy) <= Math.max(0, tolerance) + EPS;
    const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    if (!correct && Math.hypot(values.x! - m.bx, values.y! - m.by) <= EPS) return { correct, delta, kind: "destination" };
    return { correct, delta };
  },
  formatDelta(verdict) { return signed(verdict.delta); },
};
