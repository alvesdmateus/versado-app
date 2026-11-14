import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, signed, SEAM } from "../bands";
import { Arrow, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/** A diagonal forward warp and its undo. Task a/d are responses; only forwardA/forwardD replace the case. */
const W = 340;
const H = 340;
const GUTTER = { left: RAIL_GUTTER, bottom: RAIL_GUTTER };
/** The undo arrows run on their own tracks, hugging the axes just below and left of the forward arrows. */
const UNDO_OFFSET = -0.6;
type Diagonal = { a: number; d: number };
const VERTICES = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
const SOURCES = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }];

export function forwardOf(target: Values, spec?: ModuleSpec): Diagonal {
  const fixed = spec?.stage2Exploration.fixed ?? {};
  return { a: target.forwardA ?? fixed.a ?? 2, d: target.forwardD ?? fixed.d ?? 0.5 };
}

/** Positive diagonal powers: 1 = forward, 0 = identity, -1 = inverse. Collapse cannot rewind. */
export function rewindFactors(forward: Diagonal, rewind: number, singular = false): Diagonal {
  if (singular || forward.d === 0) return { a: forward.a, d: 0 };
  const t = clamp(rewind, -1, 1);
  return { a: forward.a ** t, d: forward.d ** t };
}

function solve(target: Values, spec?: ModuleSpec): Values {
  const forward = forwardOf(target, spec);
  return {
    a: target.a ?? 1 / forward.a,
    d: target.d ?? 1 / forward.d,
    // An assisted task presets the forward view, not either undo response.
    ...(target.rewind === undefined ? {} : { rewind: target.rewind }),
  };
}

function tile(s: PlaneScale, m: Diagonal) {
  return VERTICES.map((p) => `${s.x(p.x * m.a)},${s.y(p.y * m.d)}`).join(" ");
}

/** Keep repeating reciprocals exact in the revealed multiplication (3 × 1/3 = 1). */
function factorText(value: number) {
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-4) {
    for (const denominator of [3, 6, 12]) {
      const numerator = Math.round(value * denominator);
      if (Math.abs(value - numerator / denominator) < 1e-6) return `${numerator}/${denominator}`;
    }
  }
  return fmt(value);
}

function WarpedGrid({ s, m }: { s: PlaneScale; m: Diagonal }) {
  return (
    <g aria-hidden>
      {Array.from({ length: 21 }, (_, i) => i - 10).map((k) => (
        <g key={k}>
          <line x1={s.x(k * m.a)} x2={s.x(k * m.a)} y1={s.y(-10 * m.d)} y2={s.y(10 * m.d)} stroke={SEAM} />
          <line y1={s.y(k * m.d)} y2={s.y(k * m.d)} x1={s.x(-10 * m.a)} x2={s.x(10 * m.a)} stroke={SEAM} />
        </g>
      ))}
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 30, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
  const clip = useId().replace(/:/g, "");
  const blue = bandColor("blue");
  const emerald = bandColor("emerald");
  const slate = bandColor("slate");
  const red = bandColor("red");
  const anchoring = stage === 1;
  const task = stage >= 3;
  const forward = forwardOf(task ? target : {}, spec);
  const undo = { a: values.a ?? 1, d: values.d ?? 1 };
  const hidden = stage === 3 && verdict === null && guide == null;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const morphing = guide != null && guide < 1;
  const singular = !task && (anchoring ? anchorT >= 0.68 : (values.singular ?? 0) >= 0.5);
  let shown: Diagonal;
  if (anchoring) {
    const t = span(anchorT, 0.1, 0.55);
    shown = rewindFactors(forward, 1 - t);
    if (singular) {
      const crush = span(anchorT, 0.68, 0.88);
      shown = { a: lerp(1, forward.a, crush), d: 1 - crush };
    }
  } else if (!task) {
    shown = rewindFactors(forward, values.rewind ?? 1, singular);
  } else {
    shown = hidden ? forward : { a: forward.a * undo.a, d: forward.d * undo.d };
  }
  // A new hidden task or a collapse snaps immediately: an old spring must never disclose a result.
  const [a, d] = useSettle([shown.a, shown.d], !anchoring && !hidden && !singular && guide == null);
  const moving = { a: a!, d: d! };
  const board = useBoardInput(input, values);
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";
  const formal = stage === 4;
  const undoVisible = task || (!anchoring && !singular && (values.rewind ?? 1) < 0);
  const shownUndo = task ? undo : moving;
  const label = anchoring ? spec.stage1Anchoring.visualMetaphor : task ? spec.stage3Prediction.challengePrompt : spec.stage2Exploration.prompt;
  const bounded = (v: number) => clamp(v, -4.8, 4.8);

  return (
    <Svg width={W} height={H} label={label} anchoring={anchoring} gutter={GUTTER}>
      <defs>
        <clipPath id={clip}><rect x={s.x(-5)} y={s.y(5)} width={s.x(5) - s.x(-5)} height={s.y(-5) - s.y(5)} /></clipPath>
      </defs>
      <PlaneGrid s={s} />
      <g clipPath={`url(#${clip})`}>
        <WarpedGrid s={s} m={moving} />
        {/* The original home remains visible, even when different source dots merge. */}
        <polygon points={tile(s, { a: 1, d: 1 })} fill="none" stroke={slate} strokeWidth={2.5} strokeDasharray="3 3" />
        <polygon data-forward-frame points={tile(s, forward)} fill={bandFill("blue", 12)} stroke={blue} strokeWidth={2} strokeDasharray="4 4" />
        {!hidden && VERTICES.slice(1).map((p, i) => (
          <line key={i} x1={s.x(p.x * forward.a)} y1={s.y(p.y * forward.d)} x2={s.x(p.x * moving.a)} y2={s.y(p.y * moving.d)} stroke={emerald} strokeWidth={2} strokeDasharray="3 3" />
        ))}
        <g key={pulse} className={anchoring ? undefined : "gb-pulse"}>
          <polygon data-moving-frame points={tile(s, moving)} fill={bandFill(hidden ? "blue" : "emerald", 22)} stroke={hidden ? blue : emerald} strokeWidth={3} strokeLinejoin="round" />
        </g>
        {singular && SOURCES.map((p, i) => (
          <g key={i}>
            <line x1={s.x(p.x)} y1={s.y(p.y)} x2={s.x(p.x * moving.a)} y2={s.y(p.y * moving.d)} stroke={slate} strokeWidth={1.5} strokeDasharray="3 3" />
            <circle cx={s.x(p.x)} cy={s.y(p.y)} r={5} fill="none" stroke={slate} strokeWidth={2} />
            <circle data-merged-dot cx={s.x(p.x * moving.a)} cy={s.y(p.y * moving.d)} r={6 + i * 3} fill="none" stroke={blue} strokeWidth={2} />
          </g>
        ))}
        {missed && (
          <g data-discrepancy stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" fill="none">
            <polygon points={tile(s, moving)} />
            {VERTICES.slice(1).map((p, i) => <line key={i} x1={s.x(p.x * moving.a)} y1={s.y(p.y * moving.d)} x2={s.x(p.x)} y2={s.y(p.y)} />)}
            <line x1={s.x(1)} y1={s.y(1)} x2={s.x(moving.a)} y2={s.y(1)} />
            <line x1={s.x(1)} y1={s.y(1)} x2={s.x(1)} y2={s.y(moving.d)} />
            {Math.abs(moving.a) > 5 && <line x1={s.x(bounded(moving.a)) - 5} y1={s.y(1) - 5} x2={s.x(bounded(moving.a)) + 5} y2={s.y(1) + 5} strokeDasharray="none" />}
            {Math.abs(moving.d) > 5 && <line x1={s.x(1) - 5} y1={s.y(bounded(moving.d)) - 5} x2={s.x(1) + 5} y2={s.y(bounded(moving.d)) + 5} strokeDasharray="none" />}
          </g>
        )}
      </g>
      {/* Forward and undo factors have separate arrow tracks; the rails align with the undo tips. */}
      <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(forward.a)} y2={s.y(0)} color={blue} width={4} />
      <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(0)} y2={s.y(singular ? 0 : forward.d)} color={blue} width={4} />
      {!anchoring && !morphing && (
        <>
          <Tag x={s.x(forward.a)} y={s.y(0) + 26} color={blue} size={12}>{formal ? `A: ${fmt(forward.a)}` : fmt(forward.a)}</Tag>
          <Tag x={s.x(0) + 10} y={s.y(singular ? 0 : forward.d) - 12} color={blue} anchor="start" size={12}>{formal ? `A: ${fmt(forward.d)}` : fmt(singular ? 0 : forward.d)}</Tag>
          <Tag x={s.x(1) + 6} y={s.y(1) - 6} color={slate} anchor="start">{formal ? "I" : "1 × 1"}</Tag>
        </>
      )}
      {undoVisible && (
        <g data-undo-factors>
          <Arrow x1={s.x(0)} y1={s.y(UNDO_OFFSET)} x2={s.x(shownUndo.a)} y2={s.y(UNDO_OFFSET)} color={emerald} />
          <Arrow x1={s.x(UNDO_OFFSET)} y1={s.y(0)} x2={s.x(UNDO_OFFSET)} y2={s.y(shownUndo.d)} color={emerald} />
          {!morphing && (!task || hidden || formal) && (
            <>
              <Tag x={s.x(shownUndo.a)} y={s.y(UNDO_OFFSET) + 24} color={emerald} size={12}>{`${formal ? "1/a = " : ""}${factorText(shownUndo.a)}`}</Tag>
              <Tag x={s.x(UNDO_OFFSET) - 10} y={s.y(shownUndo.d) - 10} color={emerald} anchor="end" size={12}>{`${formal ? "1/d = " : ""}${factorText(shownUndo.d)}`}</Tag>
            </>
          )}
        </g>
      )}
      {task && !hidden && !morphing && (
        <g data-products>
          <Tag x={s.x(undo.a)} y={s.y(UNDO_OFFSET) + (formal ? 42 : 24)} color={emerald} size={12}>{`${factorText(forward.a)} × ${factorText(undo.a)} = ${fmt(shown.a)}`}</Tag>
          <Tag x={s.x(UNDO_OFFSET) - 10} y={s.y(undo.d) + (formal ? 8 : -10)} color={emerald} anchor="end" size={12}>{`${factorText(forward.d)} × ${factorText(undo.d)} = ${fmt(shown.d)}`}</Tag>
        </g>
      )}
      {missed && (
        <g data-deltas>
          <Tag x={s.x((1 + bounded(moving.a)) / 2)} y={s.y(1) - 12} color={red} size={12}>{`Δa = ${signed(undo.a - (target.a ?? 1 / forward.a))}`}</Tag>
          <Tag x={s.x(1) + 10} y={s.y((1 + bounded(moving.d)) / 2) + 4} color={red} anchor="start" size={12}>{`Δd = ${signed(undo.d - (target.d ?? 1 / forward.d))}`}</Tag>
        </g>
      )}
      {!anchoring && <PlaneTicks s={s} avoid={[{ x: forward.a, y: 0 }, { x: 0, y: forward.d }, { x: 1, y: 1 }]} />}
      <Rails input={task ? input : undefined} values={values} bind={{
        a: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(UNDO_OFFSET) },
        d: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(UNDO_OFFSET) },
      }} />
      {task && board.can("a") && <PlaneHandle x={s.x(undo.a)} y={s.y(UNDO_OFFSET)} color={emerald} cursor="ew-resize" onDrag={(p) => board.set("a", s.fromX(p.x))} />}
      {task && board.can("d") && <PlaneHandle x={s.x(UNDO_OFFSET)} y={s.y(undo.d)} color={emerald} cursor="ns-resize" onDrag={(p) => board.set("d", s.fromY(p.y))} />}
    </Svg>
  );
}

export const matrixInverse: InteractiveDefinition = {
  Board,
  axes: { a: "x", d: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target, spec);
    if (stage === 3) return { a: 1, d: 1, ...(target.rewind === undefined ? {} : { rewind: target.rewind }) };
    const values: Values = {};
    for (const control of spec.stage2Exploration.controls) values[control.variableName] = control.initial;
    return values;
  },
  predictionControls() {
    return [
      { variableName: "a", label: "1/a", min: -4, max: 4, step: 1 / 12, colorToken: "emerald" },
      { variableName: "d", label: "1/d", min: -4, max: 4, step: 1 / 12, colorToken: "emerald" },
    ];
  },
  solve,
  evaluate(values, target, tolerance, spec) {
    const goal = solve(target, spec);
    const forward = forwardOf(target, spec);
    const a = values.a ?? 1;
    const d = values.d ?? 1;
    const near = (x: number, y: number) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= tolerance + 1e-9;
    const is = (x: number, y: number) => near(a, x) && near(d, y);
    const delta = Math.hypot(a - goal.a!, d - goal.d!);
    if (is(goal.a!, goal.d!)) return { correct: true, delta: 0 };
    if (is(-forward.a, -forward.d)) return { correct: false, delta, kind: "negate" };
    if (is(forward.a, forward.d)) return { correct: false, delta, kind: "same" };
    if (is(1 - forward.a, 1 - forward.d)) return { correct: false, delta, kind: "subtract" };
    return { correct: false, delta };
  },
  formatDelta(verdict) {
    return `Δ = ${fmt(verdict.delta)}`;
  },
};
