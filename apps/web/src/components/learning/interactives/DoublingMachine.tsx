import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, SEAM, signed } from "../bands";
import { Arrow, Lattice, span, Svg, Tag, useSettle } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

const W = 340;
const H = 350;
const FLOOR = 264;
const TRACK = 308;
const BAR = 298;
const EPS = 1e-9;
const HEIGHT = "target_value_y";

function stepCount(height: number, start: number, base: number) {
  const steps = Math.log(height / start) / Math.log(base);
  // Powers of ten can land a few ulps below an integer; choices require exact values.
  return Math.abs(steps - Math.round(steps)) < EPS ? Math.round(steps) : steps;
}

/** An answer-only target is the tenfold review; a height + answer is assisted counting. */
export function machineCase(target: Values, spec?: ModuleSpec) {
  const countChoice = target.answer !== undefined;
  const review = countChoice && target[HEIGHT] === undefined;
  const base = review ? 10 : spec?.stage2Exploration.fixed?.growth_base_b ?? 2;
  const start = review ? 1 : spec?.stage2Exploration.fixed?.start_height ?? 1;
  const height = review ? 1000 : target[HEIGHT] ?? start;
  const steps = stepCount(height, start, base);
  return { countChoice, review, base, start, height, steps };
}

function heightControl(spec: ModuleSpec): ControlDef {
  const control = spec.stage2Exploration.controls.find((c) => c.variableName === HEIGHT);
  return {
    variableName: HEIGHT, label: control?.label ?? "y",
    min: control?.min ?? 1, max: control?.max ?? 32, step: control?.step ?? 0.25,
    colorToken: control?.colorToken ?? "amber",
  };
}

function solve(target: Values, spec?: ModuleSpec): Values {
  const c = machineCase(target, spec);
  if (!c.countChoice) return { [HEIGHT]: c.height };
  return { ...(c.review ? {} : { [HEIGHT]: c.height }), answer: c.steps };
}

function evaluate(values: Values, target: Values, tolerance: number, spec?: ModuleSpec): Verdict {
  const c = machineCase(target, spec);
  const picked = values[c.countChoice ? "answer" : HEIGHT];
  if (picked === undefined || !Number.isFinite(picked)) return { correct: false, delta: Infinity };
  const truth = c.countChoice ? c.steps : c.height;
  const delta = picked - truth;
  if (Math.abs(delta) <= Math.max(0, tolerance) + EPS) return { correct: true, delta };
  if (c.countChoice) {
    if (Math.abs(Math.abs(delta) - 1) < EPS) return { correct: false, delta, kind: "offByOne" };
    if (picked === (c.review ? 100 : 8)) return { correct: false, delta, kind: "additive" };
  } else {
    if (Math.abs(picked - c.height / c.base) < EPS || Math.abs(picked - c.height * c.base) < EPS) {
      return { correct: false, delta, kind: "offByOne" };
    }
    // Common equal-addition readings: add one, or add the factor, on each jump.
    if (Math.abs(picked - (c.start + c.steps)) < EPS || Math.abs(picked - (c.start + c.base * c.steps)) < EPS) {
      return { correct: false, delta, kind: "additive" };
    }
  }
  return { correct: false, delta };
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const anchoring = stage === 1;
  const guided = guide != null;
  const formal = stage === 4;
  const hidden = stage === 3 && !guided && verdict === null;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const c = machineCase(stage >= 3 ? target : {}, spec);
  const control = heightControl(spec);
  const maxHeight = c.review ? 1000 : control.max;
  const maxSteps = c.review ? 4 : Math.ceil(Math.log(maxHeight / c.start) / Math.log(c.base));
  const atX = (step: number) => 30 + clamp(step, 0, maxSteps) * 220 / maxSteps;
  const atY = (height: number) => FLOOR - clamp(height, 0, maxHeight) * 208 / maxHeight;
  const fromY = (y: number) => (FLOOR - y) * maxHeight / 208;
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const red = bandColor("red");
  const rawHeight = anchoring
    ? c.start * c.base ** (maxSteps * span(anchorT, 0.08, 0.94))
    : c.countChoice ? c.height : values[HEIGHT] ?? control.min;
  const [movingHeight = rawHeight] = useSettle([rawHeight], !anchoring && !guided);
  const height = clamp(movingHeight, control.min, maxHeight);
  const steps = stepCount(height, c.start, c.base);
  const exactSteps = stepCount(rawHeight, c.start, c.base);
  const trailSteps = stage >= 3 && !guided ? c.steps : steps;
  const [trailReveal = trailSteps, counterReveal = steps] = useSettle(
    [hidden ? 0 : trailSteps, hidden ? 0 : steps], !anchoring && !guided,
  );
  const shownTrail = clamp(trailReveal, 0, trailSteps);
  const shownSteps = hidden ? 0 : clamp(counterReveal, 0, steps);
  const showTags = !anchoring && (!guided || guide >= 1);
  const board = useBoardInput(anchoring || guided || c.countChoice ? undefined : input, values);
  const picked = c.countChoice ? values.answer : values[HEIGHT];
  const pulse = changed?.name === HEIGHT ? changed.tick : 0;
  const safeInput = anchoring || guided || c.review ? undefined : input;

  return (
    <Svg width={W} height={H} label={spec.targetSkill} anchoring={anchoring} gutter={{ left: RAIL_GUTTER }}>
      <Lattice cols={11} rows={9} unit={28} ox={14} oy={28} />
      <line x1={14} x2={326} y1={FLOOR} y2={FLOOR} stroke={SEAM} strokeWidth={1.5} />
      {/* In the reduced-motion final frame the growing copies still tell the whole story. */}
      {!hidden && <g data-machine="trail">
        {Array.from({ length: maxSteps + 1 }, (_, i) => {
          const progress = clamp(shownTrail - i + 1, 0, 1);
          if (progress === 0) return null;
          const y = atY(c.start * c.base ** i);
          const nextY = atY(c.start * c.base ** (i + 1));
          return <g key={i} opacity={i > shownTrail ? 0.3 : 1}>
            <rect x={atX(i) - 10} y={y} width={20} height={FLOOR - y} rx={3}
              fill={bandFill("amber", 22)} stroke={amber} strokeWidth={2} />
            {i < Math.floor(shownTrail) && <Arrow x1={atX(i) + 12} y1={y - 5}
              x2={atX(i + 1) - 12} y2={nextY - 5} color={amber} width={1.5} head={6} />}
            {showTags && <Tag x={atX(i)} y={y - 14} color={amber} size={11}>{fmt(c.start * c.base ** i)}</Tag>}
          </g>;
        })}
      </g>}

      <g data-machine="height" key={`height-${pulse}`}>
        <rect x={BAR - 16} y={atY(height)} width={32} height={FLOOR - atY(height)} rx={3}
          fill={bandFill("amber", 30)} stroke={amber} strokeWidth={2} />
        <line className={anchoring || guided ? undefined : "gb-pulse"}
          x1={BAR - 23} x2={BAR + 23} y1={atY(height)} y2={atY(height)}
          stroke={amber} strokeWidth={4} strokeLinecap="round" style={{ ["--sw" as string]: "4px" }} />
        {showTags && <Tag x={BAR} y={atY(rawHeight) - 13} color={amber}>
          {formal ? `y = ${fmt(rawHeight)}` : fmt(rawHeight)}
        </Tag>}
      </g>

      {/* At the gate the bead stays at zero and no copies or live log count are exposed. */}
      <g data-machine="counter">
        <line x1={atX(0)} x2={atX(maxSteps)} y1={TRACK} y2={TRACK} stroke={SEAM} strokeWidth={4} strokeLinecap="round" />
        {!hidden && <line x1={atX(0)} x2={atX(shownSteps)} y1={TRACK} y2={TRACK} stroke={blue} strokeWidth={4} strokeLinecap="round" />}
        {Array.from({ length: maxSteps + 1 }, (_, i) => <g key={i}>
          <circle cx={atX(i)} cy={TRACK} r={3} fill={i <= shownSteps ? blue : SEAM} />
          {showTags && <Tag x={atX(i)} y={TRACK + 29} color={blue} size={11}>{i}</Tag>}
        </g>)}
        <circle data-machine="bead" cx={atX(shownSteps)} cy={TRACK} r={7} fill={blue} />
        {!hidden && <path data-machine="link"
          d={`M ${BAR - 18} ${atY(height)} H ${atX(shownSteps)} V ${TRACK - 10}`}
          fill="none" stroke={blue} strokeWidth={1.5} strokeDasharray="3 3" />}
        {!hidden && showTags && <Tag x={atX(exactSteps)} y={TRACK - 15} color={blue}>
          {formal ? `x = ${fmt(exactSteps)}` : fmt(exactSteps)}
        </Tag>}
      </g>

      {/* Compare committed heights, or counts, in the unit the learner actually predicted. */}
      {missed && Number.isFinite(picked) && <g data-machine="gap">
        {c.countChoice ? <>
          <line x1={atX(c.steps)} x2={atX(picked!)} y1={TRACK - 3} y2={TRACK - 3}
            stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          <circle cx={atX(picked!)} cy={TRACK} r={10} fill="none" stroke={red}
            strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
          <Tag x={(atX(c.steps) + atX(picked!)) / 2} y={TRACK - 43} color={red}>{`Δ ${signed(verdict.delta)}`}</Tag>
          <Tag x={atX(picked!)} y={TRACK + 16} color={red} size={11}>{fmt(picked!)}</Tag>
          {picked! > maxSteps && <line x1={atX(maxSteps) - 5} x2={atX(maxSteps) + 5}
            y1={TRACK - 7} y2={TRACK + 7} stroke={red} strokeWidth={2} />}
        </> : <>
          <line x1={BAR - 25} x2={BAR + 25} y1={atY(c.height)} y2={atY(c.height)}
            stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          <path d={`M ${BAR - 42} ${atY(picked!)} h -8 V ${atY(c.height)} h 8`}
            fill="none" stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
          <Tag x={BAR - 57} y={(atY(picked!) + atY(c.height)) / 2 + 4} anchor="end" color={red}>
            {`Δ ${signed(verdict.delta)}`}
          </Tag>
        </>}
      </g>}

      {formal && <Tag x={atX(1)} y={FLOOR + 18} color={amber} size={11}>{`×${fmt(c.base)}`}</Tag>}
      {!anchoring && !guided && <Rails input={safeInput} values={values} bind={{
        [HEIGHT]: { axis: "y", at: atY, cross: -RAIL_CROSS, reach: BAR - 23 },
      }} />}
      {board.can(HEIGHT) && <PlaneHandle x={BAR} y={atY(rawHeight)} color={amber} cursor="ns-resize"
        onDrag={(point) => board.set(HEIGHT, fromY(point.y))} />}
    </Svg>
  );
}

export const doublingMachine: InteractiveDefinition = {
  Board,
  axes: { target_value_y: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target, spec);
    if (stage === 3) return machineCase(target, spec).countChoice ? {} : { [HEIGHT]: heightControl(spec).min };
    return Object.fromEntries(spec.stage2Exploration.controls.map((control) => [control.variableName, control.initial]));
  },
  predictionControls(spec, target) {
    const c = machineCase(target, spec);
    if (!c.countChoice) return [heightControl(spec)];
    return [
      ...(c.review ? [] : [heightControl(spec)]),
      {
        variableName: "answer",
        label: spec.stage1Anchoring.pretrainingElements.find((element) => element.colorToken === "blue")?.label ?? "x",
        min: 2, max: c.review ? 100 : 8, step: 1, colorToken: "blue",
        choices: c.review ? [2, 3, 4, 100] : [2, 3, 4, 8],
      },
    ];
  },
  solve,
  evaluate,
  formatDelta: (verdict) => signed(verdict.delta),
};
