import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, GROUND, SEAM, signed } from "../bands";
import { ControlStack } from "../controls";
import { Arrow, DirectionArrow, lerp, lineEnds, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardInput, BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

/** Linked curve/slope panels: a shrinking bridge, a local lens, and a surfer. */
const W = 340;
const H = 480;
const LOWER = 252;
const PANEL_H = 218;
const MIN_GAP = 0.01;
const EPS = 1e-9;
const blue = bandColor("blue");
const amber = bandColor("amber");
const rose = bandColor("rose");
const emerald = bandColor("emerald");
const slate = bandColor("slate");
const red = bandColor("red");

export function slopeMode(spec?: ModuleSpec): number {
  return spec?.stage2Exploration.fixed?.mode ?? 1;
}

/** Only review changes the curve/anchor; practice setup keys never change the case. */
export function slopeCase(target: Values, spec?: ModuleSpec) {
  const mode = slopeMode(spec);
  return {
    mode,
    anchor: mode === 1 && target.answer === -2 ? -1 : spec?.stage2Exploration.fixed?.anchor_x ?? 1,
    straight: mode === 2 && (target.answer ?? 1) >= 5,
  };
}

/** Expanded difference quotient avoids cancellation and never substitutes h=0. */
export function bridgeSlope(anchor: number, gap: number) {
  return 2 * anchor + clamp(gap, MIN_GAP, 3);
}

export function slopeGraph(answer: number, x: number): number {
  switch (answer) {
    case 1: return 2 * x;
    case 2: return x * x;
    case 3: return 2 * Math.abs(x);
    case 4: return -2 * x;
    case 5: return 3;
    case 6: return 3 * x + 1;
    case 7: return 1;
    default: return 0;
  }
}

function solve(target: Values, spec?: ModuleSpec): Values {
  const { mode, anchor, straight } = slopeCase(target, spec);
  if (mode === 3) return { surfer_x: target.surfer_x ?? -1, ...(target.answer !== undefined ? { answer: target.answer } : {}) };
  return {
    answer: mode === 1 ? 2 * anchor : straight ? 5 : 1,
    ...(target.step_gap_h !== undefined ? { step_gap_h: target.step_gap_h } : {}),
    ...(target.zoom_magnification !== undefined ? { zoom_magnification: target.zoom_magnification } : {}),
  };
}

function control(spec: ModuleSpec, name: string): ControlDef {
  const c = spec.stage2Exploration.controls.find((c) => c.variableName === name)!;
  return { variableName: name, label: c.label, min: c.min, max: c.max, step: c.step, colorToken: c.colorToken };
}

const graphLabels: Readonly<Record<number, string>> = {
  1: "lesson.choice.calculus-slope.rising",
  2: "lesson.choice.calculus-slope.bowl",
  3: "lesson.choice.calculus-slope.vShape",
  4: "lesson.choice.calculus-slope.falling",
  5: "lesson.choice.calculus-slope.constantThree",
  6: "lesson.choice.calculus-slope.originalLine",
  7: "lesson.choice.calculus-slope.constantOne",
  8: "lesson.choice.calculus-slope.constantZero",
};

function predictionControls(spec: ModuleSpec, target: Values): ControlDef[] {
  const { mode, anchor, straight } = slopeCase(target, spec);
  if (mode === 3 && target.answer === undefined) return [control(spec, "surfer_x")];
  const choices = mode === 1 ? (anchor < 0 ? [-2, 1, 0, 2] : [2, 5, 0, -2]) : mode === 2 ? (straight ? [5, 6, 7, 8] : [1, 2, 3, 4]) : [-1, 1, 0];
  const setup = mode === 1 ? "step_gap_h" : mode === 2 ? "zoom_magnification" : "surfer_x";
  return [
    ...(target[setup] !== undefined ? [control(spec, setup)] : []),
    {
      variableName: "answer", label: mode === 2 ? "f′(x)" : "f′", min: Math.min(...choices), max: Math.max(...choices), step: 1,
      colorToken: "emerald", choices,
      ...(mode === 2 ? { choiceLabels: graphLabels } : mode === 3 ? { choiceLabels: {
        [-1]: "lesson.choice.calculus-slope.downhill", [1]: "lesson.choice.calculus-slope.uphill", [0]: "lesson.choice.calculus-slope.level",
      } } : {}),
    },
  ];
}

/** Sample in data coordinates; SVG clipping handles both curve and diagnostic overshoots. */
function curve(s: PlaneScale, f: (x: number) => number, from = s.xMin, to = s.xMax, n = 100) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = lerp(from, to, i / n);
    return `${i ? "L" : "M"}${s.x(x)},${s.y(f(x))}`;
  }).join(" ");
}

/** Practice is sequential. A setup becomes locked before the answer can be picked. */
export function practiceInput(input: BoardInput | undefined, values: Values, target: Values, spec: ModuleSpec): BoardInput | undefined {
  if (!input || target.answer === undefined) return input;
  const key = slopeMode(spec) === 1 ? "step_gap_h" : slopeMode(spec) === 2 ? "zoom_magnification" : "surfer_x";
  if (target[key] === undefined) return input;
  const ready = Math.abs((values[key] ?? Infinity) - target[key]!) < EPS;
  return {
    ...input,
    controls: ready ? input.controls : input.controls.filter((c) => c.variableName !== "answer"),
    locked: ready ? [...new Set([...(input.locked ?? []), key])] : input.locked,
  };
}

function Board({ spec, stage, values, target, verdict, anchorT, guide, input, changed }: BoardProps) {
  const { mode, anchor, straight } = slopeCase(target, spec);
  const anchoring = stage === 1;
  const guided = guide !== undefined && guide !== null;
  const hidden = stage === 3 && verdict === null && !guided;
  const wrong = stage === 3 && verdict !== null && !verdict.correct;
  const tags = !anchoring && (!guided || guide >= 1);
  const formal = stage === 4;
  const id = useId().replace(/:/g, "");
  const topClip = `${id}-top`;
  const lowClip = `${id}-low`;
  const lensClip = `${id}-lens`;
  const top = usePlane({ width: W, height: PANEL_H, pad: 24, xMin: mode === 1 ? -2 : -2.2, xMax: mode === 1 ? 4 : 2.2, yMin: mode === 1 ? -1 : straight ? -6 : mode === 3 ? -3 : -1, yMax: mode === 1 ? 17 : straight ? 8 : mode === 3 ? 3 : 5 });
  const low = usePlane({ width: W, height: PANEL_H - 24, pad: 24, xMin: top.xMin, xMax: top.xMax, yMin: -4, yMax: mode === 3 ? 10 : 6 });
  const f = (x: number) => mode === 3 ? x ** 3 - 3 * x : straight ? 3 * x + 1 : x * x;
  const df = (x: number) => mode === 3 ? 3 * x * x - 3 : straight ? 3 : 2 * x;
  const exactGap = anchoring ? lerp(3, MIN_GAP, span(anchorT, 0.2, 0.92)) : guided ? lerp(3, target.step_gap_h ?? MIN_GAP, guide) : values.step_gap_h ?? target.step_gap_h ?? 3;
  const requestedGap = clamp(exactGap, MIN_GAP, 3);
  const [shrinkingGap = requestedGap] = useSettle([stage === 3 && !hidden ? MIN_GAP : requestedGap], stage === 3 && !guided && mode === 1);
  const gap = mode === 1 && stage === 3 && verdict !== null && !guided ? clamp(shrinkingGap, MIN_GAP, 3) : requestedGap;
  const probe = anchoring ? lerp(-1.8, 1.8, span(anchorT, 0.3, 0.95)) : guided ? lerp(-1.8, 1.8, guide) : mode === 3 ? values.surfer_x ?? -1.5 : values.probe_x ?? 1;
  const zoom = anchoring ? lerp(1, 50, span(anchorT, 0.05, 0.6)) : guided ? lerp(1, 50, span(guide, 0, 0.4)) : values.zoom_magnification ?? 1;
  const finiteSlope = bridgeSlope(anchor, gap);
  const [settledSlope = finiteSlope, reveal = 1] = useSettle([hidden ? finiteSlope : 2 * anchor, hidden ? 0 : 1], stage === 3 && !guided);
  const activeInput = stage === 3 ? practiceInput(input, values, target, spec) : input;
  // Coordinate notation fits at the rail's low end; the full lesson name remains its group label.
  const railInput = activeInput && { ...activeInput, controls: activeInput.controls.map((c) => c.variableName === "probe_x" || c.variableName === "surfer_x" ? { ...c, label: "x" } : c) };
  const board = useBoardInput(activeInput, values);
  const free = activeInput?.controls.filter((c) => c.variableName !== "probe_x" && c.variableName !== "surfer_x") ?? [];
  const candidate = mode === 2 ? values.answer : undefined;
  const solution = solve(target, spec);
  const showTop = mode !== 3 || !hidden;
  const topPoint = mode === 1 ? anchor : probe;
  const limiting = lineEnds(top, settledSlope, anchor * anchor - settledSlope * anchor);
  const bridge = lineEnds(top, finiteSlope, anchor * anchor - finiteSlope * anchor);
  const pulse = changed?.tick ?? 0;
  const label = anchoring ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : formal ? spec.stage4Formalization.caption : spec.stage3Prediction.challengePrompt;

  return <>
    <Svg width={W} height={H} anchoring={anchoring} gutter={{ bottom: RAIL_GUTTER }} label={label}>
      <defs>
        <clipPath id={topClip}><rect x={24} y={24} width={W - 48} height={PANEL_H - 48} /></clipPath>
        <clipPath id={lowClip}><rect x={24} y={24} width={W - 48} height={PANEL_H - 72} /></clipPath>
        <clipPath id={lensClip}><circle cx={268} cy={78} r={49} /></clipPath>
      </defs>
      <PlaneGrid s={top} />
      <g clipPath={`url(#${topClip})`}>
        {showTop && <path data-slope="curve" d={curve(top, f)} fill="none" stroke={blue} strokeWidth={4} strokeLinecap="round" />}
        {mode === 2 && straight && <DirectionArrow s={top} m={3} c={1} color={blue} />}
        {mode === 1 && <>
          {anchoring && anchorT >= 0.5 && <line data-slope="bridge-ghost" {...lineEnds(top, 5, -4)!} stroke={slate} strokeWidth={2} strokeDasharray="3 3" opacity={0.3} />}
          {bridge && <line data-slope="bridge" {...bridge} stroke={slate} strokeWidth={3} />}
          <DirectionArrow s={top} m={finiteSlope} c={anchor * anchor - finiteSlope * anchor} color={slate} />
          <line x1={top.x(anchor)} x2={top.x(anchor + gap)} y1={top.y(anchor * anchor)} y2={top.y(anchor * anchor)} stroke={amber} strokeWidth={4} />
          <line x1={top.x(anchor + gap)} x2={top.x(anchor + gap)} y1={top.y(anchor * anchor)} y2={top.y((anchor + gap) ** 2)} stroke={rose} strokeWidth={4} />
          <circle cx={top.x(anchor)} cy={top.y(anchor * anchor)} r={6} fill={blue} />
          <circle key={`gap-${pulse}`} className="gb-pulse" cx={top.x(anchor + gap)} cy={top.y((anchor + gap) ** 2)} r={6} fill={amber} />
          {!hidden && <g data-slope="limit">
            {limiting && <line {...limiting} stroke={emerald} strokeWidth={4} />}
            <DirectionArrow s={top} m={settledSlope} c={anchor * anchor - settledSlope * anchor} color={emerald} />
          </g>}
        </>}
        {mode !== 1 && showTop && <>
          <line x1={top.x(probe)} x2={top.x(probe)} y1={24} y2={PANEL_H - 24} stroke={mode === 3 ? amber : blue} strokeDasharray="3 3" opacity={0.5} />
          {mode === 3 && <>
            {anchoring && anchorT >= 0.5 && <line data-slope="surfer-ghost" x1={top.x(-1) - 18} x2={top.x(-1) + 18} y1={top.y(2)} y2={top.y(2)} stroke={amber} strokeWidth={7} opacity={0.3} />}
            <line data-slope="surfer" x1={top.x(probe - 0.24)} y1={top.y(f(probe) - 0.24 * df(probe))} x2={top.x(probe + 0.24)} y2={top.y(f(probe) + 0.24 * df(probe))} stroke={amber} strokeWidth={7} strokeLinecap="round" />
            {Math.abs(df(probe)) < EPS && <circle data-slope="level" cx={top.x(probe)} cy={top.y(f(probe))} r={13} fill={bandFill("emerald", 22)} stroke={emerald} strokeWidth={2} />}
          </>}
          <circle key={`probe-${pulse}`} className="gb-pulse" cx={top.x(probe)} cy={top.y(f(probe))} r={6} fill={mode === 3 ? amber : blue} />
        </>}
        {wrong && mode === 1 && values.answer !== undefined && <g data-slope="miss">
          <line {...lineEnds(top, values.answer, anchor * anchor - values.answer * anchor)!} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          <DirectionArrow s={top} m={values.answer} c={anchor * anchor - values.answer * anchor} color={red} />
          <path d={`M ${top.x(anchor + 0.8)} ${top.y(anchor * anchor + 0.8 * values.answer)} L ${top.x(anchor + 0.8)} ${top.y(anchor * anchor + 0.8 * 2 * anchor)}`} fill="none" stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
        </g>}
      </g>
      {tags && mode === 1 && <>
        <Tag x={top.x(anchor + gap / 2)} y={top.y(anchor * anchor) + 19} color={amber}>{formal ? "h" : fmt(gap)}</Tag>
        <Tag x={Math.min(W - 12, top.x(anchor + gap) + 8)} y={top.y((anchor * anchor + (anchor + gap) ** 2) / 2) - 8} anchor={gap > 2 ? "end" : "start"} color={rose} size={12}>{formal ? "f(x+h) − f(x)" : fmt(gap * finiteSlope)}</Tag>
        <Tag x={top.x(anchor - 0.65)} y={top.y(anchor * anchor - 0.65 * finiteSlope) - 12} color={slate}>{fmt(finiteSlope)}</Tag>
        {!hidden && <Tag x={top.x(anchor + 1)} y={top.y(anchor * anchor + 2 * anchor) - 12} color={emerald}>{formal ? "f′(x)" : fmt(2 * anchor)}</Tag>}
        {wrong && <Tag x={top.x(anchor + 0.8) + 10} y={top.y(anchor * anchor + 0.8 * 2 * anchor) + 18} color={red} anchor="start">{`Δ ${signed(verdict.delta)}`}</Tag>}
      </>}
      {mode === 2 && <g data-slope="lens">
        <line x1={top.x(probe)} y1={top.y(f(probe))} x2={220} y2={110} stroke={slate} strokeWidth={1.5} strokeDasharray="3 3" />
        <circle cx={268} cy={78} r={51} fill={GROUND} stroke={slate} strokeWidth={2} />
        <g clipPath={`url(#${lensClip})`}>
          <path data-slope="lens-curve" d={Array.from({ length: 81 }, (_, i) => {
            const dx = (i - 40) * 1.3 / (30 * zoom);
            return `${i ? "L" : "M"}${268 + dx * 30 * zoom},${78 - (f(probe + dx) - f(probe)) * 30 * zoom}`;
          }).join(" ")} fill="none" stroke={blue} strokeWidth={3} />
          <circle cx={268} cy={78} r={4} fill={blue} />
          {anchoring && anchorT > 0.6 && <path d="M 225 100 Q 268 24 311 100" fill="none" stroke={blue} opacity={0.25} strokeDasharray="3 3" strokeWidth={2} />}
        </g>
        {tags && <Tag x={268} y={141} color={slate}>{`×${fmt(zoom)}`}</Tag>}
      </g>}
      {tags && mode !== 1 && showTop && !(formal && mode === 3) && <Tag x={top.x(probe) - 10} y={top.y(f(probe)) - 15} anchor="end" color={mode === 3 ? amber : blue}>
        {formal ? mode === 2 ? straight ? "3x+1" : "x²" : "x" : fmt(probe)}
      </Tag>}
      {tags && mode === 3 && showTop && <Tag x={top.x(probe)} y={top.y(f(probe)) + 23} color={Math.abs(df(probe)) < EPS ? emerald : amber}>{formal && Math.abs(df(probe)) < EPS ? "f′(x) = 0" : df(probe) > EPS ? "+" : df(probe) < -EPS ? "−" : "0"}</Tag>}
      {mode === 3 && hidden && <g data-slope="hidden-pin">
        <line x1={top.x(probe)} x2={top.x(probe)} y1={25} y2={PANEL_H - 24} stroke={amber} strokeDasharray="3 3" />
        <circle cx={top.x(probe)} cy={top.y(0)} r={7} fill={amber} />
        <Tag x={top.x(probe)} y={top.y(0) - 15} color={amber}>{fmt(probe)}</Tag>
      </g>}
      {!anchoring && <PlaneTicks s={top} yStep={mode === 1 ? 4 : 2} avoid={[{ x: topPoint, y: f(topPoint) }]} />}

      <g transform={`translate(0 ${LOWER})`}>
        <PlaneGrid s={low} />
        <g clipPath={`url(#${lowClip})`}>
          {/* A completed derivative is withheld only for the graph-shape prediction. */}
          {(mode === 3 || !hidden) && <path data-slope="trace" d={curve(low, df, low.xMin, mode === 2 && guided ? lerp(low.xMin, low.xMax, guide) : mode === 2 && stage === 3 ? lerp(low.xMin, low.xMax, clamp(reveal, 0, 1)) : low.xMax)} fill="none" stroke={emerald} strokeWidth={4} strokeLinecap="round" />}
          {mode !== 3 && !hidden && !(guided && guide < 1) && <DirectionArrow s={low} m={straight ? 0 : 2} c={straight ? 3 : 0} color={emerald} />}
          {mode === 2 && hidden && candidate !== undefined && <path data-slope="candidate" d={curve(low, (x) => slopeGraph(candidate, x))} fill="none" stroke={slate} strokeWidth={3} strokeDasharray="3 3" />}
          {mode === 3 || !hidden ? <>
            <line x1={low.x(topPoint)} x2={low.x(topPoint)} y1={24} y2={PANEL_H - 48} stroke={mode === 3 ? amber : blue} strokeDasharray="3 3" opacity={0.45} />
            <circle data-slope="slope-dot" cx={low.x(topPoint)} cy={low.y(df(topPoint))} r={6} fill={emerald} />
          </> : null}
          {wrong && mode === 2 && candidate !== undefined && <g data-slope="miss">
            <path d={curve(low, (x) => slopeGraph(candidate, x))} fill="none" stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
            <line x1={low.x(-1)} x2={low.x(-1)} y1={low.y(slopeGraph(candidate, -1))} y2={low.y(df(-1))} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          </g>}
          {wrong && mode === 3 && <g data-slope="miss">
            <line x1={low.x(probe)} x2={low.x(solution.surfer_x!)} y1={low.y(0)} y2={low.y(0)} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
            <circle cx={low.x(solution.surfer_x!)} cy={low.y(0)} r={11} fill="none" stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          </g>}
        </g>
        {tags && (mode === 3 || !hidden) && <Tag x={low.x(topPoint) + 10} y={low.y(df(topPoint)) - 12} anchor="start" color={emerald}>{formal ? mode === 2 ? straight ? "3" : "2x" : "f′(x)" : fmt(df(topPoint))}</Tag>}
        {tags && wrong && mode === 2 && candidate !== undefined && <Tag x={low.x(-1) + 10} y={low.y((slopeGraph(candidate, -1) + df(-1)) / 2)} anchor="start" color={red}>{`Δ ${signed(slopeGraph(candidate, -1) - df(-1))}`}</Tag>}
        {tags && wrong && mode === 3 && <Tag x={low.x((probe + solution.surfer_x!) / 2)} y={low.y(0) + 22} color={red}>{`Δx ${signed(probe - solution.surfer_x!)}`}</Tag>}
        {!anchoring && <PlaneTicks s={low} yStep={2} avoid={[{ x: topPoint, y: df(topPoint) }]} />}
        {mode === 2 && hidden && candidate === undefined && <g data-slope="candidates">
          {(straight ? [5, 6, 7, 8] : [1, 2, 3, 4]).map((answer, i) => <g key={answer} transform={`translate(${28 + (i % 2) * 151} ${12 + Math.floor(i / 2) * 78})`}>
            <rect width={132} height={70} rx={5} fill={GROUND} stroke={SEAM} />
            <line x1={12} x2={120} y1={48} y2={48} stroke={SEAM} />
            <line x1={66} x2={66} y1={8} y2={62} stroke={SEAM} />
            <path d={Array.from({ length: 33 }, (_, j) => { const x = (j - 16) / 10; return `${j ? "L" : "M"}${66 + x * 30},${48 - slopeGraph(answer, x) * 7}`; }).join(" ")} fill="none" stroke={slate} strokeWidth={3} />
            <Tag x={15} y={20} color={slate} size={12}>{answer}</Tag>
          </g>)}
        </g>}
      </g>
      {mode !== 1 && showTop && <line x1={top.x(probe)} x2={top.x(probe)} y1={PANEL_H - 24} y2={LOWER + 24} stroke={mode === 3 ? amber : blue} strokeDasharray="3 3" opacity={0.4} />}

      {/* A static shelf comparison makes zero-without-a-turn visible without another variable. */}
      {(formal || wrong && verdict.kind === "shelf") && mode === 3 && <g data-slope="shelf" transform="translate(184 444)">
        <path d={Array.from({ length: 41 }, (_, i) => { const x = (i - 20) / 20; return `${i ? "L" : "M"}${60 + 50 * x},${19 - 13 * x ** 3}`; }).join(" ")} fill="none" stroke={blue} strokeWidth={2} />
        <path d="M 10 24 Q 60 46 110 24" fill="none" stroke={emerald} strokeWidth={2} />
        <line x1={48} x2={72} y1={19} y2={19} stroke={amber} strokeWidth={5} />
        <Tag x={60} y={12} color={emerald} size={11}>0</Tag>
        <Tag x={112} y={44} color={blue} size={11}>x³</Tag>
        <Tag x={8} y={44} color={emerald} size={11}>+ 0 +</Tag>
      </g>}
      {formal && mode === 3 && <g data-slope="turn-signs">
        <circle cx={top.x(-1)} cy={top.y(2)} r={5} fill={amber} />
        <circle cx={top.x(1)} cy={top.y(-2)} r={5} fill={amber} />
        <Tag x={top.x(-1) + 8} y={top.y(2) - 12} color={amber} size={12} anchor="start">{spec.stage4Formalization.colorMapping[1]?.symbol}</Tag>
        <Tag x={top.x(-1) - 8} y={top.y(2) - 12} color={amber} size={11} anchor="end">+ 0 −</Tag>
        <Tag x={top.x(1)} y={top.y(-2) - 12} color={amber} size={12}>{spec.stage4Formalization.colorMapping[2]?.symbol}</Tag>
        <Tag x={top.x(1)} y={top.y(-2) + 22} color={amber} size={11}>− 0 +</Tag>
      </g>}
      <g role="group" aria-label={mode === 3 ? spec.stage2Exploration.controls.find((c) => c.variableName === "surfer_x")?.label : spec.stage2Exploration.controls.find((c) => c.variableName === "probe_x")?.label}>
      <Rails input={railInput} values={values} bind={{
        probe_x: { axis: "x", at: top.x, cross: H + RAIL_CROSS, reach: top.y(f(probe)) },
        surfer_x: { axis: "x", at: top.x, cross: H + RAIL_CROSS, reach: hidden ? top.y(0) : top.y(f(probe)) },
      }} />
      </g>
      {(board.can("probe_x") || board.can("surfer_x")) && <PlaneHandle x={top.x(probe)} y={hidden && mode === 3 ? top.y(0) : top.y(f(probe))} color={mode === 3 ? amber : blue} cursor="ew-resize" onDrag={(pt) => board.set(mode === 3 ? "surfer_x" : "probe_x", top.fromX(pt.x))} />}
      {stage === 3 && !hidden && mode === 3 && target.answer !== undefined && <Arrow x1={top.x(probe)} y1={top.y(f(probe))} x2={top.x(probe + 0.45)} y2={top.y(f(probe + 0.45))} color={wrong ? red : emerald} width={3} className={wrong ? "gb-march" : undefined} dashed={wrong} />}
    </Svg>
    {free.length > 0 && <div className="mt-4" data-slope-controls="sequential"><ControlStack controls={free} values={values} onChange={activeInput!.onChange} locked={activeInput?.locked} /></div>}
  </>;
}

export const calculusSlope: InteractiveDefinition = {
  Board,
  // The host uses axes to assign control ownership. Local sliders/choices stay with this board
  // so it can fade practice sequentially; only probe/surfer are rendered as positional rails.
  axes: { probe_x: "x", surfer_x: "x", step_gap_h: "x", zoom_magnification: "y", answer: "y" },
  initialValues(spec, stage, target) {
    const initial = Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
    if (stage === 4) return { ...initial, ...solve(target, spec) };
    if (stage === 3) {
      if (slopeMode(spec) === 3) return { surfer_x: initial.surfer_x ?? -1.5 };
      if (slopeMode(spec) === 2) return { probe_x: initial.probe_x ?? 1, zoom_magnification: initial.zoom_magnification ?? 1 };
      return { step_gap_h: initial.step_gap_h ?? 3 };
    }
    return initial;
  },
  predictionControls,
  solve,
  evaluate(values, target, tolerance, spec) {
    const mode = slopeMode(spec);
    const goal = solve(target, spec);
    const keys = Object.keys(goal);
    if (keys.some((k) => !Number.isFinite(values[k]))) return { correct: false, delta: 0 };
    const failed = keys.find((k) => Math.abs(values[k]! - goal[k]!) > (k === "answer" ? EPS : Math.max(0, tolerance) + EPS));
    if (!failed) return { correct: true, delta: 0 };
    const delta = values[failed]! - goal[failed]!;
    let kind: Verdict["kind"];
    if (mode === 1 && failed === "answer") kind = values.answer === 0 ? "zero" : values.answer === bridgeSlope(slopeCase(target, spec).anchor, 3) ? "secant" : values.answer! * goal.answer! < 0 ? "sign" : "secant";
    if (mode === 2 && failed === "answer") kind = ({ 2: "height", 3: "sign", 4: "reversed", 6: "height", 7: "intercept", 8: "flat" } as const)[values.answer as 2 | 3 | 4 | 6 | 7 | 8];
    if (mode === 3) {
      if (failed === "answer") kind = values.answer === 0 ? "shelf" : "swapped";
      else if (Math.abs(values.surfer_x! + goal.surfer_x!) <= Math.max(tolerance, 0.05) + EPS) kind = "swapped";
      else kind = "height";
    }
    return { correct: false, delta, ...(kind ? { kind } : {}) };
  },
  formatDelta: (v) => `Δ ${signed(v.delta)}`,
};
