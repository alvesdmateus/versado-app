import { bandColor, clamp, fmt, PANEL, SEAM, signed } from "../bands";
import { Arrow, Lattice, lerp, span, Svg, Tag, useSettle } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

const W = 360;
const H = 306;
const PAD = 28;
const RULER_Y = 180;
const DECADES = [1, 10, 100, 1000];
const TICKS = [1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000];
const x = (coordinate: number) => PAD + coordinate / 3 * (W - 2 * PAD);
const fromX = (pixel: number) => (pixel - PAD) / (W - 2 * PAD) * 3;

/** Interpolate the same endpoints between a linear and a base-ten logarithmic ruler. */
export function rulerCoordinate(value: number, warp: number): number {
  return lerp(3 * (value - 1) / 999, Math.log10(value), clamp(warp, 0, 1));
}

function solve(target: Values): Values {
  return { ruler_warp_factor: 1, marker_log: target.marker_log ?? Math.log10(500) };
}

/** Rounded content targets (2.699, 1.301) still name 500 and 20, respectively. */
function valueText(coordinate: number): string {
  const value = 10 ** coordinate;
  return fmt(Math.abs(value - Math.round(value)) < value * 0.00012 ? Math.round(value) : value);
}

const markerControl: ControlDef = {
  variableName: "marker_log", label: "Marker", min: 0, max: 3, step: 0.001, colorToken: "slate",
};

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const anchoring = stage === 1;
  const formal = stage === 4;
  const guided = guide != null;
  const labels = !anchoring && (!guided || guide >= 1);
  const hidden = stage === 3 && verdict === null && !guided;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const goal = solve(target).marker_log!;
  const practice = "ruler_warp_factor" in target;
  const warp = anchoring ? span(anchorT, 0.15, 0.9)
    : guided ? span(guide, 0, 0.45)
    : formal || (stage === 3 && !practice) ? 1 : clamp(values.ruler_warp_factor ?? 0, 0, 1);
  const marker = formal ? goal : guided ? lerp(0, goal, span(guide, 0.45, 1)) : clamp(values.marker_log ?? 0, 0, 3);
  const ready = warp >= 1 - 1e-9;
  const reveal = !hidden && stage >= 3;
  const [revealedGoal = goal] = useSettle([reveal ? goal : marker], stage === 3 && verdict !== null && !guided);
  const slate = bandColor("slate");
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const emerald = bandColor("emerald");
  const red = bandColor("red");
  // Placement always happens on the fully logarithmic ruler. Practice first asks for the warp.
  const placementInput = anchoring ? undefined : input && {
    ...input,
    locked: ready ? input.locked : [...(input.locked ?? []), "marker_log"],
  };
  const board = useBoardInput(placementInput, values);
  const pulse = changed?.name === "ruler_warp_factor" ? changed.tick : 0;
  const practicePrompt = practice ? spec.practice?.items.find((item) => item.target.marker_log === target.marker_log)?.prompt : undefined;
  const predictionPrompt = practicePrompt ?? (target.marker_log === spec.retentionHooks.reviewTarget?.marker_log ? spec.retentionHooks.spacedReviewPrompt : spec.stage3Prediction.challengePrompt);
  const label = anchoring ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : predictionPrompt;
  const low = Number.isInteger(goal) ? Math.max(0, goal - 1) : Math.floor(goal);
  const high = Number.isInteger(goal) ? Math.min(3, goal + 1) : Math.ceil(goal);

  // A sideways exponential trace becomes a straight sequence of equal tenfold steps.
  const trace = Array.from({ length: 49 }, (_, i) => {
    const step = i / 16;
    return { x: x(rulerCoordinate(10 ** step, warp)), y: 108 - step * 26 };
  });

  return (
    <Svg width={W} height={H} label={label} anchoring={anchoring} gutter={{ left: 24, bottom: RAIL_GUTTER }}>
      <Lattice cols={11} rows={10} unit={28} ox={26} oy={12} />

      {stage <= 2 && (
        <g data-log-ruler="trace">
          {anchoring && (
            <polyline data-log-ruler="before" points={trace.map((_, i) => `${x(rulerCoordinate(10 ** (i / 16), 0))},${108 - i / 16 * 26}`).join(" ")}
              fill="none" stroke={slate} strokeWidth={2} strokeDasharray="4 5" opacity={0.3} />
          )}
          <polyline points={trace.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={slate} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          <Arrow x1={trace[46]!.x} y1={trace[46]!.y} x2={trace[48]!.x} y2={trace[48]!.y} color={slate} width={3} head={8} />
          {DECADES.map((value, i) => (
            <circle key={value} cx={x(rulerCoordinate(value, warp))} cy={108 - i * 26} r={4} fill={slate} />
          ))}
          {DECADES.slice(0, -1).map((value, i) => {
            const a = x(rulerCoordinate(value, warp));
            const b = x(rulerCoordinate(value * 10, warp));
            const y = 138 + (1 - warp) * i * 10;
            return <g key={value}>
              <path d={`M ${a} ${y - 4} V ${y} H ${b} V ${y - 4}`} fill="none" stroke={slate} strokeWidth={2} />
              {labels && b - a > 37 && <Tag x={(a + b) / 2} y={y - 8} color={slate} size={12}>×10</Tag>}
            </g>;
          })}
        </g>
      )}

      {/* Late formalization: factor lengths join, and their sum is the full distance. */}
      {reveal && ready && (
        <g data-log-ruler="segments">
          <line x1={x(0)} x2={x(Math.min(1, revealedGoal))} y1={70} y2={70} stroke={blue} strokeWidth={6} strokeLinecap="round" />
          <line x1={x(Math.min(1, revealedGoal))} x2={x(revealedGoal)} y1={70} y2={70} stroke={amber} strokeWidth={6} strokeLinecap="round" />
          <circle cx={x(Math.min(1, revealedGoal))} cy={70} r={4} fill={PANEL} stroke={slate} strokeWidth={2} />
          <line x1={x(0)} x2={x(revealedGoal)} y1={108} y2={108} stroke={emerald} strokeWidth={5} strokeLinecap="round" />
          <line x1={x(revealedGoal)} x2={x(revealedGoal)} y1={113} y2={RULER_Y - 12} stroke={emerald} strokeDasharray="3 3" />
          {labels && <>
            <Tag x={(x(0) + x(Math.min(1, goal))) / 2} y={57} color={blue}>{formal ? "log₁₀(10)" : "×10"}</Tag>
            {goal > 1.001 && <Tag x={(x(1) + x(goal)) / 2} y={goal < 1.7 ? 91 : 57} color={amber}>{formal ? `log₁₀(${valueText(goal - 1)})` : `×${valueText(goal - 1)}`}</Tag>}
            <Tag x={(x(0) + x(goal)) / 2} y={132} color={emerald}>{formal ? `log₁₀(${valueText(goal)}) = ${goal.toFixed(3)}` : `×${valueText(goal)}`}</Tag>
          </>}
        </g>
      )}

      <line x1={x(0)} x2={x(3)} y1={RULER_Y} y2={RULER_Y} stroke={SEAM} strokeWidth={4} strokeLinecap="round" />
      <g key={`ticks-${pulse}`} className={changed?.name === "ruler_warp_factor" ? "gb-pulse" : undefined}>
        {TICKS.map((value) => {
          const px = x(rulerCoordinate(value, warp));
          const major = DECADES.includes(value);
          return <line key={value} x1={px} x2={px} y1={RULER_Y - (major ? 10 : 5)} y2={RULER_Y + (major ? 10 : 5)} stroke={slate} strokeWidth={major ? 3 : 1.5} />;
        })}
      </g>
      {labels && DECADES.map((value, i) => {
        const px = x(rulerCoordinate(value, warp));
        const crowded = warp < 0.45 && i < 3;
        const y = crowded ? 207 + i * 22 : 207;
        return <g key={value}>
          {crowded && <line x1={px} x2={px} y1={RULER_Y + 10} y2={y - 12} stroke={slate} strokeWidth={1} />}
          <Tag x={px} y={y} color={slate} size={12}>{value}</Tag>
        </g>;
      })}

      {stage >= 3 && ready && (
        <g data-log-ruler="marker">
          <line x1={x(marker)} x2={x(marker)} y1={RULER_Y - 19} y2={RULER_Y + 43} stroke={slate} strokeWidth={2} />
          <circle cx={x(marker)} cy={RULER_Y} r={6} fill={slate} />
          {labels && <Tag x={x(marker)} y={242} color={slate}>{hidden ? "?" : `≈${valueText(marker)}`}</Tag>}
          {board.can("marker_log") && <PlaneHandle x={x(marker)} y={RULER_Y} color={slate} cursor="ew-resize" onDrag={(pt) => board.set("marker_log", fromX(pt.x))} />}
        </g>
      )}

      {missed && ready && (
        <g data-log-ruler="gap">
          <line x1={x(revealedGoal)} x2={x(revealedGoal)} y1={RULER_Y - 15} y2={RULER_Y + 43} stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
          <path d={`M ${x(marker)} 259 V 269 H ${x(revealedGoal)} V 259`} fill="none" stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          <Tag x={clamp((x(marker) + x(goal)) / 2, 60, W - 60)} y={294} color={red}>{`Δ ${signed(goal - marker)}`}</Tag>
          {/* Ratios sit on their own ruler intervals, so a midpoint's equal factors are visible. */}
          {labels && [[low, marker], [marker, high]].map(([a = 0, b = 0], i) => (
            <g key={i}>
              <path d={`M ${x(a)} 148 V 154 H ${x(b)} V 148`} fill="none" stroke={red} strokeWidth={1.5} strokeDasharray="6 4" className="gb-march" />
              <Tag x={(x(a) + x(b)) / 2} y={146} color={red} size={11}>{`×${valueText(b - a)}`}</Tag>
            </g>
          ))}
        </g>
      )}

      {missed && !ready && (
        <g data-log-ruler="warp-gap">
          {[10, 100].map((value, i) => {
            const a = x(rulerCoordinate(value, warp));
            const b = x(Math.log10(value));
            const y = 118 + i * 25;
            return <g key={value}>
              <path d={`M ${a} ${RULER_Y - 12} V ${y} H ${b} V ${RULER_Y + 12}`} fill="none" stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
              {i === 0 && <Tag x={(a + b) / 2} y={y - 10} color={red} size={12}>{`Δw ${signed(1 - warp)}`}</Tag>}
            </g>;
          })}
        </g>
      )}

      <Rails input={placementInput} values={{ ...values, marker_log: marker }} bind={{ marker_log: { axis: "x", at: x, cross: H + RAIL_CROSS, reach: RULER_Y + 43 } }} />
    </Svg>
  );
}

export const logRuler: InteractiveDefinition = {
  Board,
  axes: { marker_log: "x" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3) return { ruler_warp_factor: "ruler_warp_factor" in target ? 0 : 1, marker_log: 0 };
    return Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
  },
  predictionControls(spec, target) {
    const warp = spec.stage2Exploration.controls.find((c) => c.variableName === "ruler_warp_factor");
    return "ruler_warp_factor" in target && warp ? [{ ...warp }, { ...markerControl }] : [{ ...markerControl }];
  },
  solve,
  evaluate(values, target, tolerance): Verdict {
    const goal = solve(target).marker_log!;
    const picked = values.marker_log;
    if (picked === undefined || !Number.isFinite(picked) || !Number.isFinite(goal)) return { correct: false, delta: 3 };
    const delta = picked - goal;
    const warped = !("ruler_warp_factor" in target) || Math.abs((values.ruler_warp_factor ?? 0) - 1) < 1e-9;
    const correct = picked >= 0 && picked <= 3 && warped && Math.abs(delta) <= Math.max(0, tolerance) + 1e-9;
    if (correct) return { correct, delta };
    // The named misses belong to placing 500 between 100 and 1000, not the review midpoint.
    if (Math.abs(goal - Math.log10(500)) < 0.01) {
      if (Math.abs(picked - 2.5) <= 0.02 + 1e-9) return { correct: false, delta, kind: "midpoint" };
      if (Math.abs(picked - (2 + 400 / 900)) <= 0.02 + 1e-9) return { correct: false, delta, kind: "linearSpacing" };
    }
    return { correct: false, delta };
  },
  formatDelta(verdict) { return signed(verdict.delta); },
};
