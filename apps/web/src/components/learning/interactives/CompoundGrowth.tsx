import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, GROUND, SEAM } from "../bands";
import { lerp, span, Svg, Tag, usePlane, useSettle } from "./board-kit";
import { DragArea, PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

const W = 340;
const H = 360;
const MILLION = 1_000_000;
const EPS = 1e-9;
const BAR_X = 96;
const BAR_W = 76;
const MARKER_X = 208;
const roundHeight = (height: number) => Number(height.toFixed(3));
const decimal = (height: number) => height.toFixed(3);
const deltaText = (delta: number) => `${delta < 0 ? "−" : delta > 0 ? "+" : ""}${decimal(Math.abs(delta))}`;

/** Stable even for a million subdivisions; only the fixed 100% rate is being split. */
export function compoundHeight(n: number, start = 1, progress = 1): number {
  return start * Math.exp(n * Math.log1p(1 / n) * clamp(progress, 0, 1));
}

/** Review has no count input: the authored review target identifies its doubled starting bar. */
export function compoundCase(target: Values, spec?: ModuleSpec) {
  const practice = target.split_count_n !== undefined;
  const review = !practice && target.height_y === (spec?.retentionHooks.reviewTarget?.height_y ?? 5.437);
  return {
    practice,
    start: review ? 2 : (spec?.stage2Exploration.fixed?.start_height ?? 1),
    n: practice ? target.split_count_n! : MILLION,
  };
}

function solve(target: Values, spec?: ModuleSpec): Values {
  const task = compoundCase(target, spec);
  return {
    ...(task.practice ? { split_count_n: task.n } : {}),
    height_y: roundHeight(compoundHeight(task.n, task.start)),
  };
}

function heightControl(): ControlDef {
  // y is notation, not untranslated chrome. The spec explicitly asks for a placed marker.
  return { variableName: "height_y", label: "y", min: 1, max: 6, step: 0.001, colorToken: "amber" };
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && !guided && verdict === null;
  const wrong = stage === 3 && verdict !== null && !verdict.correct;
  const task = compoundCase(target, spec);
  const start = stage < 3 ? (spec.stage2Exploration.fixed?.start_height ?? 1) : task.start;
  const t = clamp(anchorT, 0, 1);
  const anchorN = t < 0.35 ? 1 : t < 0.65 ? 4 : 64;
  const anchorProgress = t < 0.35 ? span(t, 0.04, 0.3) : t < 0.65 ? span(t, 0.35, 0.6) : span(t, 0.65, 0.95);
  const n = anchoring ? anchorN : stage === 2 || task.practice
    ? clamp(Math.round(values.split_count_n ?? 1), 1, 1000) : MILLION;
  const progress = anchoring ? anchorProgress : guided ? clamp(guide, 0, 1) : 1;
  const exactTop = compoundHeight(n, start, progress);
  const [top] = useSettle([hidden ? start : exactTop], !anchoring && !guided);
  const s = usePlane({ width: W, height: H, pad: 28, xMin: 0, xMax: 6, yMin: 0, yMax: 6.6 });
  const y = s.y;
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const slate = bandColor("slate");
  const red = bandColor("red");
  const board = useBoardInput(anchoring || guided ? undefined : input, values);
  const tags = !anchoring && (!guided || guide >= 1);
  const shelf = !anchoring && stage >= 3 && !hidden && (!guided || guide >= 1);
  const marker = values.height_y ?? start;
  const markerY = y(clamp(marker, 1, 6));
  const showMarker = stage >= 3 && !guided;
  const pulse = changed?.name === "split_count_n" ? changed.tick : 0;
  const sliceCount = Math.min(64, n);
  const drawnTop = hidden ? start : clamp(top!, start, 6.6);
  const limit = start * Math.E;
  const heightDelta = marker - roundHeight(compoundHeight(n, start));
  const countDelta = task.practice ? n - task.n : 0;
  const smallMiss = wrong && Math.abs(heightDelta) > EPS && Math.abs(heightDelta) < 0.15 * start;

  return (
    <Svg width={W} height={H} anchoring={anchoring} gutter={{ left: RAIL_GUTTER }}
      label={stage === 1 ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : spec.stage3Prediction.challengePrompt}>
      {/* Height pegs and the floor keep one scale throughout the lesson and review. */}
      <g aria-hidden>
        {Array.from({ length: 7 }, (_, h) => (
          <g key={h}>
            {[28, 76, 124, 172, 220, 268, 312].map((x) => <circle key={x} cx={x} cy={y(h)} r={1.6} fill="var(--color-gb-peg)" />)}
            {tags && <Tag x={19} y={y(h) + 4} color={slate} size={11} anchor="end">{h}</Tag>}
          </g>
        ))}
        <line x1={28} x2={312} y1={y(0)} y2={y(0)} stroke={SEAM} strokeWidth={1.5} />
      </g>

      {/* The initial single jump survives in the reduced-motion final frame. */}
      {anchoring && t >= 0.35 && <rect data-compound-ghost="" x={BAR_X - 20} y={y(2 * start)} width={BAR_W + 40}
        height={y(start) - y(2 * start)} fill="none" stroke={blue} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="3 3" />}

      <rect data-compound-start="" x={BAR_X} y={y(start)} width={BAR_W} height={y(0) - y(start)} rx={3}
        fill={bandFill("slate", 16)} stroke={slate} strokeWidth={1.5} />
      {!hidden && <g data-compound-gains="">
        <rect x={BAR_X} y={y(drawnTop)} width={BAR_W} height={y(start) - y(drawnTop)} fill={bandFill("blue", 22)} />
        {/* Above 64 splits these are equal groups of substeps, never a million SVG nodes. */}
        {Array.from({ length: sliceCount }, (_, i) => {
          const fraction = (i + 1) / sliceCount;
          const boundary = start + (drawnTop - start) * (compoundHeight(n, start, fraction) - start) / (compoundHeight(n, start) - start);
          return <line key={i} data-compound-slice="" x1={BAR_X} x2={BAR_X + BAR_W} y1={y(boundary)} y2={y(boundary)} stroke={blue}
            strokeWidth={n > 64 ? 0.6 : 1.3} strokeOpacity={n > 64 ? 0.45 : 0.8} />;
        })}
        <line key={pulse} className={!anchoring && !guided ? "gb-pulse" : undefined} x1={BAR_X} x2={BAR_X + BAR_W}
          y1={y(drawnTop)} y2={y(drawnTop)} stroke={blue} strokeWidth={5} strokeLinecap="round" style={{ ["--sw" as string]: "5px" }} />
        {tags && <Tag x={BAR_X + BAR_W / 2} y={y(drawnTop) - 12} color={blue}>{decimal(exactTop)}</Tag>}
      </g>}

      {tags && <>
        <Tag x={BAR_X + BAR_W / 2} y={y(start / 2) + 4} color={slate}>{start}</Tag>
        {(!hidden || task.practice) && <Tag x={BAR_X + BAR_W / 2} y={y(start) - 8} color={blue}>{stage === 4 ? `n = ${n}` : String(n)}</Tag>}
      </>}

      {shelf && <g data-compound-shelf="">
        <line x1={BAR_X - 12} x2={W - 14} y1={y(limit)} y2={y(limit)} stroke={amber} strokeWidth={2} strokeDasharray="4 4" />
        <Tag x={W - 16} y={y(limit) - 12} color={amber} anchor="end">{stage === 4 ? `${start === 1 ? "" : start}e ≈ ${decimal(limit)}` : decimal(limit)}</Tag>
      </g>}

      {showMarker && <g data-compound-marker="">
        <line x1={BAR_X + BAR_W + 10} x2={MARKER_X + 16} y1={markerY} y2={markerY} stroke={amber} strokeWidth={3} />
        <Tag x={MARKER_X + 23} y={markerY + 5} color={amber} anchor="start">{decimal(marker)}</Tag>
      </g>}

      {wrong && <g data-compound-miss="">
        <line x1={BAR_X + BAR_W + 12} x2={BAR_X + BAR_W + 12} y1={y(drawnTop)} y2={markerY}
          stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
        <line x1={BAR_X} x2={BAR_X + BAR_W} y1={markerY} y2={markerY} stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
        <Tag x={BAR_X + BAR_W + 22} y={clamp(Math.max(y(drawnTop), markerY) + 28, 45, H - 20)} color={red} anchor="start">{`Δ ${deltaText(heightDelta)}`}</Tag>
        {countDelta !== 0 && <Tag x={BAR_X + BAR_W / 2} y={y(start) - 28} color={red}>{`Δn = ${countDelta > 0 ? "+" : "−"}${Math.abs(countDelta)}`}</Tag>}
      </g>}

      {/* A local magnification makes even a six-thousandth miss visible on the shape. */}
      {smallMiss && (() => {
        const middle = (marker + exactTop) / 2;
        const radius = Math.max(Math.abs(marker - exactTop) * 0.7, 0.01);
        const zoomY = (v: number) => lerp(148, 62, (v - (middle - radius)) / (2 * radius));
        return <g data-compound-zoom="">
          <line x1={MARKER_X} x2={244} y1={y(drawnTop)} y2={zoomY(exactTop)} stroke={SEAM} strokeDasharray="3 3" />
          <rect x={240} y={48} width={86} height={114} rx={6} fill={GROUND} stroke={SEAM} />
          <line x1={250} x2={282} y1={zoomY(exactTop)} y2={zoomY(exactTop)} stroke={blue} strokeWidth={4} />
          <line x1={250} x2={282} y1={zoomY(marker)} y2={zoomY(marker)} stroke={amber} strokeWidth={3} />
          <line x1={282} x2={282} y1={zoomY(marker)} y2={zoomY(exactTop)} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          <Tag x={286} y={zoomY(exactTop) + 4} color={blue} size={10} anchor="start">{decimal(exactTop)}</Tag>
          <Tag x={286} y={zoomY(marker) + 4} color={amber} size={10} anchor="start">{decimal(marker)}</Tag>
        </g>;
      })()}

      {!anchoring && !guided && <Rails input={input} values={values} bind={{ height_y: { axis: "y", at: y, cross: -RAIL_CROSS, reach: MARKER_X } }} />}
      {board.can("height_y") && <>
        <DragArea cursor="ns-resize" onDrag={(pt) => board.set("height_y", s.fromY(pt.y))}>
          <line x1={BAR_X + BAR_W + 10} x2={MARKER_X + 16} y1={markerY} y2={markerY} stroke="transparent" strokeWidth={28} />
        </DragArea>
        <PlaneHandle x={MARKER_X} y={markerY} color={amber} cursor="ns-resize" onDrag={(pt) => board.set("height_y", s.fromY(pt.y))} />
      </>}
    </Svg>
  );
}

export const compoundGrowth: InteractiveDefinition = {
  Board,
  axes: { height_y: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target, spec);
    if (stage === 3) return { ...(compoundCase(target, spec).practice ? { split_count_n: 1 } : {}), height_y: compoundCase(target, spec).start };
    return Object.fromEntries(spec.stage2Exploration.controls.map((control) => [control.variableName, control.initial]));
  },
  predictionControls(spec, target) {
    if (!compoundCase(target, spec).practice) return [heightControl()];
    const count = spec.stage2Exploration.controls.find((control) => control.variableName === "split_count_n");
    return [
      { variableName: "split_count_n", label: count?.label ?? "n", min: 1, max: 1000, step: 1, colorToken: "blue" },
      heightControl(),
    ];
  },
  solve,
  evaluate(values, target, tolerance, spec): Verdict {
    const picked = values.height_y;
    if (!Number.isFinite(picked)) return { correct: false, delta: Infinity };
    const task = compoundCase(target, spec);
    const delta = picked! - solve(target, spec).height_y!;
    const countCorrect = !task.practice || values.split_count_n === task.n;
    const correct = Math.abs(delta) <= Math.max(0, tolerance) + EPS && countCorrect;
    if (!correct && picked! >= 3 * task.start) return { correct, delta, kind: "unbounded" };
    if (!correct && Math.abs(picked! - 2 * task.start) <= 0.05 * task.start + EPS) return { correct, delta, kind: "singleJump" };
    return { correct, delta };
  },
  formatDelta(verdict) { return deltaText(verdict.delta); },
};
