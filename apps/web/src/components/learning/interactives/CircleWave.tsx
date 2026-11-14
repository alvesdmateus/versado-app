import { useEffect, useId, useMemo, useState } from "react";
import { bandColor, bandFill, clamp, fmt, SEAM, signed } from "../bands";
import { Arrow, Lattice, Svg, Tag, useSettle } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values, Verdict } from "./types";

const TAU = 2 * Math.PI;
const W = 400;
const H = 300;
const CX = 86;
const CY = 156;
const UNIT = 25;
const LEFT = 190;
const RIGHT = 388;
const TAG_K = 1.25;
const y = (height: number) => CY - UNIT * height;
const heightAt = (py: number) => (CY - py) / UNIT;

/** Frequency is angular speed (radians per time unit), so a cycle takes 2π/ω. */
export function waveHeight(amplitude: number, frequency: number, time: number, mode = 0, phase = 0) {
  const angle = frequency * time + phase;
  return amplitude * (mode === 1 ? Math.cos(angle) : Math.sin(angle));
}

/** First nonnegative crest, including a crest at the origin for the cosine comparison. */
export function firstCrest(frequency: number, mode = 0, phase = 0) {
  const angle = ((mode === 1 ? 0 : Math.PI / 2) - phase) % TAU;
  return ((angle + TAU) % TAU) / frequency;
}

function solve(target: Values): Values {
  if (!Number.isFinite(target.amplitude) || !Number.isFinite(target.frequency) || target.amplitude! <= 0 || target.frequency! <= 0) return {};
  return { amplitude: target.amplitude!, frequency: target.frequency! };
}

/** Only exploration/formalization run a clock; predictions and reduced-motion frames stay still. */
function useWheelTime(running: boolean, timeSpan: number) {
  const still = timeSpan / 5;
  const [time, setTime] = useState(still);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const start = () => {
      cancelAnimationFrame(frame);
      if (!running || media?.matches) {
        setTime(still);
        return;
      }
      const origin = performance.now();
      const tick = (now: number) => {
        setTime((now - origin) / 1000 + still);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    start();
    media?.addEventListener?.("change", start);
    return () => {
      cancelAnimationFrame(frame);
      media?.removeEventListener?.("change", start);
    };
  }, [running, timeSpan, still]);
  return running ? time : still;
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && !guided && verdict === null;
  const missed = stage === 3 && !guided && verdict !== null && !verdict.correct;
  const formal = stage === 4;
  const fixed = spec.stage2Exploration.fixed ?? {};
  const mode = fixed.mode ?? 0;
  const phase = fixed.phase ?? 0;
  const timeSpan = fixed.timeSpan && fixed.timeSpan > 0 ? fixed.timeSpan : TAU;
  const x = (time: number) => LEFT + (RIGHT - LEFT) * time / timeSpan;
  const solution = solve(target);
  const initial = Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
  const raw = anchoring ? { amplitude: 2, frequency: 1.25 } : formal ? solution : values;
  const amplitude = raw.amplitude ?? initial.amplitude ?? fixed.amplitude ?? 1;
  const frequency = raw.frequency ?? initial.frequency ?? fixed.frequency ?? 1;
  const [a = amplitude, f = frequency] = useSettle([amplitude, frequency], formal);
  const clock = useWheelTime(stage === 2 || formal, timeSpan);
  const elapsed = anchoring ? clamp(anchorT, 0, 1) * timeSpan : guided ? clamp(guide, 0, 1) * timeSpan : clock;
  // Advance the paper's time window instead of rewinding the wheel at the edge.
  // In particular, half-integer angular speeds must not jump by half a turn.
  const paperStart = !anchoring && !guided && (stage === 2 || formal) ? Math.floor(elapsed / timeSpan) * timeSpan : 0;
  const time = elapsed - paperStart;
  const paperPhase = phase + f * paperStart;
  const angle = f * elapsed + phase;
  const radius = a * UNIT;
  const bead = { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
  const pen = { x: x(time), y: y(waveHeight(a, f, time, mode, paperPhase)) };
  const showTags = !anchoring && (!guided || guide >= 1);
  const showGhost = stage >= 3 && !formal && solution.amplitude !== undefined;
  const boardInput = anchoring || guided ? undefined : input;
  const board = useBoardInput(boardInput, values);
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const red = bandColor("red");
  const clip = useId().replace(/:/g, "");
  const pulse = changed?.name === "amplitude" || changed?.name === "frequency" ? changed.tick : 0;
  const period = TAU / f;
  const crest = firstCrest(f, mode, paperPhase);
  const nextCrest = crest + period;
  const crestX = x(crest);
  const spacingY = 48;
  const path = (amp: number, freq: number, end = timeSpan) => Array.from({ length: 241 }, (_, i) => {
    const t = end * i / 240;
    return `${i === 0 ? "M" : "L"}${x(t)},${y(waveHeight(amp, freq, t, mode, paperPhase))}`;
  }).join(" ");
  // A clock frame only moves the bead and pen; full traces are sampled when parameters change.
  const trace = useMemo(() => path(a, f), [a, f, mode, paperPhase, timeSpan]); // eslint-disable-line react-hooks/exhaustive-deps
  const ghost = useMemo(() => showGhost ? path(solution.amplitude!, solution.frequency!) : "", [showGhost, solution.amplitude, solution.frequency, mode, phase, timeSpan]); // eslint-disable-line react-hooks/exhaustive-deps
  const gap = useMemo(() => {
    if (!missed) return "";
    const reverse = Array.from({ length: 241 }, (_, i) => {
      const t = timeSpan * (1 - i / 240);
      return `L${x(t)},${y(waveHeight(solution.amplitude!, solution.frequency!, t, mode, phase))}`;
    }).join(" ");
    return `${trace} ${reverse} Z`;
  }, [missed, trace, solution.amplitude, solution.frequency, mode, phase, timeSpan]); // eslint-disable-line react-hooks/exhaustive-deps
  const deltaA = amplitude - (solution.amplitude ?? amplitude);
  const ghostCrest = showGhost ? firstCrest(solution.frequency!, mode, phase) : crest;
  // In cosine mode the first crest stays at zero. Compare the first trough instead.
  const comparisonTime = mode === 1 ? crest + period / 2 : crest;
  const ghostTime = mode === 1 ? ghostCrest + TAU / solution.frequency! / 2 : ghostCrest;
  const deltaTime = comparisonTime - ghostTime;
  const shadow = mode === 1 ? { x: bead.x, y: CY } : { x: CX, y: bead.y };

  return (
    <Svg width={W} height={H} anchoring={anchoring} label={spec.targetSkill} gutter={{ left: RAIL_GUTTER }}>
      <defs><clipPath id={clip}><rect x={LEFT - 2} y={64} width={RIGHT - LEFT + 4} height={180} /></clipPath></defs>
      <Lattice cols={14} rows={10} unit={28} ox={2} oy={10} />
      <line x1={CX - 78} y1={CY} x2={RIGHT} y2={CY} stroke={SEAM} strokeWidth={1.5} />
      <line x1={LEFT} y1={72} x2={LEFT} y2={238} stroke={SEAM} strokeWidth={1.5} />
      <Arrow x1={RIGHT - 12} y1={CY} x2={RIGHT + 5} y2={CY} color={SEAM} width={1.5} head={7} />

      {showGhost && <path data-wave="ghost" d={ghost} fill="none" stroke={rose} strokeOpacity={0.65} strokeDasharray="3 3" strokeWidth={3} clipPath={`url(#${clip})`} />}
      {!hidden && <g clipPath={`url(#${clip})`}>
        {missed && <path data-wave="area-gap" d={gap} fill={bandFill("red", 14)} stroke="none" />}
        <path data-wave="trace" d={anchoring ? path(a, f, time) : trace} fill="none" stroke={rose} strokeWidth={3.5} strokeLinecap="round" />
        {/* A pen cursor and its already-drawn trail explain motion even in a static frame. */}
        {!anchoring && !guided && <path d={path(a, f, time)} fill="none" stroke={rose} strokeWidth={5} strokeOpacity={0.35} />}
      </g>}

      <g data-wave="wheel" key={`wheel-${pulse}`}>
        <circle className={anchoring || guided ? undefined : "gb-pulse"} cx={CX} cy={CY} r={radius} fill="none" stroke={blue} strokeOpacity={0.45} strokeWidth={2} style={{ ["--sw" as string]: "2px" }} />
        <circle cx={CX} cy={CY} r={3} fill={blue} />
        <line x1={CX} y1={CY} x2={hidden ? CX : bead.x} y2={hidden ? y(a) : bead.y} stroke={blue} strokeWidth={4} strokeLinecap="round" />
        {!hidden && <>
          <path d={`M${CX + radius * Math.cos(angle - 0.6)},${CY - radius * Math.sin(angle - 0.6)} A${radius},${radius} 0 0 0 ${bead.x},${bead.y}`} fill="none" stroke={amber} strokeWidth={4} />
          <Arrow x1={CX + radius * Math.cos(angle - 0.16)} y1={CY - radius * Math.sin(angle - 0.16)} x2={bead.x} y2={bead.y} color={amber} width={2} head={8} />
          <circle cx={bead.x} cy={bead.y} r={5} fill={rose} />
          <line x1={bead.x} y1={bead.y} x2={shadow.x} y2={shadow.y} stroke={rose} strokeWidth={2} strokeDasharray="3 3" />
          <circle cx={shadow.x} cy={shadow.y} r={4} fill={rose} />
          <path data-wave="shadow-link" d={mode === 1 ? `M${shadow.x},${shadow.y} H174 V${pen.y} H${pen.x}` : `M${shadow.x},${shadow.y} H${pen.x}`} fill="none" stroke={rose} strokeWidth={1.5} strokeDasharray="3 3" />
          <circle data-wave="pen" cx={pen.x} cy={pen.y} r={5} fill={rose} />
        </>}
        {anchoring && anchorT >= 0.8 && <>
          <line x1={CX} y1={CY} x2={CX + radius} y2={CY} stroke={blue} strokeOpacity={0.3} strokeDasharray="3 3" strokeWidth={3} />
          <circle cx={CX + radius} cy={CY} r={5} fill="none" stroke={rose} strokeOpacity={0.4} strokeWidth={2} />
        </>}
      </g>

      {!hidden && !anchoring && crest <= timeSpan && <g data-wave="spacing">
        <line x1={crestX} y1={y(a) - 5} x2={crestX} y2={spacingY} stroke={amber} strokeWidth={1.5} strokeDasharray="3 3" />
        <line x1={crestX} y1={spacingY} x2={Math.min(RIGHT, x(nextCrest))} y2={spacingY} stroke={amber} strokeWidth={2} />
        {nextCrest <= timeSpan ? <line x1={x(nextCrest)} y1={y(a) - 5} x2={x(nextCrest)} y2={spacingY} stroke={amber} strokeWidth={1.5} strokeDasharray="3 3" /> : <Arrow x1={RIGHT - 12} y1={spacingY} x2={RIGHT} y2={spacingY} color={amber} width={2} head={8} />}
        {showTags && <Tag k={TAG_K} x={(crestX + Math.min(RIGHT, x(nextCrest))) / 2} y={spacingY - 8} color={amber} size={12}>{formal ? `2π/ω = ${fmt(period)}` : fmt(period)}</Tag>}
      </g>}

      {missed && <g data-wave="diagnosis" stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march">
        {Math.abs(deltaA) > 1e-9 && <>
          <rect x={LEFT + 8} y={Math.min(y(amplitude), y(solution.amplitude!))} width={24} height={UNIT * Math.abs(deltaA)} fill={bandFill("red", 18)} />
          <Tag k={TAG_K} x={LEFT + 40} y={(y(amplitude) + y(solution.amplitude!)) / 2 + 4} color={red} anchor="start" size={12}>{`Δ ${signed(deltaA)}`}</Tag>
        </>}
        {Math.abs(deltaTime) > 1e-9 && <>
          <line x1={x(comparisonTime)} y1={mode === 1 ? y(-amplitude) : y(amplitude)} x2={x(comparisonTime)} y2={266} />
          <line x1={x(ghostTime)} y1={mode === 1 ? y(-solution.amplitude!) : y(solution.amplitude!)} x2={x(ghostTime)} y2={266} />
          <rect x={Math.min(x(comparisonTime), x(ghostTime))} y={256} width={Math.abs(x(comparisonTime) - x(ghostTime))} height={20} fill={bandFill("red", 18)} />
          <Tag k={TAG_K} x={clamp((x(comparisonTime) + x(ghostTime)) / 2, LEFT + 40, RIGHT - 40)} y={294} color={red} size={12}>{`Δt ${signed(deltaTime)}`}</Tag>
        </>}
      </g>}

      {showTags && <>
        <Tag k={TAG_K} x={CX} y={y(amplitude) - 13} color={blue}>{formal ? `A = ${fmt(amplitude)}` : fmt(amplitude)}</Tag>
        <Tag k={TAG_K} x={CX} y={CY + radius + 24} color={amber}>{formal ? `ω = ${fmt(frequency)}` : fmt(frequency)}</Tag>
        {!hidden && !missed && <Tag k={TAG_K} x={clamp(pen.x + 12, LEFT + 22, RIGHT - 30)} y={clamp(pen.y + (pen.y > CY ? 22 : -15), 78, 242)} color={rose} size={12}>{formal ? `${mode === 1 ? "cos" : "sin"}(ωt)` : fmt(waveHeight(amplitude, frequency, elapsed, mode, phase))}</Tag>}
        <Tag k={TAG_K} x={RIGHT} y={CY + 18} color={bandColor("slate")} size={11} anchor="end">{paperStart === 0 ? formal ? "t = 2π" : "2π" : `${formal ? "t = " : ""}${fmt(paperStart + timeSpan)}`}</Tag>
      </>}
      {!anchoring && !guided && <Rails input={boardInput} values={values} bind={{ amplitude: { axis: "y", at: y, cross: -RAIL_CROSS, reach: CX } }} />}
      {board.can("amplitude") && <>
        <PlaneHandle x={CX} y={y(amplitude)} color={blue} cursor="ns-resize" onDrag={(pt) => board.set("amplitude", heightAt(pt.y))} />
        {!hidden && crest <= timeSpan && <PlaneHandle x={x(crest)} y={y(amplitude)} color={blue} cursor="ns-resize" onDrag={(pt) => board.set("amplitude", heightAt(pt.y))} />}
      </>}
    </Svg>
  );
}

export const circleWave: InteractiveDefinition = {
  Board,
  axes: { amplitude: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    return Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
  },
  predictionControls(spec) {
    return spec.stage2Exploration.controls.filter((c) => c.variableName === "amplitude" || c.variableName === "frequency").map((c) => ({
      variableName: c.variableName, label: c.label, min: c.min, max: c.max, step: c.step, colorToken: c.colorToken,
    }));
  },
  solve,
  evaluate(values, target, tolerance): Verdict {
    const goal = solve(target);
    if (goal.amplitude === undefined || !Number.isFinite(values.amplitude) || !Number.isFinite(values.frequency) || values.amplitude! <= 0 || values.frequency! <= 0) return { correct: false, delta: Infinity };
    const da = values.amplitude! - goal.amplitude;
    const df = values.frequency! - goal.frequency!;
    const aWrong = Math.abs(da) > Math.max(0, tolerance);
    const fWrong = Math.abs(df) > Math.max(0, tolerance);
    const delta = aWrong ? da : df;
    if (!aWrong && !fWrong) return { correct: true, delta };
    const kind = aWrong && fWrong
      ? values.amplitude === goal.frequency && values.frequency === goal.amplitude ? "swapped" : undefined
      : aWrong ? "amplitude" : "frequency";
    return kind ? { correct: false, delta, kind } : { correct: false, delta };
  },
  formatDelta(verdict) { return signed(verdict.delta); },
};
