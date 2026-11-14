import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, clamp, fmt, SEAM, signed } from "../bands";
import { Arrow, lerp, span, Svg, Tag, useSettle } from "./board-kit";
import { DragArea, PlaneHandle, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

const PI = Math.PI;
const TAU = 2 * PI;
const W = 340;
const H = 400;
const GUTTER = { bottom: 0 };
const EPS = 1e-8;

export const modeOf = (spec?: ModuleSpec) => spec?.stage2Exploration.fixed?.mode ?? 0;
/** Signed shortest angular discrepancy; tangent's supporting line repeats every pi. */
export function angleDelta(actual: number, expected: number, period = TAU) {
  return ((actual - expected + period / 2) % period + period) % period - period / 2;
}

export function wallStrike(theta: number) {
  if (Math.abs(Math.cos(theta)) < EPS) return null;
  return Math.tan(theta);
}

function solve(target: Values): Values {
  return { ...target };
}

function angleControl(spec: ModuleSpec): ControlDef {
  const c = spec.stage2Exploration.controls.find((control) => control.variableName === "theta")!;
  return { variableName: "theta", label: c.label, min: c.min, max: c.max, step: c.step, colorToken: c.colorToken };
}

function predictionControls(spec: ModuleSpec, target: Values): ControlDef[] {
  const mode = modeOf(spec);
  if (target.answer === undefined) return [angleControl(spec)];
  const area = mode === 3 && target.theta !== undefined;
  const choices = mode === 0 ? [PI / 2, PI, TAU, 90] : mode === 1 ? [0, 1, -1]
    : mode === 2 ? [1, Math.SQRT1_2, -1] : area ? [0.25, 0.5, 0.75, 1] : [0.8, -0.8, 0.64, 0.4];
  const answer: ControlDef = {
    variableName: "answer", label: mode === 0 ? "s/r" : mode === 1 ? "x" : mode === 2 ? "tan θ" : area ? "y²" : "y",
    min: Math.min(...choices), max: Math.max(...choices), step: 0.01,
    colorToken: mode === 0 ? "amber" : mode === 1 ? "blue" : mode === 2 ? "emerald" : "rose", choices,
  };
  // The player presets and locks theta; the result choice is the only movable variable.
  return target.theta === undefined ? [answer] : [angleControl(spec), answer];
}

function evaluate(values: Values, target: Values, tolerance: number, spec?: ModuleSpec): Verdict {
  const mode = modeOf(spec);
  const answering = target.answer !== undefined;
  const picked = values[answering ? "answer" : "theta"];
  const truth = target[answering ? "answer" : "theta"]!;
  if (picked === undefined || !Number.isFinite(picked)) return { correct: false, delta: 0 };
  const delta = !answering && mode !== 0 ? angleDelta(picked, truth, mode === 2 ? PI : TAU) : picked - truth;
  const lockedDelta = answering && target.theta !== undefined
    ? values.theta === undefined ? Infinity : Math.abs(mode === 0 ? values.theta - target.theta : angleDelta(values.theta, target.theta, mode === 2 ? PI : TAU)) : 0;
  if (Math.abs(delta) <= tolerance + EPS && lockedDelta <= tolerance + EPS) return { correct: true, delta: 0 };
  const near = (n: number) => Math.abs(picked - n) <= Math.max(tolerance, 0.025);
  let kind: Verdict["kind"];
  if (mode === 0) {
    kind = near(90) || near(180) ? "degrees" : near(TAU) ? "fullTurn" : near(2) ? "diameter" : near(3) ? "shortArc" : undefined;
  } else if (mode === 1) {
    if (answering ? target.theta !== undefined && near(Math.sin(target.theta))
      : Math.abs(angleDelta(picked, PI / 2 - truth)) <= Math.max(tolerance, 0.025)) kind = "swapped";
    else if (answering ? picked < 0 : Math.cos(picked) * Math.cos(truth) < -EPS || Math.sin(picked) * Math.sin(truth) < -EPS) kind = "sign";
    else kind = "unequal";
  } else if (mode === 2) {
    const expected = answering ? truth : wallStrike(truth);
    const actual = answering ? picked : wallStrike(picked);
    if (actual !== null && expected !== null && actual * expected < -EPS) kind = "sign";
    else if (answering ? near(Math.SQRT1_2) : actual !== null && Math.abs(actual - Math.sin(truth)) <= 0.025) kind = "sineOnly";
    else kind = "height";
  } else if (picked * truth < 0) kind = "sign";
  else if (target.theta !== undefined ? near(Math.sqrt(truth)) : near(truth * truth)) kind = "areaAsLength";
  else kind = "linearRemainder";
  return kind ? { correct: false, delta, kind } : { correct: false, delta };
}

/** Polyline arcs support full turns and the small diagnostic gap without SVG arc edge cases. */
function arc(cx: number, cy: number, radius: number, start: number, end: number) {
  const steps = Math.max(2, Math.ceil(Math.abs(end - start) * 24));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = lerp(start, end, i / steps);
    return `${cx + radius * Math.cos(a)},${cy - radius * Math.sin(a)}`;
  }).join(" ");
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const mode = modeOf(spec);
  const fixed = spec.stage2Exploration.fixed ?? {};
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && verdict === null && !guided;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const formal = stage === 4;
  const labels = !anchoring && !(guided && guide < 1);
  const areaQuestion = mode === 3 && stage >= 3 && target.theta !== undefined;
  const lengthQuestion = mode === 3 && stage >= 3 && !areaQuestion;
  const review = mode === 0 && target.answer === undefined && target.theta === spec.retentionHooks.reviewTarget?.theta && stage >= 3;
  const radius = review ? fixed.reviewRadius ?? 2 : fixed.radius ?? 1;
  const initial = spec.stage2Exploration.controls.find((c) => c.variableName === "theta")?.initial ?? PI / 4;
  const goalTheta = target.theta ?? Math.atan2(target.answer ?? 0.8, Math.sqrt(fixed.horizontalArea ?? 0.36));
  const driven = anchoring ? mode === 0 ? 1 : lerp(-PI / 6, PI * 0.7, anchorT)
    : guided ? lerp(0, goalTheta, guide) : formal ? goalTheta : values.theta ?? initial;
  // Direct manipulation stays immediate; only the committed reveal settles.
  const [theta = driven] = useSettle([driven], stage === 3 && verdict !== null && !guided);
  const board = useBoardInput(anchoring || guided ? undefined : input, values);
  const blue = bandColor("blue");
  const rose = bandColor("rose");
  const amber = bandColor("amber");
  const green = bandColor("emerald");
  const slate = bandColor("slate");
  const red = bandColor("red");
  const cx = mode === 2 ? 132 : mode === 3 ? 146 : 160;
  const cy = mode === 2 ? 200 : mode === 3 ? 155 : 180;
  const r = mode === 2 ? 70 : mode === 3 ? 82 : 104;
  /** How many radii of tangent wall fit on the board; strikes beyond it show an off-board arrow. */
  const reach = 2.5;
  const x = lengthQuestion ? Math.sqrt(fixed.horizontalArea ?? 0.36) : Math.cos(theta);
  const actualY = Math.sin(theta);
  const choice = guided ? lerp(0, target.answer ?? 0, guide) : formal ? target.answer : values.answer;
  // A guessed leg is deliberately independent of the circle: its square can leave an area gap.
  const y = lengthQuestion ? choice ?? 0 : areaQuestion && !hidden && choice !== undefined ? Math.sqrt(Math.max(0, choice)) : actualY;
  const px = cx + r * x;
  const py = cy - r * y;
  const showShadows = mode > 0 && !hidden;
  const strike = wallStrike(theta);
  const wallX = cx + r * (fixed.wallX ?? 1);
  const wallY = cy - r * clamp(strike ?? 0, -reach, reach);
  const pulse = changed?.tick ?? 0;
  const discrepancy = { stroke: red, strokeWidth: 2.5, strokeDasharray: "6 4", className: "gb-march" };
  const tagY = cy + 24;
  const xArea = x * x;
  const yArea = y * y;
  const gaugeX = 62;
  const gaugeY = 337;
  const gaugeW = 216;
  const gaugeH = 32;
  const symbol = (index: number, fallback: string) => spec.stage4Formalization.colorMapping[index]?.symbol ?? fallback;

  return (
    <Svg width={W} height={H} gutter={GUTTER} anchoring={anchoring}
      label={anchoring ? spec.stage1Anchoring.caption : stage === 2 ? spec.stage2Exploration.prompt : spec.stage3Prediction.challengePrompt}>
      <line x1={24} y1={cy} x2={W - 24} y2={cy} stroke={SEAM} strokeWidth={1.5} />
      <line x1={cx} y1={24} x2={cx} y2={mode === 3 ? 295 : H - 24} stroke={SEAM} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={slate} strokeWidth={2} />
      {/* Static earlier radius makes the motion legible even in the reduced-motion final frame. */}
      {anchoring && mode !== 0 && <line x1={cx} y1={cy} x2={cx + r * Math.cos(-PI / 6)} y2={cy - r * Math.sin(-PI / 6)} stroke={amber} strokeWidth={2} strokeDasharray="3 3" opacity={0.45} />}
      {!lengthQuestion && <line x1={cx} y1={cy} x2={cx + r * Math.cos(theta)} y2={cy - r * Math.sin(theta)} stroke={mode === 0 ? blue : amber} strokeWidth={4} strokeLinecap="round" />}
      <circle cx={cx} cy={cy} r={4} fill={slate} />

      {mode === 0 && <g>
        {anchoring ? <polyline data-circle="bending-stick" points={Array.from({ length: 33 }, (_, i) => {
          const u = i / 32;
          const t = span(anchorT, 0.15, 0.85);
          return `${lerp(cx + r * u, cx + r * Math.cos(u), t)},${lerp(cy, cy - r * Math.sin(u), t)}`;
        }).join(" ")} fill="none" stroke={amber} strokeWidth={6} strokeLinecap="round" /> : !hidden && <g data-circle="ribbon">
          <polyline points={arc(cx, cy, r, 0, theta)} fill="none" stroke={amber} strokeWidth={6} strokeLinecap="round" />
          {Array.from({ length: Math.floor(Math.max(0, theta)) }, (_, i) => i + 1).map((a) => <line key={a} x1={cx + (r - 5) * Math.cos(a)} y1={cy - (r - 5) * Math.sin(a)} x2={cx + (r + 5) * Math.cos(a)} y2={cy - (r + 5) * Math.sin(a)} stroke={amber} strokeWidth={2} />)}
          {labels && <Tag x={cx + (r + 18) * Math.cos(theta / 2)} y={cy - (r + 18) * Math.sin(theta / 2)} color={amber}>{`${formal ? "s = " : ""}${fmt(radius * theta)}`}</Tag>}
        </g>}
        {labels && <Tag x={cx + r * Math.cos(theta) / 2} y={cy - r * Math.sin(theta) / 2 - 10} color={blue}>{`${formal ? "r = " : ""}${fmt(radius)}`}</Tag>}
        {labels && !hidden && <g data-circle="endpoint-ticks">
          <Tag x={cx - r - 14} y={cy + 5} color={amber}>π</Tag>
          <Tag x={cx + r + 12} y={cy + 20} color={amber} size={12}>0</Tag>
          <Tag x={cx + 25} y={cy + 30} color={amber}>{`${formal ? "θ = " : ""}${fmt(theta)}`}</Tag>
        </g>}
        {review && <g data-circle="review-distance">
          <line x1={40} x2={300} y1={340} y2={340} stroke={amber} strokeWidth={5} strokeLinecap="round" />
          {labels && <Tag x={170} y={329} color={amber}>{`s = ${fmt(fixed.reviewDistance ?? 6)}`}</Tag>}
        </g>}
        {missed && <g data-circle="discrepancy">
          <polyline points={arc(cx, cy, r + 8, theta, target.theta ?? theta)} fill="none" {...discrepancy} />
          {target.answer !== undefined && <polyline points={arc(cx, cy, r + 8, 0, clamp(choice ?? 0, 0, TAU))} fill="none" {...discrepancy} />}
          <Tag x={cx} y={cy + r + 35} color={red}>{`Δ ${signed(verdict.delta)}`}</Tag>
        </g>}
      </g>}

      {showShadows && <g data-circle="shadows" key={`shadows-${pulse}`}>
        <line x1={px} x2={px} y1={cy} y2={py} stroke={slate} strokeWidth={1.5} strokeDasharray="3 3" />
        <line x1={cx} x2={px} y1={py} y2={py} stroke={slate} strokeWidth={1.5} strokeDasharray="3 3" />
        <Arrow x1={cx} y1={cy} x2={px} y2={cy} color={blue} width={5} head={10} />
        <Arrow x1={cx} y1={cy} x2={cx} y2={py} color={rose} width={5} head={10} />
        {labels && <g data-circle="projection-lengths">
          {/* With the squares drawn on the legs (mode 3), lengths ride the dashed copies of the legs, outside the squares. */}
          <Tag x={cx + (px - cx) / 2} y={mode === 3 ? py - 8 : tagY} color={blue}>{formal && mode !== 3 ? `${symbol(mode === 2 ? 2 : 0, "cos θ")} = ${fmt(x)}` : fmt(x)}</Tag>
          <Tag x={mode === 3 ? px + 8 : cx - 12} y={(cy + py) / 2 + 4} color={rose} anchor={mode === 3 ? "start" : "end"}>{formal && mode !== 3 ? `${symbol(1, "sin θ")} = ${fmt(y)}` : fmt(y)}</Tag>
        </g>}
      </g>}

      {mode === 1 && missed && <g data-circle="discrepancy">
        {/* Signed endpoint gaps, so equal magnitudes in the wrong quadrant still leave evidence. */}
        {target.answer === undefined ? <g>
          <line x1={px} y1={cy + 7} x2={cx + r * Math.cos(goalTheta)} y2={cy + 7} {...discrepancy} />
          <line x1={cx + 7} y1={cy - r * Math.sin(theta)} x2={cx + 7} y2={cy - r * Math.sin(goalTheta)} {...discrepancy} />
          <Tag x={cx + r * Math.cos(goalTheta)} y={cy + 43} color={red}>{`Δx ${signed(x - Math.cos(goalTheta))}`}</Tag>
          <Tag x={cx + 14} y={cy - r * Math.sin(goalTheta) - 10} color={red} anchor="start">{`Δy ${signed(Math.sin(theta) - Math.sin(goalTheta))}`}</Tag>
        </g> : <g>
          <line x1={cx + r * target.answer} y1={cy + 40} x2={cx + r * (choice ?? 0)} y2={cy + 40} {...discrepancy} />
          <Tag x={cx + r * (choice ?? 0) / 2} y={cy + 61} color={red}>{`Δx ${signed(verdict.delta)}`}</Tag>
        </g>}
      </g>}

      {mode === 2 && <g>
        <line x1={wallX} x2={wallX} y1={cy - r * reach} y2={cy + r * reach} stroke={slate} strokeWidth={3} />
        {!hidden && <g data-circle="wall-strike">
          {strike === null ? <g data-circle="parallel">
            <line x1={cx} x2={cx} y1={cy - r * reach} y2={cy + r * reach} stroke={amber} strokeWidth={3} />
            {labels && <Tag x={(cx + wallX) / 2} y={cy - r * (reach - 0.3)} color={slate}>∥</Tag>}
            {labels && <Tag x={wallX + 14} y={cy - r * (reach - 0.6)} color={green} anchor="start">∄</Tag>}
          </g> : <g>
            <line data-circle={Math.cos(theta) < 0 ? "backward-extension" : "forward-extension"} x1={cx} y1={cy} x2={cx + r * (fixed.wallX ?? 1) * Math.min(1, reach / Math.abs(strike))} y2={wallY} stroke={amber} strokeWidth={2} strokeDasharray={Math.cos(theta) < 0 ? "3 3" : undefined} />
            <Arrow x1={wallX} y1={cy} x2={wallX} y2={wallY} color={green} width={5} head={10} />
            <circle cx={wallX} cy={wallY} r={5} fill={green} />
            {Math.abs(strike) > reach && <g data-circle="offscreen"><Arrow x1={wallX} x2={wallX} y1={wallY + Math.sign(strike) * 18} y2={wallY} color={green} width={3} head={10} /></g>}
            {labels && <Tag x={wallX + 12} y={clamp(wallY + 5, 38, H - 28)} color={green} anchor="start">{`${formal ? "tan θ = " : ""}${fmt(strike)}`}</Tag>}
          </g>}
        </g>}
        {stage >= 3 && !guided && target.answer === undefined && <g data-circle="wall-goal">
          <line x1={wallX - 8} x2={wallX + 8} y1={cy - r * (wallStrike(goalTheta) ?? 0)} y2={cy - r * (wallStrike(goalTheta) ?? 0)} stroke={slate} strokeWidth={2} />
          {labels && target.answer === undefined && <Tag x={wallX + 15} y={cy - r * (wallStrike(goalTheta) ?? 0) - 9} color={slate} anchor="start">{fmt(wallStrike(goalTheta) ?? 0)}</Tag>}
        </g>}
        {missed && <g data-circle="discrepancy">
          <line x1={wallX + 6} x2={wallX + 6} y1={target.answer !== undefined ? cy - r * clamp(choice ?? 0, -reach, reach) : wallY} y2={cy - r * (wallStrike(goalTheta) ?? 0)} {...discrepancy} />
          <Tag x={wallX + 15} y={cy + 105} color={red} anchor="start">{`Δ ${signed(target.answer !== undefined ? verdict.delta : (strike ?? 0) - (wallStrike(goalTheta) ?? 0))}`}</Tag>
        </g>}
      </g>}

      {mode === 3 && <g>
        <rect data-circle="horizontal-square" x={Math.min(cx, px)} y={cy} width={r * Math.abs(x)} height={r * Math.abs(x)} fill={bandFill("blue", 25)} stroke={blue} strokeWidth={2} />
        {labels && <Tag x={(cx + px) / 2} y={cy + r * Math.abs(x) / 2 + 5} color={blue}>{fmt(xArea)}</Tag>}
        {formal && <Tag x={(cx + px) / 2} y={cy + r * Math.abs(x) + 20} color={blue}>{symbol(0, "cos²θ")}</Tag>}
        {!hidden && <g data-circle="vertical-square">
          <rect x={cx - r * Math.abs(y)} y={Math.min(cy, py)} width={r * Math.abs(y)} height={r * Math.abs(y)} fill={bandFill("rose", 25)} stroke={rose} strokeWidth={2} />
          {labels && <Tag x={cx - r * Math.abs(y) / 2} y={(cy + py) / 2 + 20} color={rose}>{fmt(yArea)}</Tag>}
          {formal && <Tag x={cx - r * Math.abs(y) - 10} y={(cy + py) / 2 + 8} color={rose} anchor="end">{symbol(1, "sin²θ")}</Tag>}
        </g>}
        <g data-circle="area-gauge">
          <rect x={gaugeX} y={gaugeY} width={gaugeW} height={gaugeH} fill="none" stroke={slate} strokeWidth={2} />
          <rect x={gaugeX} y={gaugeY} width={gaugeW * xArea} height={gaugeH} fill={bandFill("blue", 35)} />
          {!hidden && <rect x={gaugeX + gaugeW * xArea} y={gaugeY} width={gaugeW * Math.min(yArea, 1.12 - xArea)} height={gaugeH} fill={bandFill("rose", 35)} />}
          {labels && <Tag x={gaugeX + gaugeW - 10} y={gaugeY + 21} color={slate} anchor="end">1</Tag>}
        </g>
        {lengthQuestion && hidden && <g data-circle="missing-leg">
          <line x1={cx} x2={px} y1={cy} y2={cy} stroke={blue} strokeWidth={5} />
          {labels && <Tag x={cx - 14} y={cy - 35} color={rose}>?</Tag>}
        </g>}
        {missed && <g data-circle="discrepancy">
          <rect x={gaugeX + gaugeW * Math.min(xArea + yArea, 1)} y={gaugeY} width={Math.max(2, gaugeW * Math.abs(1 - xArea - yArea))} height={gaugeH} fill="none" {...discrepancy} />
          <line x1={px} x2={px} y1={py} y2={cy - r * (areaQuestion ? Math.sin(goalTheta) : target.answer ?? 0.8)} {...discrepancy} />
          <Tag x={gaugeX + gaugeW / 2} y={gaugeY - 12} color={red}>{`ΔA ${signed(xArea + yArea - 1)}`}</Tag>
          <Tag x={px + 12} y={cy - r * (target.answer ?? 0.8) - 10} color={red} anchor="start">{`${areaQuestion ? "Δy²" : "Δy"} ${signed(verdict.delta)}`}</Tag>
        </g>}
      </g>}

      {!lengthQuestion && <circle data-circle="bead" cx={cx + r * Math.cos(theta)} cy={cy - r * Math.sin(theta)} r={6} fill={amber} />}
      {lengthQuestion && !hidden && <circle data-circle="independent-leg" cx={px} cy={py} r={6} fill={rose} />}
      {labels && mode > 0 && !lengthQuestion && !hidden && <Tag x={cx + 30} y={cy + (mode === 3 ? 120 : 52)} color={amber}>{`${formal ? "θ = " : ""}${fmt(theta)}`}</Tag>}
      {board.can("theta") && !lengthQuestion && <g data-circle="angular-input">
        <DragArea cursor="grab" onDrag={(pt) => {
          const a = Math.atan2(cy - pt.y, pt.x - cx);
          board.set("theta", mode === 2 ? a : a < 0 ? a + TAU : a);
        }}><circle cx={cx} cy={cy} r={r} fill="none" stroke="transparent" strokeWidth={30} /></DragArea>
        <PlaneHandle x={cx + r * Math.cos(theta)} y={cy - r * Math.sin(theta)} color={amber} cursor="grab" onDrag={(pt) => {
          const a = Math.atan2(cy - pt.y, pt.x - cx);
          board.set("theta", mode === 2 ? a : a < 0 ? a + TAU : a);
        }} />
      </g>}
    </Svg>
  );
}

export const circleTrig: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3 && target.answer !== undefined) return {};
    return Object.fromEntries(spec.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
  },
  predictionControls,
  solve,
  evaluate,
  formatDelta: (verdict) => signed(verdict.delta),
};
