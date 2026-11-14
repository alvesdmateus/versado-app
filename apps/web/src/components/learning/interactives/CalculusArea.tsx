import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, signed } from "../bands";
import { ChoiceGrid } from "../controls";
import { Arrow, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardInput, BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

const W = 340;
const H = 350;
export const areaAt = (x: number) => (6 * x * x - x * x * x) / 3;
export const edgeHeight = (x: number) => 4 * x - x * x;
export const leftSum = (a: number, b: number, n: number) => (b - a) * (a + b - (b - a) / n);
const modeOf = (spec?: ModuleSpec, target: Values = {}) => spec?.stage2Exploration.fixed.mode ?? ("sweep_x" in target ? 2 : 1);
const finite = (v: number | undefined, fallback: number) => Number.isFinite(v) ? v! : fallback;
const control = (spec: ModuleSpec, name: string): ControlDef => {
  const c = spec.stage2Exploration.controls.find((c) => c.variableName === name)!;
  return { variableName: c.variableName, label: c.label, min: c.min, max: c.max, step: c.step, colorToken: c.colorToken };
};

function solve(target: Values, spec?: ModuleSpec): Values {
  if (modeOf(spec, target) === 2) return { sweep_x: target.sweep_x ?? 2, ...("answer" in target ? { answer: edgeHeight(target.sweep_x ?? 2) } : {}) };
  return { right_bound_b: target.right_bound_b ?? 2, slice_count_n: target.slice_count_n ?? 200, ...("answer" in target ? { answer: (target.right_bound_b ?? 2) ** 2 - (target.left_bound_a ?? 0) ** 2 } : {}) };
}

function rateControl(target: Values): ControlDef {
  const x = target.sweep_x ?? 2;
  const choices = [edgeHeight(x), areaAt(x), x, 4 - 2 * x];
  return { variableName: "answer", label: "A′(x)", colorToken: "emerald", min: Math.min(...choices), max: Math.max(...choices), step: 1 / 3, choices: [...new Set(choices)] };
}

/** The area outline is sampled from the same function as the strips, never from their sum. */
function region(s: PlaneScale, a: number, b: number, f: (x: number) => number) {
  const points = Array.from({ length: 49 }, (_, i) => {
    const x = lerp(a, b, i / 48);
    return `${s.x(x)},${s.y(f(x))}`;
  });
  return `M ${s.x(a)},${s.y(0)} L ${points.join(" L ")} L ${s.x(b)},${s.y(0)} Z`;
}

function trace(s: PlaneScale, a: number, b: number, f: (x: number) => number) {
  return Array.from({ length: 81 }, (_, i) => {
    const x = lerp(a, b, i / 80);
    return `${i === 0 ? "M" : "L"} ${s.x(x)},${s.y(f(x))}`;
  }).join(" ");
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const ftc = modeOf(spec) === 2;
  const anchor = stage === 1;
  const formal = stage === 4;
  const guided = guide != null;
  const hidden = stage === 3 && !guided && verdict === null;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const labels = !anchor && (!guided || guide >= 1);
  const practiceRate = ftc && stage === 3 && "answer" in target;
  const goal = solve(target, spec);
  const shown = formal ? goal : values;
  const name = ftc ? "sweep_x" : "right_bound_b";
  const start = ftc ? 0.5 : 1;
  const raw = anchor ? lerp(0.4, ftc ? 3.3 : 2.6, span(anchorT, 0.08, 0.9))
    : guided ? lerp(start, goal[name]!, span(guide, 0, 0.65)) : finite(shown[name], start);
  const edge = clamp(raw, 0, ftc ? 4 : 3);
  const n = Math.round(clamp(anchor ? lerp(4, 100, span(anchorT, 0.2, 0.9))
    : guided ? lerp(4, goal.slice_count_n ?? 200, span(guide, 0.15, 0.85))
      : stage >= 3 && !("slice_count_n" in target) ? 200 : finite(shown.slice_count_n, 4), 4, 200));
  const s = usePlane({ width: W, height: ftc ? 185 : 225, pad: 30, xMin: -0.3, xMax: ftc ? 4.6 : 3.6, yMin: -0.8, yMax: ftc ? 5.2 : 7 });
  const lower = usePlane({ width: W, height: 155, pad: 30, xMin: -0.3, xMax: 4.6, yMin: -1.5, yMax: 12 });
  const signedPlane = usePlane({ width: W, height: 110, pad: 22, xMin: -1.5, xMax: 1.5, yMin: -2.6, yMax: 2.6 });
  const blue = bandColor("blue"), amber = bandColor("amber"), emerald = bandColor("emerald"), slate = bandColor("slate"), red = bandColor("red");
  const f = ftc ? edgeHeight : (x: number) => 2 * x;
  const a = spec.stage2Exploration.fixed.left_bound_a ?? 0;
  const exact = edge * edge - a * a;
  const sum = leftSum(a, edge, n);
  const dx = (edge - a) / n;
  const selected = a + Math.floor(n * 0.65) * dx;
  // The only live practice quantity is position, followed by the computed-rate choice.
  const positioned = practiceRate && Math.abs(edge - (target.sweep_x ?? 2)) < 1e-8;
  const boardInput: BoardInput | undefined = anchor || guided || formal ? undefined : input && {
    ...input, locked: [...(input.locked ?? []), ...(positioned ? ["sweep_x"] : [])],
  };
  const board = useBoardInput(boardInput, values);
  const answerControl = practiceRate ? input?.controls.find((c) => c.variableName === "answer") : undefined;
  const [reveal = 1] = useSettle([hidden ? 0 : 1], !anchor && !guided);
  const rateVisible = !hidden;
  const taskEdge = clamp(goal[name]!, 0, ftc ? 4 : 3);
  const deltaPath = region(s, Math.min(edge, taskEdge), Math.max(edge, taskEdge), f);
  const diagnosticX = verdict?.kind === "coarse" ? selected + dx / 2 : (edge + taskEdge) / 2;
  const diagnosticY = verdict?.kind === "coarse" ? f(diagnosticX) + 0.5 : f(diagnosticX) * 0.6;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";
  const nudge = 0.18;
  const patch = (at: number) => region(s, at >= 3.8 ? at - nudge : at, at >= 3.8 ? at : at + nudge, f);
  const tangent = (at: number, rate: number) => `M ${lower.x(at - 0.3)},${lower.y(areaAt(at) - 0.3 * rate)} L ${lower.x(at + 0.3)},${lower.y(areaAt(at) + 0.3 * rate)}`;

  return <>
    <Svg width={W} height={H} anchoring={anchor} gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }} label={anchor ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : spec.stage3Prediction.challengePrompt}>
      <PlaneGrid s={s} />
      {ftc ? <path data-calculus="area" d={region(s, 0, edge, f)} fill={bandFill("blue", 28)} stroke={blue} strokeWidth={1.5} />
        : <g key={pulse} className={anchor || guided ? undefined : "gb-pulse"} data-calculus="strips" data-count={n}>
          {Array.from({ length: n }, (_, i) => {
            const left = a + i * dx, right = left + dx, height = 2 * left;
            return <g key={i}>
              <rect x={s.x(left)} y={s.y(Math.max(0, height))} width={Math.max(0, dx * s.xUnit)} height={Math.abs(height) * s.yUnit} fill={bandFill("blue", 35)} stroke={blue} strokeWidth={n > 40 ? 0.35 : 1} />
              <path data-calculus="sliver" d={`M ${s.x(left)},${s.y(height)} L ${s.x(right)},${s.y(height)} L ${s.x(right)},${s.y(2 * right)} Z`} fill={bandFill("amber", 24)} />
            </g>;
          })}
        </g>}
      {anchor && <path data-calculus="ghost" d={ftc ? patch(1) : region(s, 0, 2.6, f)} fill="none" stroke={slate} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.45} />}
      <path d={trace(s, 0, ftc ? 4 : 3, f)} fill="none" stroke={slate} strokeWidth={2.5} strokeLinecap="round" />
      <Arrow x1={s.x(ftc ? 3.9 : 2.9)} y1={s.y(f(ftc ? 3.9 : 2.9))} x2={s.x(ftc ? 4 : 3)} y2={s.y(f(ftc ? 4 : 3))} color={slate} width={2.5} head={8} />
      <line x1={s.x(a)} x2={s.x(a)} y1={s.y(0)} y2={s.y(f(a)) - 8} stroke={amber} strokeWidth={2} />
      <line key={`wall-${pulse}`} className={anchor || guided ? undefined : "gb-pulse"} data-calculus="edge" x1={s.x(edge)} x2={s.x(edge)} y1={s.y(0)} y2={s.y(f(edge))} stroke={amber} strokeWidth={4} />
      {verdict?.correct && <path d={region(s, a, edge, f)} fill="none" stroke={emerald} strokeWidth={2} />}
      {missed && !ftc && <g data-calculus="discrepancy">
        {verdict.kind === "coarse" ? Array.from({ length: n }, (_, i) => {
          const left = a + i * dx, right = left + dx;
          return <path key={i} d={`M ${s.x(left)},${s.y(f(left))} L ${s.x(right)},${s.y(f(left))} L ${s.x(right)},${s.y(f(right))} Z`} fill={bandFill("red", 20)} stroke={red} strokeWidth={1.5} strokeDasharray="6 4" className="gb-march" />;
        }) : <path d={deltaPath} fill={bandFill("red", 14)} stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march" />}
        <Tag x={s.x(diagnosticX)} y={s.y(diagnosticY)} color={red}>{signed(verdict.delta)}</Tag>
      </g>}
      {labels && <>
        <Tag x={s.x(edge)} y={s.y(0) + 32} color={amber}>{formal ? `${ftc ? "x" : "b"} = ` : ""}{fmt(edge)}</Tag>
        {!ftc && <>
          {!hidden && <Tag x={s.x(Math.max(edge / 2, 0.7))} y={s.y(Math.max(edge * 0.55, 0.5))} color={blue}>{edge === a ? "0" : fmt(sum)}</Tag>}
          <Tag x={s.x(edge)} y={s.y(f(edge)) - 16} color={hidden || formal ? amber : blue}>{hidden ? "?" : formal ? `∫ = ${fmt(exact)}` : `${n} strips`}</Tag>
          <line x1={s.x(selected)} x2={s.x(selected + dx)} y1={s.y(0) + 9} y2={s.y(0) + 9} stroke={amber} strokeWidth={3} />
          {formal && <>
            <line x1={s.x(selected)} x2={s.x(selected)} y1={s.y(0)} y2={s.y(f(selected))} stroke={blue} strokeWidth={3} />
            <Tag x={s.x(selected)} y={s.y(f(selected)) - 12} color={blue}>f(x)</Tag>
            <Tag x={s.x(selected + dx / 2)} y={s.y(0) + 32} color={amber} anchor="end">Δx → dx</Tag>
          </>}
        </>}
        {ftc && rateVisible && <Tag x={s.x(edge) + (edge > 3.2 ? -12 : 12)} y={s.y(f(edge) / 2) - (f(edge) < 0.4 ? 12 : 0)} color={amber} anchor={edge > 3.2 ? "end" : "start"}>{formal ? "f(x) = " : ""}{fmt(f(edge))}</Tag>}
        {ftc && rateVisible && edge >= 1.2 && <Tag x={s.x(edge / 2)} y={s.y(0.7)} color={blue}>{formal ? "∫ = " : ""}{fmt(areaAt(edge))}</Tag>}
      </>}
      {ftc && <g transform="translate(0 195)" data-calculus="accumulated">
        <PlaneGrid s={lower} />
        <line x1={lower.x(edge)} x2={lower.x(edge)} y1={-195 + s.y(f(edge))} y2={lower.y(areaAt(edge))} stroke={slate} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
        {rateVisible && <g data-calculus="growth" opacity={anchor || guided ? 1 : clamp(reveal, 0, 1)}>
          <path d={trace(lower, 0, 4, areaAt)} fill="none" stroke={blue} strokeWidth={2.5} />
          <Arrow x1={lower.x(3.9)} y1={lower.y(areaAt(3.9))} x2={lower.x(4)} y2={lower.y(areaAt(4))} color={blue} width={2.5} head={8} />
          <circle cx={lower.x(edge)} cy={lower.y(areaAt(edge))} r={5} fill={blue} />
          <path d={tangent(edge, f(edge))} fill="none" stroke={emerald} strokeWidth={3} />
          {labels && <>
            <Tag x={lower.x(edge)} y={lower.y(areaAt(edge)) - 16} color={blue}>{formal ? "A(x) = " : ""}{fmt(areaAt(edge))}</Tag>
            <Tag x={lower.x(edge)} y={lower.y(areaAt(edge)) + 27} color={emerald}>{formal ? "A′(x) = " : ""}{fmt(f(edge))}</Tag>
          </>}
        </g>}
        {hidden && <circle cx={lower.x(edge)} cy={lower.y(0)} r={5} fill="none" stroke={amber} strokeWidth={2} />}
        {missed && "answer" in target && Number.isFinite(values.answer) && <g data-calculus="discrepancy">
          <path d={tangent(edge, clamp(values.answer!, -1, 12))} stroke={red} fill="none" strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
          <Tag x={lower.x(edge) + 22} y={lower.y(areaAt(edge)) + 5} color={red} anchor="start">{signed(verdict.delta)}</Tag>
        </g>}
        {labels && <PlaneTicks s={lower} yStep={4} avoid={[{ x: edge, y: areaAt(edge) }]} />}
      </g>}
      {ftc && rateVisible && (stage === 3 || stage === 4 || anchor) && <g data-calculus="nudges">
        <path d={patch(edge)} fill={bandFill("amber", 40)} stroke={amber} strokeWidth={1.5} />
        {missed && !("answer" in target) && <>
          <path d={patch(taskEdge)} fill={bandFill("red", 20)} stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
          <Tag x={s.x(taskEdge)} y={s.y(f(taskEdge)) - 12} color={red}>{signed(verdict.delta)}</Tag>
        </>}
      </g>}
      {!ftc && formal && <g transform="translate(0 240)" data-calculus="signed">
        <PlaneGrid s={signedPlane} />
        <path d={region(signedPlane, -1, 0, (x) => 2 * x)} fill={bandFill("blue", 20)} stroke={blue} strokeWidth={1.5} strokeDasharray="3 3" />
        <path d={region(signedPlane, 0, 1, (x) => 2 * x)} fill={bandFill("blue", 30)} stroke={blue} strokeWidth={1.5} />
        <path d={trace(signedPlane, -1, 1, (x) => 2 * x)} fill="none" stroke={slate} strokeWidth={2} />
        <Tag x={signedPlane.x(-0.7)} y={signedPlane.y(-0.5)} color={blue}>−1</Tag>
        <Tag x={signedPlane.x(0.7)} y={signedPlane.y(0.5)} color={blue}>+1</Tag>
        <Tag x={signedPlane.x(0)} y={signedPlane.y(2)} color={amber}>−1 + 1 = 0</Tag>
      </g>}
      {labels && <PlaneTicks s={s} yStep={2} avoid={[{ x: edge, y: 0 }, { x: edge, y: f(edge) }]} />}
      <Rails input={boardInput} values={values} bind={{ [name]: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(0) } }} />
      {board.can(name) && <PlaneHandle x={s.x(edge)} y={s.y(f(edge))} color={amber} cursor="ew-resize" onDrag={(p) => board.set(name, s.fromX(p.x))} />}
    </Svg>
    {practiceRate && !guided && <div className="mt-3 min-h-[136px]">
      {positioned && answerControl && <div data-calculus="rate-choice">
        <ChoiceGrid control={answerControl} value={values.answer} onChange={(v) => input?.onChange("answer", v)} disabled={input?.locked?.includes("answer")} />
      </div>}
    </div>}
  </>;
}

export const calculusArea: InteractiveDefinition = {
  Board,
  // Rate choices are rendered by the board after the position rail is locked.
  axes: { right_bound_b: "x", sweep_x: "x", answer: "y" },
  solve,
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target, spec);
    const initial: Values = { ...spec.stage2Exploration.fixed };
    for (const c of spec.stage2Exploration.controls) initial[c.variableName] = c.initial;
    if (stage === 3 && modeOf(spec) === 1 && !("slice_count_n" in target)) initial.slice_count_n = 200;
    return initial;
  },
  predictionControls(spec, target) {
    if (modeOf(spec) === 2) return [control(spec, "sweep_x"), ...("answer" in target ? [rateControl(target)] : [])];
    return [...("slice_count_n" in target ? [control(spec, "slice_count_n")] : []), control(spec, "right_bound_b")];
  },
  evaluate(values, target, tolerance, spec): Verdict {
    const eps = tolerance + 1e-9;
    if (modeOf(spec, target) === 2) {
      const x = target.sweep_x ?? 2;
      const deltaX = finite(values.sweep_x, -10) - x;
      if (Math.abs(deltaX) > eps) {
        if ("answer" in target) return { correct: false, delta: deltaX, kind: "position" };
        if (x === 2 && values.sweep_x === 4) return { correct: false, delta: deltaX, kind: "total" };
        if (x === 4 && values.sweep_x === 2) return { correct: false, delta: deltaX, kind: "curve_flat" };
        return { correct: false, delta: deltaX };
      }
      if (!("answer" in target)) return { correct: true, delta: 0 };
      if (!Number.isFinite(values.answer)) return { correct: false, delta: -edgeHeight(x), kind: "position" };
      const delta = values.answer! - edgeHeight(x);
      if (Math.abs(delta) <= eps) return { correct: true, delta: 0 };
      return { correct: false, delta, kind: Math.abs(values.answer! - areaAt(x)) < 1e-8 ? "total" : values.answer === x ? "position" : "curve_flat" };
    }
    const b = target.right_bound_b ?? 2;
    const a = target.left_bound_a ?? spec?.stage2Exploration.fixed.left_bound_a ?? 0;
    const delta = finite(values.right_bound_b, -10) - b;
    if (Math.abs(delta) > eps) return Math.abs(2 * finite(values.right_bound_b, -10) - (b * b - a * a)) <= eps
      ? { correct: false, delta, kind: "height" } : { correct: false, delta };
    if ("answer" in target && (!Number.isFinite(values.answer) || Math.abs(values.answer! - (b * b - a * a)) > eps)) return { correct: false, delta: finite(values.answer, 0) - (b * b - a * a), kind: "unsigned" };
    if ("slice_count_n" in target && values.slice_count_n !== target.slice_count_n) return { correct: false, delta: leftSum(a, b, clamp(finite(values.slice_count_n, 4), 4, 200)) - (b * b - a * a), kind: "coarse" };
    return { correct: true, delta: 0 };
  },
  formatDelta: (v) => signed(v.delta),
};
