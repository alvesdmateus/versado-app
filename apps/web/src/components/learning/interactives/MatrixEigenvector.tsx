import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, fmt, SEAM, signed } from "../bands";
import { Arrow, lerp, PlaneGrid, Svg, Tag, span, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, useBoardInput } from "./rail";
import type { ControlDef, BoardProps, InteractiveDefinition, Values, Verdict } from "./types";

/** A nonzero probe selects a line, not a direction: Av = λv includes negative and zero λ.
 * Task matrix entries override fixed context; the representative target angle never becomes input.
 * Assisted tasks freeze that representative and ask which numbered landing is the image.
 */
const W = 340;
const H = 340;
const PROBE = 1.4;
const RAD = Math.PI / 180;
type Point = { x: number; y: number };
type Matrix = { a: number; b: number; c: number; d: number };
const DEFAULT_MATRIX: Matrix = { a: 1.5, b: 0.5, c: 0.5, d: 1.5 };

function matrixOf(target: Values, spec?: ModuleSpec): Matrix {
  const fixed = spec?.stage2Exploration.fixed ?? {};
  const pick = (key: keyof Matrix) => target[key] ?? fixed[key] ?? DEFAULT_MATRIX[key];
  return { a: pick("a"), b: pick("b"), c: pick("c"), d: pick("d") };
}

function unit(angle: number): Point {
  return { x: Math.cos(angle * RAD), y: Math.sin(angle * RAD) };
}

function apply(m: Matrix, v: Point): Point {
  return { x: m.a * v.x + m.b * v.y, y: m.c * v.x + m.d * v.y };
}

const normalize = (angle: number) => ((angle % 360) + 360) % 360;

/** Distance between unoriented lines, in degrees (parallel and antiparallel both give zero). */
export function lineAngle(a: number, b: number): number {
  const d = Math.abs(normalize(a) - normalize(b)) % 180;
  return Math.min(d, 180 - d);
}

/** Geometric evidence shared by evaluation and the board; perpendicular projection is signed. */
export function probeImage(angle: number, target: Values, spec?: ModuleSpec) {
  const probe = unit(angle);
  const matrix = matrixOf(target, spec);
  const output = apply(matrix, probe);
  const factor = probe.x * output.x + probe.y * output.y;
  const sideways = probe.x * output.y - probe.y * output.x;
  // A zero image belongs to the original line too (the zero eigenvalue).
  const rounding = Number.EPSILON * Math.max(Math.abs(matrix.a), Math.abs(matrix.b), Math.abs(matrix.c), Math.abs(matrix.d)) * 8;
  const error = Math.hypot(output.x, output.y) <= rounding ? 0 : Math.atan2(Math.abs(sideways), Math.abs(factor)) / RAD;
  return { probe, output, factor, sideways, error };
}

function solve(target: Values): Values {
  const probeAngle = normalize(target.probeAngle ?? 45);
  return target.answer === undefined ? { probeAngle } : { probeAngle, answer: 0 };
}

function angleControl(spec: ModuleSpec): ControlDef {
  const c = spec.stage2Exploration.controls.find((c) => c.variableName === "probeAngle");
  return {
    variableName: "probeAngle", label: c?.label ?? "θ", min: 0, max: 355, step: 5,
    colorToken: c?.colorToken ?? "amber",
  };
}

/** The fixed blue warp supplies context without disclosing the moving probe's output. */
function Warp({ s, m }: { s: PlaneScale; m: Matrix }) {
  return (
    <g opacity={0.3} aria-hidden>
      {Array.from({ length: 13 }, (_, i) => i - 6).flatMap((k) => [
        [{ x: k, y: -8 }, { x: k, y: 8 }],
        [{ x: -8, y: k }, { x: 8, y: k }],
      ].map(([p, q], j) => {
        const from = apply(m, p!);
        const to = apply(m, q!);
        return <line key={`${k}-${j}`} x1={s.x(from.x)} y1={s.y(from.y)} x2={s.x(to.x)} y2={s.y(to.y)} stroke={bandColor("blue")} strokeWidth={k === 0 ? 1.5 : 1} />;
      }))}
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 25, xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 });
  const clip = useId().replace(/:/g, "");
  const board = useBoardInput(input, values);
  const amber = bandColor(angleControl(spec).colorToken);
  const emerald = bandColor("emerald");
  const rose = bandColor("rose");
  const red = bandColor("red");
  const slate = bandColor("slate");
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && verdict === null && !guided;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const assisted = stage >= 3 && target.answer !== undefined;
  const formal = stage === 4;
  const labels = !anchoring && (!guided || guide >= 1);
  const context = stage >= 3 ? target : {};
  const fixed = matrixOf(context, spec);
  const progress = anchoring ? span(anchorT, 0.15, 0.95) : guided ? span(guide, 0.35, 1) : 1;
  const m = { a: lerp(1, fixed.a, progress), b: fixed.b * progress, c: fixed.c * progress, d: lerp(1, fixed.d, progress) };
  const angle = anchoring ? 45 : assisted ? target.probeAngle ?? 45 : values.probeAngle ?? 20;
  const evidence = probeImage(angle, context, spec);
  const v = { x: evidence.probe.x * PROBE, y: evidence.probe.y * PROBE };
  const actual = apply(m, v);
  const shownTarget = hidden ? v : actual;
  const [ox, oy] = useSettle([shownTarget.x, shownTarget.y], !anchoring && !guided) as [number, number];
  const output = { x: ox, y: oy };
  const projected = { x: v.x * evidence.factor, y: v.y * evidence.factor };
  const aligned = evidence.error <= spec.stage3Prediction.tolerance + 1e-9;
  const tip = (p: Point) => ({ x: s.x(p.x), y: s.y(p.y) });
  const line = (p: Point, q: Point) => ({ x1: s.x(p.x), y1: s.y(p.y), x2: s.x(q.x), y2: s.y(q.y) });
  const track = (degrees: number, length = 3.2) => {
    const u = unit(degrees);
    return line({ x: -u.x * length, y: -u.y * length }, { x: u.x * length, y: u.y * length });
  };
  const tag = (p: Point, text: string, color: string, below = false) => (
    <Tag x={Math.max(38, Math.min(W - 38, s.x(p.x)))} y={Math.max(18, Math.min(H - 12, s.y(p.y) + (below ? 22 : -13)))} color={color} size={12}>{text}</Tag>
  );
  // A tag pushed outward along its arrow, so tags on nearby tips (probe, landing) never stack.
  const radial = (p: Point, text: string, color: string, extra = 14) => {
    const dx = s.x(p.x) - s.x(0);
    const dy = s.y(p.y) - s.y(0);
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const anchor = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "middle";
    const x = Math.max(8, Math.min(W - 8, s.x(p.x) + ux * extra));
    const y = Math.max(18, Math.min(H - 8, s.y(p.y) + uy * extra + 4));
    return <Tag x={x} y={y} color={color} size={12} anchor={anchor}>{text}</Tag>;
  };
  // Beside the gap between where the landing is and where it would stay on track, away from the probe.
  const sideTag = (a: Point, b: Point, text: string, color: string) => {
    const mx = (s.x(a.x) + s.x(b.x)) / 2;
    const my = (s.y(a.y) + s.y(b.y)) / 2;
    const gx = s.x(b.x) - s.x(a.x);
    const gy = s.y(b.y) - s.y(a.y);
    const len = Math.hypot(gx, gy) || 1;
    let nx = -gy / len;
    let ny = gx / len;
    if (nx * (mx - s.x(0)) + ny * (my - s.y(0)) < 0) [nx, ny] = [-nx, -ny];
    return <Tag x={mx + nx * 14} y={my + ny * 14 + 4} color={color} size={12} anchor={nx > 0.35 ? "start" : nx < -0.35 ? "end" : "middle"}>{text}</Tag>;
  };
  // Rotate the true image by a quarter turn: the distractor has exactly the same length.
  const sideways = { x: -actual.y, y: actual.x };
  const picked = values.answer === 1 ? sideways : actual;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";

  return (
    <Svg anchoring={anchoring} width={W} height={H} label={spec.targetSkill} gutter={{ left: 0, bottom: 0 }}>
      <defs><clipPath id={clip}><rect x={s.x(s.xMin)} y={s.y(s.yMax)} width={s.x(s.xMax) - s.x(s.xMin)} height={s.y(s.yMin) - s.y(s.yMax)} /></clipPath></defs>
      <PlaneGrid s={s} />
      <g clipPath={`url(#${clip})`}>
        <Warp s={s} m={m} />
        {/* Original tracks and ghost arrows remain informative in the reduced-motion final frame. */}
        {anchoring && Array.from({ length: 8 }, (_, i) => 22.5 + i * 45).map((degrees) => {
          const u = unit(degrees);
          const p = { x: u.x * PROBE, y: u.y * PROBE };
          const q = apply(m, p);
          return <g key={degrees}>
            <line {...track(degrees, 2.9)} stroke={slate} strokeWidth={1} opacity={0.2} />
            <Arrow {...line({ x: 0, y: 0 }, p)} color={slate} opacity={0.35} width={2} dashed />
            <Arrow {...line({ x: 0, y: 0 }, q)} color={slate} width={2} opacity={0.7} />
          </g>;
        })}
        {anchoring && <g>
          <line {...track(135)} stroke={amber} strokeWidth={3} opacity={0.35} />
          <Arrow {...line({ x: 0, y: 0 }, { x: -v.x, y: v.y })} color={amber} width={4} />
        </g>}
        {stage >= 3 && target.excludeAngle !== undefined && <g>
          <line {...track(target.excludeAngle)} stroke={slate} strokeWidth={2} strokeDasharray="3 3" opacity={0.6} />
          {tag({ x: unit(target.excludeAngle).x * 2.8, y: unit(target.excludeAngle).y * 2.8 }, `≠ ${fmt(target.excludeAngle)}°`, slate)}
        </g>}
        {!hidden && aligned && <line {...track(angle)} stroke={amber} strokeWidth={10} opacity={0.12} />}
        <line {...track(angle)} stroke={amber} strokeWidth={2} opacity={0.55} />
        <g key={pulse} className="gb-pulse">
          <Arrow {...line({ x: 0, y: 0 }, v)} color={amber} width={5} />
        </g>
        <circle cx={tip(v).x} cy={tip(v).y} r={5} stroke={amber} strokeWidth={2} fill="var(--color-gb-ground)" />
        {assisted && [actual, sideways].map((p, i) => <g key={i} data-landing={i}>
          <circle cx={tip(p).x} cy={tip(p).y} r={10} fill="var(--color-gb-ground)" stroke={values.answer === i ? amber : slate} strokeWidth={values.answer === i ? 3 : 2} />
          {tag(p, String(i), slate)}
        </g>)}
        {!hidden && <g data-probe-output>
          <Arrow {...line({ x: 0, y: 0 }, output)} color={emerald} width={3} />
          {!aligned && <line {...line(output, projected)} stroke={missed ? red : rose} strokeWidth={2.5} strokeDasharray={missed ? "6 4" : "3 3"} className={missed ? "gb-march" : undefined} />}
          {labels && radial(output, `${formal && aligned ? "λ = " : "× "}${aligned ? signed(evidence.factor) : fmt(Math.hypot(evidence.output.x, evidence.output.y))}`, emerald)}
          {labels && !aligned && sideTag(actual, projected, `${Math.round(evidence.error)}°`, missed ? red : rose)}
        </g>}
        {missed && assisted && values.answer === 1 && <g>
          <line {...line(picked, actual)} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          {tag({ x: (picked.x + actual.x) / 2, y: (picked.y + actual.y) / 2 }, "90°", red)}
        </g>}
        {missed && target.excludeAngle !== undefined && lineAngle(angle, target.excludeAngle) <= spec.stage3Prediction.tolerance + 1e-9 && <g>
          <line {...track(angle)} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          {tag({ x: -v.x * 1.7, y: -v.y * 1.7 }, `≠ ${fmt(target.excludeAngle)}°`, red)}
        </g>}
        {labels && radial(v, formal ? "v" : `${fmt(angle)}°`, amber, Math.hypot(output.x - v.x, output.y - v.y) < 0.6 ? -18 : 14)}
        {formal && <Tag x={W - 32} y={48} color={bandColor("blue")} anchor="end">A</Tag>}
      </g>
      {stage !== 1 && board.can("probeAngle") && <PlaneHandle x={s.x(v.x)} y={s.y(v.y)} color={amber} onDrag={(pt) => {
        const x = s.fromX(pt.x);
        const y = s.fromY(pt.y);
        if (Math.hypot(x, y) > 0.1) board.set("probeAngle", normalize(Math.atan2(y, x) / RAD));
      }} />}
      <circle cx={s.x(0)} cy={s.y(0)} r={3} fill={SEAM} />
    </Svg>
  );
}

export const matrixEigenvector: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3 && target.answer !== undefined) return { probeAngle: target.probeAngle ?? 45 };
    return { probeAngle: spec.stage2Exploration.controls.find((c) => c.variableName === "probeAngle")?.initial ?? 20 };
  },
  predictionControls(spec, target) {
    const angle = angleControl(spec);
    return target.answer === undefined ? [angle] : [angle, {
      variableName: "answer", label: "?", min: 0, max: 1, step: 1, colorToken: "slate", choices: [0, 1],
    }];
  },
  solve,
  evaluate(values, target, tolerance, spec): Verdict {
    if (target.answer !== undefined) {
      if (values.answer === 0) return { correct: true, delta: 0 };
      return values.answer === 1 ? { correct: false, delta: 90, kind: "sideways" } : { correct: false, delta: 90 };
    }
    const angle = values.probeAngle;
    if (angle === undefined || !Number.isFinite(angle)) return { correct: false, delta: 90 };
    const { error } = probeImage(angle, target, spec);
    if (!Number.isFinite(error)) return { correct: false, delta: 90 };
    if (target.excludeAngle !== undefined && lineAngle(angle, target.excludeAngle) <= tolerance + 1e-9) {
      return { correct: false, delta: lineAngle(angle, target.probeAngle ?? 45) };
    }
    if (error <= tolerance + 1e-9) return { correct: true, delta: 0 };
    return { correct: false, delta: error, kind: "sideways" };
  },
  formatDelta(verdict) { return `${fmt(verdict.delta)}°`; },
};
