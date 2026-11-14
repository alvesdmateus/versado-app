import { useEffect, useId, useState } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, fmt, INK, SEAM } from "../bands";
import { Arrow, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/** Column vectors: order 0 is R*S*p; order 1 is S*R*p. Only case context
 * comes from fixed/target; learner x/y always belong to the prediction marker. */
const W = 340;
const FLOOR_H = 240;
const FLOOR_GAP = 60;
const H = FLOOR_H * 2 + FLOOR_GAP;
type Point = { x: number; y: number };
type Matrix = { a: number; b: number; c: number; d: number };
type OrderCase = { a: number; d: number; turn: number; px: number; py: number; order: number };
const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1 };
const FLAG: Point[] = [
  { x: 0, y: 0 }, { x: 0.4, y: 0 }, { x: 0.4, y: 0.9 },
  { x: 2, y: 0.9 }, { x: 2, y: 1.25 }, { x: 0.4, y: 1.25 },
  { x: 0.4, y: 1.65 }, { x: 2, y: 1.65 }, { x: 2, y: 2 }, { x: 0, y: 2 },
];

function caseOf(target: Values, spec?: ModuleSpec): OrderCase {
  const fixed = spec?.stage2Exploration.fixed ?? {};
  const order = spec?.stage2Exploration.controls.find((c) => c.variableName === "order")?.initial ?? 0;
  return {
    a: target.a ?? fixed.a ?? 2, d: target.d ?? fixed.d ?? 1,
    turn: target.turn ?? fixed.turn ?? 1,
    px: target.px ?? fixed.px ?? 2, py: target.py ?? fixed.py ?? 1,
    order: target.order ?? fixed.order ?? order,
  };
}

function apply(m: Matrix, p: Point): Point {
  return { x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y };
}

/** Exact integer quarter turns avoid trig residue at tolerance zero. */
function rotation(turn: number): Matrix {
  const angle = turn * Math.PI / 2;
  const clean = (v: number) => Math.abs(v) < 1e-10 ? 0 : Math.abs(Math.abs(v) - 1) < 1e-10 ? Math.round(v) : v;
  const cos = clean(Math.cos(angle));
  const sin = clean(Math.sin(angle));
  return { a: cos, b: -sin, c: sin, d: cos };
}

function multiply(m: Matrix, n: Matrix): Matrix {
  return { a: m.a * n.a + m.b * n.c, b: m.a * n.b + m.b * n.d,
    c: m.c * n.a + m.d * n.c, d: m.c * n.b + m.d * n.d };
}

/** Two separate phases: a stretch followed by a turn, or the reverse. */
function matrixAt(c: OrderCase, order: number, t: number): Matrix {
  const first = span(t, 0, 0.5);
  const second = span(t, 0.5, 1);
  const stretch = (u: number): Matrix => ({ a: lerp(1, c.a, u), b: 0, c: 0, d: lerp(1, c.d, u) });
  return order === 0
    ? multiply(rotation(c.turn * second), stretch(first))
    : multiply(stretch(second), rotation(c.turn * first));
}

export function orderLanding(target: Values, spec?: ModuleSpec): Point {
  const c = caseOf(target, spec);
  return apply(matrixAt(c, c.order, 1), { x: c.px, y: c.py });
}

function points(s: PlaneScale, m: Matrix) {
  return FLAG.map((p) => apply(m, p)).map((p) => `${s.x(p.x)},${s.y(p.y)}`).join(" ");
}

/** A trail follows the actual move: straight for stretch, curved for turn. */
function trail(s: PlaneScale, c: OrderCase, order: number, step: number, progress: number) {
  const end = Math.min(step + 0.5, progress);
  if (end <= step) return "";
  return Array.from({ length: 17 }, (_, i) => {
    const p = apply(matrixAt(c, order, lerp(step, end, i / 16)), { x: c.px, y: c.py });
    return `${i === 0 ? "M" : "L"}${s.x(p.x)},${s.y(p.y)}`;
  }).join(" ");
}

function Floor({ s, c, order, stage, t, hidden, selected, missed, marker, verdict, pulse, clip }: {
  s: PlaneScale; c: OrderCase; order: number; stage: BoardProps["stage"]; t: number;
  hidden: boolean; selected: boolean; missed: boolean; marker: Point;
  verdict: BoardProps["verdict"]; pulse: string; clip: string;
}) {
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const red = bandColor("red");
  const slate = bandColor("slate");
  const m = matrixAt(c, order, hidden ? 0 : t);
  const source = { x: c.px, y: c.py };
  const dot = apply(m, source);
  const final = apply(matrixAt(c, order, 1), source);
  const midway = apply(matrixAt(c, order, 0.5), source);
  const formal = stage === 4;
  const settled = !hidden && t >= 1;
  const top = s.y(s.yMax);
  const badgeY = top - 14;
  const colors = order === 0 ? [blue, amber] : [amber, blue];
  return (
    <g data-order={order}>
      <defs><clipPath id={clip}><rect x={s.x(s.xMin)} y={top} width={s.x(s.xMax) - s.x(s.xMin)} height={s.y(s.yMin) - top} /></clipPath></defs>
      <PlaneGrid s={s} />
      {/* Move badges are attached to their floor; symbols arrive only at formalization. */}
      {stage !== 1 && (
        <g>
          <line x1={s.x(-3)} x2={s.x(3)} y1={badgeY} y2={badgeY} stroke={selected ? slate : SEAM} strokeWidth={selected ? 3 : 1.5} />
          {[0, 1].map((i) => {
            const stretch = (order === 0) === (i === 0);
            const x = s.x(i === 0 ? -3 : 3);
            return <g key={i}>
              <circle cx={x} cy={badgeY} r={12} fill="var(--color-gb-ground)" stroke={colors[i]} strokeWidth={2} />
              {stretch
                ? <rect x={x - 7} y={badgeY - 3} width={14} height={6} fill="none" stroke={blue} strokeWidth={2} />
                : <><path d={c.turn >= 0 ? `M${x + 5},${badgeY + 4} A7,7 0 1 0 ${x - 5},${badgeY + 4}` : `M${x - 5},${badgeY + 4} A7,7 0 1 1 ${x + 5},${badgeY + 4}`} fill="none" stroke={amber} strokeWidth={2} /><Arrow x1={x + (c.turn >= 0 ? -7 : 7)} y1={badgeY + 1} x2={x + (c.turn >= 0 ? -3 : 3)} y2={badgeY + 5} color={amber} width={1.5} head={5} /></>}
              <Tag x={x + 18} y={badgeY + 4} color={colors[i]} anchor="start" size={11}>{formal ? stretch ? "S" : "R" : `${i + 1}: ${stretch ? `${fmt(c.a)}× / ${fmt(c.d)}×` : `${fmt(c.turn * 90)}°`}`}</Tag>
            </g>;
          })}
        </g>
      )}
      <g clipPath={`url(#${clip})`}>
        <polygon points={points(s, IDENTITY)} fill="none" stroke={slate} strokeWidth={1.5} strokeDasharray="3 5" opacity={0.5} />
        {/* Both final flags, warped grids and trails stay absent before commitment. */}
        {!hidden && (
          <g key={pulse} className={stage === 2 && selected ? "gb-pulse" : undefined}>
            <g opacity={selected || stage === 1 ? 1 : 0.55}>
              {[-3, -2, -1, 0, 1, 2, 3].map((k) => {
                const p = apply(m, { x: k, y: -7 }); const q = apply(m, { x: k, y: 7 });
                const u = apply(m, { x: -7, y: k }); const v = apply(m, { x: 7, y: k });
                return <g key={k} stroke={SEAM} strokeWidth={1}>
                  <line x1={s.x(p.x)} y1={s.y(p.y)} x2={s.x(q.x)} y2={s.y(q.y)} />
                  <line x1={s.x(u.x)} y1={s.y(u.y)} x2={s.x(v.x)} y2={s.y(v.y)} />
                </g>;
              })}
              <polygon data-result-flag={order} points={points(s, m)} fill={bandFill("rose", selected ? 25 : 12)} stroke={rose} strokeWidth={selected ? 2.5 : 1.5} strokeLinejoin="round" />
            </g>
            {[0, 0.5].map((step, i) => {
              const end = Math.min(step + 0.5, t);
              const p = apply(matrixAt(c, order, Math.max(step, end - 0.06)), source);
              const q = apply(matrixAt(c, order, end), source);
              return <g key={step}>
                <path data-trail={i} d={trail(s, c, order, step, t)} fill="none" stroke={colors[i]} strokeWidth={3} strokeLinecap="round" />
                {end > step && <Arrow x1={s.x(p.x)} y1={s.y(p.y)} x2={s.x(q.x)} y2={s.y(q.y)} color={colors[i]!} width={2} head={8} />}
              </g>;
            })}
            {t >= 0.5 && <circle cx={s.x(midway.x)} cy={s.y(midway.y)} r={4} fill={colors[0]} />}
            <circle cx={s.x(dot.x)} cy={s.y(dot.y)} r={6} fill={rose} />
          </g>
        )}
        <circle cx={s.x(source.x)} cy={s.y(source.y)} r={4} fill={rose} opacity={hidden ? 1 : 0.5} />
        {missed && selected && settled && verdict && (
          <g>
            <line data-diagnostic-gap x1={s.x(marker.x)} y1={s.y(marker.y)} x2={s.x(final.x)} y2={s.y(final.y)} stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
            <Tag x={s.x((marker.x + final.x) / 2) + 10} y={s.y((marker.y + final.y) / 2) - 10} color={red} anchor="start" size={12}>{`Δ ${fmt(verdict.delta)}`}</Tag>
          </g>
        )}
      </g>
      {stage !== 1 && (
        <>
          <Tag x={s.x(source.x) + 10} y={s.y(source.y) + 18} color={rose} anchor="start" size={12}>{formal ? "v" : `(${fmt(c.px)}, ${fmt(c.py)})`}</Tag>
          {!hidden && settled && <Tag x={s.x(final.x) + 10} y={s.y(final.y) - 10} color={rose} anchor="start" size={12}>{`(${fmt(final.x)}, ${fmt(final.y)})`}</Tag>}
          {!hidden && formal && <>
            <Tag x={s.x(midway.x) + 12} y={s.y(midway.y) + 20} color={colors[0]} anchor="start" size={12}>{order === 0 ? "S" : "R"}</Tag>
            <Tag x={s.x(final.x) - 12} y={s.y(final.y) + 20} color={colors[1]} anchor="end" size={12}>{order === 0 ? "R" : "S"}</Tag>
          </>}
          <PlaneTicks s={s} yStep={2} avoid={[source, ...(hidden ? [] : [final, midway]), ...(selected ? [marker] : [])]} />
        </>
      )}
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const base = usePlane({ width: W, height: FLOOR_H, pad: 30, xMin: -7, xMax: 7, yMin: -4.5, yMax: 4.5 });
  const lower: PlaneScale = { ...base, y: (v) => base.y(v) + FLOOR_H + FLOOR_GAP, fromY: (v) => base.fromY(v - FLOOR_H - FLOOR_GAP) };
  const c = caseOf(stage === 2 ? { order: values.order ?? 0 } : stage === 1 ? {} : target, spec);
  const hidden = stage === 3 && verdict === null && guide == null;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    setPlaying(false);
    if (hidden || stage === 1 || stage === 4 || guide != null) return;
    const frame = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(frame);
  }, [stage, c.order, hidden, guide != null]);
  const [reveal] = useSettle([playing ? 1 : 0], playing && guide == null);
  const t = stage === 1 ? span(anchorT, 0.08, 0.9) : stage === 4 ? 1 : guide ?? Math.min(1, Math.max(0, reveal!));
  const marker = { x: values.x ?? 0, y: values.y ?? 0 };
  const s = c.order === 0 ? base : lower;
  const board = useBoardInput(input, values);
  const id = useId().replace(/:/g, "");
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";
  const label = stage === 1 ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : stage === 4 ? spec.stage4Formalization.caption : spec.stage3Prediction.challengePrompt;
  return (
    <Svg width={W} height={H} label={label} anchoring={stage === 1} gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}>
      <line x1={base.x(0)} x2={lower.x(0)} y1={FLOOR_H + 4} y2={FLOOR_H + FLOOR_GAP - 4} stroke={SEAM} strokeWidth={1.5} strokeDasharray="3 5" />
      {[base, lower].map((plane, order) => <g key={order}>
        <Floor s={plane} c={c} order={order} stage={stage} t={stage === 2 && c.order !== order ? 1 : t} hidden={hidden} selected={c.order === order} missed={missed} marker={marker} verdict={verdict} pulse={pulse} clip={`${id}-${order}`} />
        {stage === 2 && board.can("order") && <rect x={0} y={order * (FLOOR_H + FLOOR_GAP)} width={W} height={FLOOR_H} fill="transparent" role="button" tabIndex={0} aria-label={`${spec.stage2Exploration.controls[0]?.label}: ${order}`} aria-pressed={c.order === order} className="gb-handle" onClick={() => board.set("order", order)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); board.set("order", order); } }} />}
      </g>)}
      {stage === 3 && guide == null && <g data-marker>
        <circle cx={s.x(marker.x)} cy={s.y(marker.y)} r={10} fill="none" stroke={missed ? bandColor("red") : INK} strokeWidth={2.5} />
        <Tag x={s.x(marker.x) + 13} y={s.y(marker.y) + 18} color={missed ? bandColor("red") : bandColor("rose")} anchor="start" size={12}>{`(${fmt(marker.x)}, ${fmt(marker.y)})`}</Tag>
      </g>}
      <Rails input={stage === 1 ? undefined : input} values={values} bind={{
        x: { axis: "x", at: s.x, cross: c.order === 0 ? FLOOR_H + RAIL_CROSS : H + RAIL_CROSS, reach: s.y(marker.y) },
        y: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(marker.x) },
      }} />
      {stage === 3 && guide == null && (board.can("x") || board.can("y")) && <PlaneHandle x={s.x(marker.x)} y={s.y(marker.y)} color={bandColor("rose")} onDrag={(pt) => { board.set("x", s.fromX(pt.x)); board.set("y", s.fromY(pt.y)); }} />}
    </Svg>
  );
}

function solve(target: Values, spec?: ModuleSpec): Values {
  return { order: caseOf(target, spec).order, ...orderLanding(target, spec) };
}

export const matrixOrder: InteractiveDefinition = {
  Board,
  axes: { x: "x", y: "y" },
  initialValues(spec, stage, target) {
    if (stage === 3) return { order: caseOf(target, spec).order, x: 0, y: 0 };
    if (stage === 4) return solve(target, spec);
    const values: Values = { ...spec.stage2Exploration.fixed };
    for (const c of spec.stage2Exploration.controls) values[c.variableName] = c.initial;
    return values;
  },
  predictionControls() {
    return [
      { variableName: "x", label: "x", min: -4, max: 4, step: 1, colorToken: "rose" },
      { variableName: "y", label: "y", min: -4, max: 4, step: 1, colorToken: "rose" },
    ];
  },
  solve,
  evaluate(values, target, tolerance, spec) {
    const computed = orderLanding(target, spec);
    const goal = { x: target.x ?? computed.x, y: target.y ?? computed.y };
    const near = (p: Point) => Math.abs((values.x ?? 0) - p.x) <= tolerance + 1e-9 && Math.abs((values.y ?? 0) - p.y) <= tolerance + 1e-9;
    if (near(goal)) return { correct: true, delta: 0 };
    const delta = Math.hypot((values.x ?? 0) - goal.x, (values.y ?? 0) - goal.y);
    const reversed = orderLanding({ ...target, order: 1 - caseOf(target, spec).order }, spec);
    return near(reversed) ? { correct: false, delta, kind: "reversed" } : { correct: false, delta };
  },
  formatDelta: (verdict) => `Δ ${fmt(verdict.delta)}`,
};
