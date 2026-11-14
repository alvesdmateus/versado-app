import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, fmt, SEAM } from "../bands";
import { Arrow, PlaneGrid, PlaneTicks, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

const W = 340;
const H = 340;
const GUTTER = { left: RAIL_GUTTER, bottom: RAIL_GUTTER };
type Point = { x: number; y: number };
const FLAG: Point[] = [
  { x: 0, y: 0 }, { x: 0.45, y: 0 }, { x: 0.45, y: 0.9 },
  { x: 1.1, y: 0.9 }, { x: 1.1, y: 1.3 }, { x: 0.45, y: 1.3 },
  { x: 0.45, y: 1.6 }, { x: 1.5, y: 1.6 }, { x: 1.5, y: 2 }, { x: 0, y: 2 },
];

/** Quarter turns are anticlockwise; exact integer landings also work at zero tolerance. */
export function rotatePoint(p: Point, turn: number): Point {
  const angle = turn * Math.PI / 2;
  const clean = (v: number) => Math.abs(v) < 1e-10 ? 0 : Number(v.toFixed(10));
  return { x: clean(Math.cos(angle) * p.x - Math.sin(angle) * p.y), y: clean(Math.sin(angle) * p.x + Math.cos(angle) * p.y) };
}

/** Only task context overrides fixed parameters; learner x/y never configure the source. */
export function turnCase(target: Values, spec?: ModuleSpec) {
  const fixed = spec?.stage2Exploration.fixed ?? {};
  return { turn: target.turn ?? fixed.turn ?? 1, p: { x: target.px ?? fixed.px ?? 2, y: target.py ?? fixed.py ?? 1 } };
}

function solve(target: Values, spec?: ModuleSpec): Values {
  const { turn, p } = turnCase(target, spec);
  const landing = rotatePoint(p, turn);
  // Include the frozen turn so assisted practice can preset it without locking x/y.
  return { turn, x: target.x ?? landing.x, y: target.y ?? landing.y };
}

function arcPoints(s: PlaneScale, p: Point, turn: number) {
  const steps = Math.max(1, Math.ceil(Math.abs(turn) * 24));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const q = rotatePoint(p, turn * i / steps);
    return `${s.x(q.x)},${s.y(q.y)}`;
  }).join(" ");
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 30, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
  const clip = useId().replace(/:/g, "");
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const slate = bandColor("slate");
  const red = bandColor("red");
  const anchoring = stage === 1;
  const guided = guide != null;
  const predicting = stage === 3 && !guided;
  const hidden = predicting && verdict === null;
  const missed = predicting && verdict !== null && !verdict.correct;
  const task = turnCase(stage >= 3 ? target : {}, spec);
  const requestedTurn = stage >= 3 ? task.turn : values.turn ?? 0;
  const t = Math.min(1, Math.max(0, anchorT));
  const wanted = anchoring ? t * t * (3 - 2 * t) : guided ? task.turn * Math.min(1, Math.max(0, guide)) : hidden ? 0 : requestedTurn;
  // A single angle keeps the grid, flag, basis and dot rigid throughout the reveal.
  const [turn = wanted] = useSettle([wanted], !anchoring && !guided && !hidden);
  const p = task.p;
  const landing = rotatePoint(p, turn);
  const iTip = rotatePoint({ x: 1, y: 0 }, turn);
  const jTip = rotatePoint({ x: 0, y: 1 }, turn);
  const exactLanding = rotatePoint(p, requestedTurn);
  const exactI = rotatePoint({ x: 1, y: 0 }, requestedTurn);
  const exactJ = rotatePoint({ x: 0, y: 1 }, requestedTurn);
  const marker = { x: values.x ?? 0, y: values.y ?? 0 };
  const boardInput = anchoring || guided ? undefined : input;
  const board = useBoardInput(boardInput, values);
  const turnControl = spec.stage2Exploration.controls.find((c) => c.variableName === "turn");
  const turnColor = bandColor(turnControl?.colorToken ?? "slate");
  const formal = stage === 4;
  const morphing = guided && guide < 1;
  const points = FLAG.map((q) => `${s.x(q.x)},${s.y(q.y)}`).join(" ");
  const coordinates = (q: Point) => `(${fmt(q.x)}, ${fmt(q.y)})`;
  const tag = (q: Point, color: string, text: string) => (
    <Tag x={s.x(q.x) + (q.x < 0 ? -12 : 12)} y={s.y(q.y) + (q.y < 0 ? 23 : -12)} color={color} anchor={q.x < 0 ? "end" : "start"} size={12}>{text}</Tag>
  );
  // The small direction cue shows the task's turn, never the marked point's landing.
  const cueTurn = hidden ? requestedTurn : turn;
  const cueStart = { x: 0.65, y: 0 };
  const cueEnd = rotatePoint(cueStart, cueTurn);
  const cueBefore = rotatePoint(cueStart, cueTurn - Math.sign(cueTurn) * 0.16);

  return (
    <Svg width={W} height={H} gutter={GUTTER} anchoring={anchoring} label={anchoring ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : spec.stage3Prediction.challengePrompt}>
      <defs><clipPath id={clip}><rect x={s.x(-5)} y={s.y(5)} width={s.x(5) - s.x(-5)} height={s.y(-5) - s.y(5)} /></clipPath></defs>
      <PlaneGrid s={s} />
      <g clipPath={`url(#${clip})`}>
        {/* A persistent source outline makes the turn legible with reduced motion too. */}
        <g opacity={0.35} data-turn-source="">
          <polygon points={points} fill="none" stroke={slate} strokeWidth={1.5} strokeDasharray="3 3" />
          <circle cx={s.x(p.x)} cy={s.y(p.y)} r={5} fill="none" stroke={rose} strokeWidth={2} />
        </g>
        <g data-turn-floor={hidden ? "source" : "revealed"} transform={`rotate(${-turn * 90} ${s.x(0)} ${s.y(0)})`}>
          {Array.from({ length: 21 }, (_, i) => i - 10).map((k) => (
            <g key={k} stroke={SEAM} strokeWidth={1} opacity={0.65}>
              <line x1={s.x(k)} x2={s.x(k)} y1={s.y(-10)} y2={s.y(10)} />
              <line x1={s.x(-10)} x2={s.x(10)} y1={s.y(k)} y2={s.y(k)} />
            </g>
          ))}
          <polygon points={points} fill={bandFill("rose", 22)} stroke={rose} strokeWidth={2} strokeLinejoin="round" />
        </g>
        {!hidden && <polyline data-turn-trail="" points={arcPoints(s, p, turn)} fill="none" stroke={rose} strokeWidth={1.5} strokeDasharray="3 3" />}
        <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(iTip.x)} y2={s.y(iTip.y)} color={blue} width={5} />
        <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(jTip.x)} y2={s.y(jTip.y)} color={amber} width={5} />
        {!hidden && <circle data-turn-landing="" cx={s.x(landing.x)} cy={s.y(landing.y)} r={7} fill={rose} />}
        {cueTurn !== 0 && (
          <g>
            <polyline points={arcPoints(s, cueStart, cueTurn)} fill="none" stroke={turnColor} strokeWidth={2} />
            <Arrow x1={s.x(cueBefore.x)} y1={s.y(cueBefore.y)} x2={s.x(cueEnd.x)} y2={s.y(cueEnd.y)} color={turnColor} width={2} head={7} />
          </g>
        )}
        {missed && (
          <g data-turn-miss="">
            <line x1={s.x(marker.x)} y1={s.y(marker.y)} x2={s.x(landing.x)} y2={s.y(landing.y)} stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
            <Tag x={s.x((marker.x + landing.x) / 2) + 10} y={s.y((marker.y + landing.y) / 2) - 10} color={red} size={12}>{`Δ ${fmt(verdict.delta)}`}</Tag>
          </g>
        )}
      </g>
      {!anchoring && <PlaneTicks s={s} avoid={[p, landing, iTip, jTip, ...(predicting ? [marker] : [])]} />}
      {!anchoring && !morphing && (
        <g>
          {hidden ? tag(p, rose, coordinates(p)) : tag(landing, rose, formal ? spec.stage4Formalization.colorMapping[2]?.symbol ?? "(−y, x)" : coordinates(exactLanding))}
          {!hidden && tag(iTip, blue, formal ? spec.stage4Formalization.colorMapping[0]?.symbol ?? coordinates(exactI) : coordinates(exactI))}
          {!hidden && tag(jTip, amber, formal ? spec.stage4Formalization.colorMapping[1]?.symbol ?? coordinates(exactJ) : coordinates(exactJ))}
          <Tag x={s.x(0.8)} y={s.y(-0.8)} color={turnColor} anchor="start" size={12}>{`${fmt(requestedTurn)} × 90°`}</Tag>
        </g>
      )}
      {predicting && (
        <g key={changed ? `${changed.name}-${changed.tick}` : "marker"} data-turn-marker="">
          <circle cx={s.x(marker.x)} cy={s.y(marker.y)} r={10} fill="none" stroke={missed ? red : rose} strokeWidth={2.5} />
          <path d={`M ${s.x(marker.x) - 5} ${s.y(marker.y)} h 10 M ${s.x(marker.x)} ${s.y(marker.y) - 5} v 10`} fill="none" stroke={missed ? red : rose} strokeWidth={1.5} />
        </g>
      )}
      <Rails input={boardInput} values={values} bind={{
        x: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(marker.y) },
        y: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(marker.x) },
      }} />
      {(board.can("x") || board.can("y")) && (
        <PlaneHandle x={s.x(marker.x)} y={s.y(marker.y)} color={rose} onDrag={(pt) => { board.set("x", s.fromX(pt.x)); board.set("y", s.fromY(pt.y)); }} />
      )}
      {stage === 2 && board.can("turn") && (
        <PlaneHandle x={s.x(iTip.x)} y={s.y(iTip.y)} color={turnColor} onDrag={(pt) => board.set("turn", Math.atan2(s.fromY(pt.y), s.fromX(pt.x)) / (Math.PI / 2))} />
      )}
    </Svg>
  );
}

export const matrixTurn: InteractiveDefinition = {
  Board,
  axes: { x: "x", y: "y" },
  initialValues(spec, stage, target) {
    if (stage === 3) return { x: 0, y: 0 };
    if (stage === 4) return solve(target, spec);
    return Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
  },
  predictionControls() {
    return [
      { variableName: "x", label: "x", min: -4, max: 4, step: 1, colorToken: "rose" },
      { variableName: "y", label: "y", min: -4, max: 4, step: 1, colorToken: "rose" },
    ];
  },
  solve,
  evaluate(values, target, tolerance, spec) {
    const goal = solve(target, spec);
    const x = values.x ?? 0;
    const y = values.y ?? 0;
    const near = (q: Point) => Math.abs(x - q.x) <= tolerance + 1e-9 && Math.abs(y - q.y) <= tolerance + 1e-9;
    const delta = Math.hypot(x - goal.x!, y - goal.y!);
    if (near({ x: goal.x!, y: goal.y! })) return { correct: true, delta: 0 };
    const { turn, p } = turnCase(target, spec);
    if (near(rotatePoint(p, -turn))) return { correct: false, delta, kind: "clockwise" };
    if (near({ x: p.y, y: p.x })) return { correct: false, delta, kind: "swap" };
    return { correct: false, delta };
  },
  formatDelta: (verdict) => `Δ ${fmt(verdict.delta)}`,
};
