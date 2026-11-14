import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, signed } from "../bands";
import { Arrow, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

/** Signed diagonal area, or two nonzero columns folding a tile into a line. */
const W = 340;
const H = 340;
const RAD = Math.PI / 180;
type Point = { x: number; y: number };

export function modeOf(spec?: ModuleSpec, target: Values = {}): "diagonal" | "collapse" {
  return spec
    ? spec.stage2Exploration.controls.some((c) => c.variableName === "angle") ? "collapse" : "diagonal"
    : "angle" in target || "firstAngle" in target ? "collapse" : "diagonal";
}

/** Signed shortest turn between unoriented lines: antiparallel columns collapse too. */
export function alignmentDelta(angle: number, firstAngle: number): number {
  return ((angle - firstAngle + 90) % 180 + 180) % 180 - 90;
}

function context(spec: ModuleSpec | undefined, target: Values) {
  const fixed = spec?.stage2Exploration.fixed ?? {};
  return {
    firstAngle: target.firstAngle ?? fixed.firstAngle ?? target.angle ?? 45,
    firstLength: target.firstLength ?? fixed.firstLength ?? 2,
    secondLength: target.secondLength ?? fixed.secondLength ?? 2,
  };
}

function vector(angle: number, length: number): Point {
  return { x: Math.cos(angle * RAD) * length, y: Math.sin(angle * RAD) * length };
}

function solve(target: Values, spec?: ModuleSpec): Values {
  if (modeOf(spec, target) === "collapse") {
    const { firstAngle } = context(spec, target);
    const angle = ((firstAngle % 180) + 180) % 180;
    return "answer" in target ? { angle: target.angle ?? angle, answer: 0 } : { angle };
  }
  const area = target.area ?? 0;
  const a = target.a ?? 1;
  if (a !== 0 && Math.abs(area / a) <= 3 && Math.abs(area / a * 4 - Math.round(area / a * 4)) < 1e-9) return { a, d: area / a };
  if (a === 0 && area === 0) return { a: 0, d: 1 };
  // Keep a solution on the actual quarter-step rails, including large areas.
  for (let candidate = -3; candidate <= 3; candidate += 0.25) {
    if (target.a !== undefined && candidate !== target.a) continue;
    if (candidate === 0) continue;
    const d = area / candidate;
    if (Math.abs(d) <= 3 && Math.abs(d * 4 - Math.round(d * 4)) < 1e-9) return { a: candidate, d };
  }
  throw new RangeError("The signed area has no solution on these stretch rails");
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 30, xMin: -4.5, xMax: 4.5, yMin: -4.5, yMax: 4.5 });
  const clip = useId().replace(/:/g, "");
  const collapse = modeOf(spec) === "collapse";
  const anchoring = stage === 1;
  const formal = stage === 4;
  const hidden = stage === 3 && verdict === null && guide == null;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const morphing = guide != null && guide < 1;
  const board = useBoardInput(anchoring ? undefined : input, values);
  const task = stage >= 3 ? target : {};
  const { firstAngle, firstLength, secondLength } = context(spec, task);
  const solution = formal ? solve(target, spec) : values;
  const guidedGoal = guide != null && !collapse ? solve(target, spec) : null;
  const guidedA = guidedGoal ? lerp(guidedGoal.a!, 2, span(guide!, 0.5, 1)) : 1;
  const a = guidedGoal ? guidedA : anchoring ? lerp(1, 2.5, span(anchorT, 0.05, 0.4)) : solution.a ?? 1;
  const d = guidedGoal ? lerp(1, (target.area ?? 0) / guidedA, span(guide!, 0, 0.4)) : anchoring ? lerp(1, -1.25, span(anchorT, 0.5, 0.95)) : solution.d ?? 1;
  const angle = anchoring ? lerp(firstAngle + 75, firstAngle, span(anchorT, 0.15, 0.85)) : solution.angle ?? 90;
  const u = collapse ? vector(firstAngle, firstLength) : { x: a, y: 0 };
  const v = collapse ? vector(angle, secondLength) : { x: 0, y: d };
  const area = u.x * v.y - u.y * v.x;
  const flat = Math.abs(area) < 1e-8;
  const fillToken = collapse && flat ? "slate" : area < 0 ? "violet" : "amber";
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const slate = bandColor("slate");
  const rose = bandColor("rose");
  const red = bandColor("red");
  const tileColor = bandColor(fillToken);
  const corners = (p: Point, q: Point) => [{ x: 0, y: 0 }, p, { x: p.x + q.x, y: p.y + q.y }, q];
  const points = (ps: Point[]) => ps.map((p) => `${s.x(p.x)},${s.y(p.y)}`).join(" ");
  const tile = points(corners(u, v));
  const centre = { x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 };
  const visibleTile = !collapse || !hidden;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";

  // Distinct source addresses with coincident images at either parallel alignment.
  const direction = Math.cos((angle - firstAngle) * RAD) < 0 ? -1 : 1;
  const sourceU = { x: 1, y: 0 };
  const sourceV = { x: 0, y: direction * firstLength / secondLength };
  const imageU = u;
  const imageV = { x: v.x * sourceV.y, y: v.y * sourceV.y };
  const revealT = anchoring ? span(anchorT, 0.2, 0.85) : guide ?? 1;
  const dotTargets = !hidden && collapse
    ? [lerp(sourceU.x, imageU.x, revealT), lerp(sourceU.y, imageU.y, revealT), lerp(sourceV.x, imageV.x, revealT), lerp(sourceV.y, imageV.y, revealT)]
    : [sourceU.x, sourceU.y, sourceV.x, sourceV.y];
  const [ux, uy, vx, vy] = useSettle(dotTargets, stage === 3 && verdict !== null && guide == null);

  // The alignment arc lives at the common base, never in a detached diagram.
  const turn = ((angle - firstAngle + 180) % 360 + 360) % 360 - 180;
  const arcStart = vector(firstAngle, 0.65);
  const arcEnd = vector(firstAngle + turn, 0.65);
  const radius = s.xUnit * 0.65;
  const arc = `M ${s.x(arcStart.x)} ${s.y(arcStart.y)} A ${radius} ${radius} 0 0 ${turn > 0 ? 0 : 1} ${s.x(arcEnd.x)} ${s.y(arcEnd.y)}`;

  // Keep the discrepancy attached to the learner's width. Cap an off-board correction.
  const goal = !collapse && missed ? solve(target, spec) : null;
  const correctionA = Math.abs(a) > 1e-8 ? a : goal?.a ?? 1;
  const neededD = (target.area ?? 0) / correctionA;
  const correctionD = clamp(neededD, -4, 4);
  const correctionBaseD = Math.abs(a) > 1e-8 ? d : 0;
  const strip = points([
    { x: 0, y: correctionBaseD }, { x: correctionA, y: correctionBaseD },
    { x: correctionA, y: correctionD }, { x: 0, y: correctionD },
  ]);

  return (
    <Svg anchoring={anchoring} width={W} height={H} label={anchoring ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : spec.stage3Prediction.challengePrompt} gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}>
      <defs>
        <clipPath id={clip}><rect x={s.x(s.xMin)} y={s.y(s.yMax)} width={s.x(s.xMax) - s.x(s.xMin)} height={s.y(s.yMin) - s.y(s.yMax)} /></clipPath>
      </defs>
      {(!collapse || !hidden) && <PlaneGrid s={s} />}
      <g clipPath={`url(#${clip})`}>
        {/* A silent before-state also explains the final reduced-motion frame. */}
        {anchoring && (
          <polygon points={points(corners(collapse ? vector(firstAngle, firstLength) : { x: 1, y: 0 }, collapse ? vector(firstAngle + 75, secondLength) : { x: 0, y: 1 }))}
            fill="none" stroke={slate} strokeWidth={2} strokeDasharray="4 5" opacity={0.45} />
        )}
        {visibleTile && (
          <g data-matrix-area="tile" key={pulse} className="gb-pulse">
            {/* A small transformed grid makes the entire floor's collapse visible. */}
            {collapse && [-1, -0.5, 0, 0.5, 1].map((k) => (
              <g key={k} opacity={0.3}>
                <line x1={s.x(k * u.x - v.x)} y1={s.y(k * u.y - v.y)} x2={s.x(k * u.x + v.x)} y2={s.y(k * u.y + v.y)} stroke={slate} />
                <line x1={s.x(k * v.x - u.x)} y1={s.y(k * v.y - u.y)} x2={s.x(k * v.x + u.x)} y2={s.y(k * v.y + u.y)} stroke={slate} />
              </g>
            ))}
            <polygon points={tile} fill={bandFill(fillToken, 30)} stroke={tileColor} strokeWidth={flat ? 5 : 2} strokeLinejoin="round" />
            {missed && collapse && !flat && <polygon points={tile} fill={bandFill("red", 15)} stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />}
          </g>
        )}
        {missed && !collapse && (
          <g data-matrix-area="discrepancy">
            <polygon points={strip} fill={bandFill("red", 20)} stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
            {Math.abs(neededD) > 4 && <line x1={s.x(0)} x2={s.x(correctionA)} y1={s.y(correctionD)} y2={s.y(correctionD)} stroke={red} strokeWidth={4} />}
          </g>
        )}
        {collapse && (
          <g data-matrix-area="sources">
            {[sourceU, sourceV].map((p, i) => <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={5} fill="none" stroke={rose} strokeWidth={2} strokeDasharray="2 2" />)}
            {!hidden && (
              <g data-matrix-area="landings">
                <line x1={s.x(sourceU.x)} y1={s.y(sourceU.y)} x2={s.x(ux!)} y2={s.y(uy!)} stroke={rose} strokeDasharray="3 5" opacity={0.6} />
                <line x1={s.x(sourceV.x)} y1={s.y(sourceV.y)} x2={s.x(vx!)} y2={s.y(vy!)} stroke={rose} strokeDasharray="3 5" opacity={0.6} />
              </g>
            )}
          </g>
        )}
      </g>

      <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(u.x)} y2={s.y(u.y)} color={blue} width={5} />
      <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(v.x)} y2={s.y(v.y)} color={amber} width={3.5} />
      {collapse && Math.abs(turn) > 0.01 && <path d={arc} fill="none" stroke={amber} strokeWidth={2} />}
      {collapse && !hidden && (
        <g>
          <circle cx={s.x(ux!)} cy={s.y(uy!)} r={6} fill={rose} />
          <circle cx={s.x(vx!)} cy={s.y(vy!)} r={10} fill="none" stroke={rose} strokeWidth={2.5} />
          {missed && "answer" in target && <circle cx={s.x(ux!)} cy={s.y(uy!)} r={15} fill="none" stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />}
          {formal && <Tag x={s.x(ux!) + 12} y={s.y(uy!) - 16} color={rose} anchor="start">Au = Av</Tag>}
          {formal && <Tag x={s.x(sourceV.x) - 12} y={s.y(sourceV.y) + 4} color={rose} anchor="end">u ≠ v</Tag>}
        </g>
      )}
      {!anchoring && !morphing && (
        <g>
          <Tag x={s.x(u.x) + (collapse ? -12 : 0)} y={s.y(u.y) + (collapse ? -14 : 34)} color={blue} anchor={collapse ? "end" : "middle"}>
            {collapse ? formal ? "A" : `${fmt(firstAngle)}°` : `${formal ? "a = " : ""}${fmt(a)}`}
          </Tag>
          <Tag x={s.x(v.x) + 12} y={s.y(v.y) + (collapse ? 22 : -10)} color={amber} anchor="start">
            {collapse ? `${fmt(angle)}°` : `${formal ? "d = " : ""}${fmt(d)}`}
          </Tag>
          {visibleTile && (
            <Tag x={s.x(collapse ? u.x + v.x : centre.x) - (!collapse && flat && a === 0 ? 16 : 0)} y={s.y(collapse ? u.y + v.y : centre.y) + (collapse ? -12 : flat && a !== 0 ? 25 : 5)} color={formal ? collapse ? slate : bandColor("violet") : tileColor} size={16}>
              {hidden ? `? → ${fmt(target.area ?? 0)}` : formal ? `det(A) = ${fmt(area)}` : fmt(area)}
            </Tag>
          )}
          {formal && !collapse && <Tag x={s.x(0) - 12} y={s.y(0) + 32} color={slate} anchor="end">b·c = 0</Tag>}
        </g>
      )}
      {missed && (
        <Tag x={s.x(collapse ? u.x + v.x : correctionA / 2)} y={collapse ? s.y(u.y + v.y) + 16 : s.y(correctionBaseD) + (correctionBaseD >= 0 ? -18 : 25)} color={red} size={14}>
          {collapse && "answer" in target ? "Au = Av" : collapse ? `${signed(verdict.delta)}°` : signed(verdict.delta)}
        </Tag>
      )}

      {!anchoring && (!collapse || !hidden) && <PlaneTicks s={s} avoid={[u, v, centre, ...(collapse ? [sourceU, sourceV, imageU, imageV, { x: u.x + v.x, y: u.y + v.y + 0.4 }, { x: u.x + v.x, y: u.y + v.y - 0.5 }] : formal ? [{ x: 0, y: -1 }] : [])]} />}
      {!anchoring && <Rails input={input} values={values} bind={{
        a: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(0) },
        d: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(0) },
      }} />}
      {board.can("a") && <PlaneHandle x={s.x(a)} y={s.y(0)} color={blue} cursor="ew-resize" onDrag={(p) => board.set("a", s.fromX(p.x))} />}
      {board.can("d") && <PlaneHandle x={s.x(0)} y={s.y(d)} color={amber} cursor="ns-resize" onDrag={(p) => board.set("d", s.fromY(p.y))} />}
      {board.can("angle") && <PlaneHandle x={s.x(v.x)} y={s.y(v.y)} color={amber} onDrag={(p) => {
        const x = s.fromX(p.x);
        const y = s.fromY(p.y);
        if (Math.hypot(x, y) <= 0.05) return;
        const degrees = Math.atan2(y, x) / RAD;
        board.set("angle", degrees < 0 ? x < 0 ? 180 : 0 : degrees);
      }} />}
    </Svg>
  );
}

export const matrixArea: InteractiveDefinition = {
  Board,
  axes: { a: "x", d: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target, spec);
    if (stage === 3) return modeOf(spec) === "collapse" ? { angle: 90 } : { a: 1, d: 1 };
    const initial: Values = { ...spec.stage2Exploration.fixed };
    for (const c of spec.stage2Exploration.controls) initial[c.variableName] = c.initial;
    return initial;
  },
  predictionControls(spec, target) {
    const controls: ControlDef[] = spec.stage2Exploration.controls.map(({ variableName, label, min, max, step, colorToken }) => ({ variableName, label, min, max, step, colorToken }));
    if (modeOf(spec) === "collapse" && "answer" in target) controls.push({
      variableName: "answer", label: "Au, Av", min: 0, max: 1, step: 1, colorToken: "rose", choices: [0, 1],
      choiceLabels: { 0: "lesson.choice.matrix-area.overlapping", 1: "lesson.choice.matrix-area.separate" },
    });
    return controls;
  },
  solve,
  evaluate(values, target, tolerance, spec): Verdict {
    if (modeOf(spec, target) === "collapse") {
      if ("answer" in target) {
        if (values.answer === 0) return { correct: true, delta: 0 };
        return { correct: false, delta: (values.answer ?? -1), kind: "thin" };
      }
      if (!Number.isFinite(values.angle)) return { correct: false, delta: 180, kind: "thin" };
      const delta = alignmentDelta(values.angle!, context(spec, target).firstAngle);
      if (Math.abs(delta) <= tolerance + 1e-9) return { correct: true, delta: 0 };
      return { correct: false, delta, kind: Math.abs(Math.abs(delta) - 90) <= tolerance + 1e-9 ? "perpendicular" : "thin" };
    }
    const actual = (values.a ?? 1) * (values.d ?? 1);
    const expected = target.area ?? 0;
    const delta = actual - expected;
    if (Math.abs(delta) <= tolerance + 1e-9) return { correct: true, delta: 0 };
    if (actual * expected < 0 && Math.abs(Math.abs(actual) - Math.abs(expected)) <= tolerance + 1e-9) return { correct: false, delta, kind: "unsigned" };
    return { correct: false, delta };
  },
  formatDelta: (v) => signed(v.delta),
};
