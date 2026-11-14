import { bandColor, bandFill, clamp, fmt, SEAM, signed } from "../bands";
import { Arrow, Lattice, lerp, span, Svg, Tag, useSettle } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

const W = 340;
const H = 330;
const FLOOR = 246;
const TRACK = 300;
const TOP = 42;
const STEP_MIN = 64;
const STEP_MAX = 302;
const stepX = (x: number) => lerp(STEP_MIN, STEP_MAX, x / 6);

export interface Race {
  base: number;
  start: number;
  linearStart: number;
  gain: number;
  review: boolean;
}

/** The review target has no configuration keys; its answer identifies the head-start race. */
export function raceOf(target: Values): Race {
  const review = target.growth_base_b === undefined && target.answer === 5;
  return { base: target.growth_base_b ?? 2, start: 1, linearStart: review ? 20 : 1, gain: review ? 2 : 3, review };
}

export function heights(race: Race, step: number) {
  return { blue: race.linearStart + race.gain * step, amber: race.start * race.base ** step };
}

/** Strictly taller: a tie at a step does not win the race. */
export function firstOvertake(race: Race): number {
  for (let x = 0; x <= 100; x++) {
    const h = heights(race, x);
    if (h.amber > h.blue) return x;
  }
  return Infinity;
}

function solve(target: Values): Values {
  const answer = firstOvertake(raceOf(target));
  return target.growth_base_b === undefined ? { answer } : { growth_base_b: target.growth_base_b, answer };
}

function choicesFor(target: Values): number[] {
  const race = raceOf(target);
  return race.review ? [4, 5, 6, 13] : race.base === 3 ? [1, 2, 3] : [3, 4, 5, 6];
}

/** Freeze at the starting stacks until commitment, including while changing the choice. */
export function raceFrame({ stage, target, values, spec, verdict, anchorT, guide }: Pick<BoardProps, "stage" | "target" | "values" | "spec" | "verdict" | "anchorT" | "guide">) {
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && !guided && verdict === null;
  const fixed = spec.stage2Exploration.fixed ?? {};
  const race: Race = stage >= 3 ? raceOf(target) : {
    base: anchoring ? 2 : values.growth_base_b ?? 2,
    start: fixed.start_height ?? 1,
    linearStart: fixed.linear_start ?? 1,
    gain: fixed.linear_gain ?? 3,
    review: false,
  };
  // Practice exposes the base; lesson/review races always reset to their specified configuration.
  if (stage >= 3 && target.growth_base_b !== undefined) race.base = values.growth_base_b ?? race.base;
  const solution = firstOvertake(race);
  const step = anchoring ? 4 * span(anchorT, 0.08, 0.94)
    : guided ? solution * clamp(guide, 0, 1)
    : hidden ? 0
    : stage === 2 ? clamp(values.step_count_x ?? 1, 0, 6)
    : clamp(values.answer ?? solution, 0, 13);
  const whole = Math.floor(step);
  const part = step - whole;
  const previous = Math.max(0, (anchoring || guided ? whole : Math.round(step)) - 1);
  const now = heights(race, whole);
  // First add matching blocks, then copy the amber stack. The final static frame retains both gains.
  const current = anchoring || guided ? {
    blue: now.blue + race.gain * span(part, 0, 0.45),
    amber: now.amber * lerp(1, race.base, span(part, 0.5, 0.95)),
  } : heights(race, step);
  return { race, step, previous, current, hidden, guided, anchoring };
}

function Board(props: BoardProps) {
  const { stage, spec, target, values, verdict, changed, input, guide } = props;
  const frame = raceFrame(props);
  const { race, step, previous, current, hidden, guided, anchoring } = frame;
  const formal = stage === 4;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const showTags = !anchoring && (!guided || guide! >= 1);
  const board = useBoardInput(anchoring || guided ? undefined : input, values);
  const before = heights(race, previous);
  const last = heights(race, Math.max(0, step - 1));
  const [blueHeight, amberHeight] = useSettle([current.blue, current.amber], !anchoring && !guided && !hidden) as [number, number];
  // One shared linear scale for both comparisons. Tall late guesses stop at a labelled cut.
  const ceiling = stage >= 3 ? (race.review ? 64 : target.growth_base_b === 3 ? 16 : 32) : Math.max(16, current.blue, current.amber);
  const y = (height: number) => FLOOR - clamp(height, 0, ceiling) / ceiling * (FLOOR - TOP);
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const slate = bandColor("slate");
  const red = bandColor("red");
  const color = missed ? red : slate;
  const pulse = changed?.name === "step_count_x" || changed?.name === "growth_base_b" ? changed.tick : 0;
  const compared = stage >= 3 && !hidden && !guided;
  const trackStep = hidden ? values.answer : step;
  const trackX = (x: number) => x > 6 ? W - 14 : stepX(x);
  const truth = firstOvertake(raceOf(target));
  const baseMiss = missed && target.growth_base_b !== undefined && values.growth_base_b !== target.growth_base_b;

  function towers(cx: number, blueValue: number, amberValue: number, exactBlue: number, exactAmber: number, old: boolean) {
    const width = old ? 24 : 38;
    const gap = old ? 34 : 60;
    const bx = cx - gap / 2;
    const ax = cx + gap / 2;
    const bTop = y(blueValue);
    const aTop = y(amberValue);
    const bPrevious = old ? Math.max(race.linearStart, exactBlue - race.gain) : last.blue;
    const aPrevious = old ? Math.max(race.start, exactAmber / race.base) : last.amber;
    return (
      <g data-race={old ? "previous" : "current"}>
        <line x1={bx - width / 2 - 8} x2={ax + width / 2 + 8} y1={FLOOR} y2={FLOOR} stroke={SEAM} strokeWidth={1.5} />
        {[{ x: bx, top: bTop, exact: exactBlue, token: "blue" as const, previous: bPrevious },
          { x: ax, top: aTop, exact: exactAmber, token: "amber" as const, previous: aPrevious }].map((tower) => (
          <g key={tower.token} data-tower={tower.token}>
            <rect className={!anchoring && !guided && pulse ? "gb-pulse" : undefined} style={{ ["--sw" as string]: "2px" }} x={tower.x - width / 2} y={tower.top} width={width} height={Math.max(0, FLOOR - tower.top)} rx={3} fill={bandFill(tower.token)} stroke={bandColor(tower.token)} strokeWidth={2} />
            {!hidden && <rect x={tower.x - width / 2} y={tower.top} width={width} height={Math.max(0, y(tower.previous) - tower.top)} rx={2} fill={bandFill(tower.token, 42)} />}
            {!hidden && <line x1={tower.x - width / 2} x2={tower.x + width / 2} y1={y(tower.previous)} y2={y(tower.previous)} stroke={bandColor(tower.token)} strokeWidth={1.5} strokeDasharray="3 3" />}
            {tower.exact > ceiling && <path d={`M ${tower.x - width / 2 - 3} ${TOP + 5} l ${width + 6} -8`} stroke={bandColor(tower.token)} strokeWidth={3} />}
            {showTags && <Tag x={tower.x} y={tower.top - 10} color={bandColor(tower.token)} size={old ? 12 : 14}>{fmt(tower.exact)}</Tag>}
          </g>
        ))}
        {!old && !hidden && step > 0 && <>
          <path d={`M ${bx - width / 2 - 4} ${bTop} h -7 V ${y(last.blue)} h 7`} fill="none" stroke={blue} strokeWidth={2} />
          {showTags && <Tag x={bx - width / 2 - 14} y={(bTop + y(last.blue)) / 2 + 4} anchor="end" color={blue} size={12}>{`+${fmt(race.gain)}`}</Tag>}
          <path d={`M ${ax + width / 2 + 4} ${aTop} h 7 V ${y(last.amber)} h -7`} fill="none" stroke={amber} strokeWidth={2} />
          {showTags && <Tag x={ax + width / 2 + 15} y={(aTop + y(last.amber)) / 2 + 4} anchor="start" color={amber} size={12}>{formal ? `b = ${fmt(race.base)}` : `×${fmt(race.base)}`}</Tag>}
        </>}
        {showTags && hidden && <>
          <Tag x={bx} y={FLOOR + 20} color={blue}>{`+${fmt(race.gain)}`}</Tag>
          <Tag x={ax} y={FLOOR + 20} color={amber}>{`×${fmt(race.base)}`}</Tag>
        </>}
        {compared && <g data-race="gap">
          <path d={`M ${bx} ${bTop} H ${cx} V ${aTop} H ${ax}`} fill="none" stroke={color} strokeWidth={2} strokeDasharray={missed ? "6 4" : "3 3"} className={missed ? "gb-march" : undefined} />
          <Tag x={cx} y={Math.max(TOP + 18, (aTop + bTop) / 2 + 4)} color={color} size={11}>{`Δ ${signed(exactAmber - exactBlue)}`}</Tag>
        </g>}
        {!old && baseMiss && <g data-race="base-discrepancy">
          <rect x={ax - width / 2} y={y(heights(raceOf(target), step).amber)} width={width} height={FLOOR - y(heights(raceOf(target), step).amber)} rx={3} fill="none" stroke={red} strokeWidth={2} strokeDasharray="6 4" className="gb-march" />
          <Tag x={ax} y={FLOOR + 20} color={red} size={12}>{`Δ b ${signed(race.base - target.growth_base_b!)}`}</Tag>
        </g>}
        {showTags && old && <Tag x={cx} y={FLOOR + 21} color={blue} size={12}>{fmt(previous)}</Tag>}
        {formal && !old && <>
          <rect x={ax - width / 2} y={y(race.start)} width={width} height={FLOOR - y(race.start)} fill={bandFill("slate", 45)} stroke={slate} strokeWidth={1.5} />
          <Tag x={ax} y={FLOOR + 20} color={slate} size={12}>{`a = ${fmt(race.start)}`}</Tag>
        </>}
      </g>
    );
  }

  return (
    <Svg width={W} height={H} label={spec.targetSkill} anchoring={anchoring} gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}>
      <Lattice cols={11} rows={8} unit={28} ox={16} oy={20} r={1.4} />
      <g key={`towers-${pulse}`}>
        {compared && towers(62, before.blue, before.amber, before.blue, before.amber, true)}
        {towers(compared ? 222 : 168, hidden ? current.blue : blueHeight, hidden ? current.amber : amberHeight, current.blue, current.amber, false)}
      </g>
      <Arrow x1={STEP_MIN} y1={TRACK} x2={race.review ? W - 4 : STEP_MAX + 12} y2={TRACK} color={blue} width={2} head={8} />
      {race.review && <path d={`M ${STEP_MAX + 5} ${TRACK + 5} l 4 -10 m 3 10 l 4 -10`} stroke={blue} strokeWidth={2} />}
      {Array.from({ length: 7 }, (_, x) => <g key={x}>
        <circle cx={stepX(x)} cy={TRACK} r={3} fill={blue} />
        {showTags && x !== trackStep && <Tag x={stepX(x)} y={TRACK + 20} color={slate} size={11} weight={400}>{x}</Tag>}
      </g>)}
      {trackStep !== undefined && <g data-race="selected-step">
        <circle cx={trackX(trackStep)} cy={TRACK} r={9} fill={bandFill("blue", 30)} stroke={blue} strokeWidth={2} />
        {showTags && <Tag x={trackX(trackStep)} y={TRACK - 17} color={blue}>{formal ? `x = ${fmt(trackStep)}` : fmt(trackStep)}</Tag>}
      </g>}
      {missed && values.answer !== undefined && values.answer !== truth && <g data-race="step-discrepancy">
        <line x1={trackX(values.answer)} x2={trackX(truth)} y1={TRACK - 1} y2={TRACK - 1} stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
        <Tag x={(trackX(values.answer) + trackX(truth)) / 2} y={TRACK + 40} color={red} size={12}>{`Δ ${signed(values.answer - truth)}`}</Tag>
      </g>}
      {!anchoring && !guided && <Rails input={input} values={values} bind={{ step_count_x: { axis: "x", at: stepX, cross: H + RAIL_CROSS, reach: TRACK } }} />}
      {board.can("step_count_x") && <PlaneHandle x={stepX(step)} y={TRACK} color={blue} cursor="ew-resize" onDrag={(point) => board.set("step_count_x", (point.x - STEP_MIN) / (STEP_MAX - STEP_MIN) * 6)} />}
    </Svg>
  );
}

export const growthRace: InteractiveDefinition = {
  Board,
  axes: { step_count_x: "x" },
  initialValues(spec, stage, target) {
    if (stage === 3) return target.growth_base_b === undefined ? {} : { growth_base_b: spec.stage2Exploration.controls.find((c) => c.variableName === "growth_base_b")?.initial ?? 2 };
    if (stage === 4) return { ...solve(target), step_count_x: firstOvertake(raceOf(target)) };
    return Object.fromEntries(spec.stage2Exploration.controls.map((control) => [control.variableName, control.initial]));
  },
  predictionControls(spec, target) {
    const choices = choicesFor(target);
    const controls: ControlDef[] = [];
    const multiplier = spec.stage2Exploration.controls.find((control) => control.variableName === "growth_base_b");
    if (target.growth_base_b !== undefined && multiplier) controls.push({ variableName: multiplier.variableName, label: multiplier.label, min: multiplier.min, max: multiplier.max, step: multiplier.step, colorToken: multiplier.colorToken });
    controls.push({ variableName: "answer", label: spec.stage2Exploration.controls.find((control) => control.variableName === "step_count_x")?.label ?? "x", min: Math.min(...choices), max: Math.max(...choices), step: 1, colorToken: "blue", choices });
    return controls;
  },
  solve,
  evaluate(values, target, tolerance): Verdict {
    const truth = solve(target).answer!;
    if (!Number.isFinite(values.answer) || !Number.isInteger(values.answer)) return { correct: false, delta: Infinity };
    const delta = values.answer! - truth;
    if (target.growth_base_b !== undefined && !Number.isFinite(values.growth_base_b)) return { correct: false, delta: Infinity };
    if (target.growth_base_b !== undefined && values.growth_base_b !== target.growth_base_b) {
      return { correct: false, delta: delta || values.growth_base_b! - target.growth_base_b };
    }
    if (Math.abs(delta) <= Math.max(0, tolerance)) return { correct: true, delta };
    const race = raceOf(target);
    if (values.answer === (race.review ? 13 : 6) && race.base === 2) return { correct: false, delta, kind: "linearThinking" };
    if (Math.abs(delta) === 1) return { correct: false, delta, kind: "offByOne" };
    return { correct: false, delta };
  },
  formatDelta(verdict) { return signed(verdict.delta); },
};
