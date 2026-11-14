import { bandColor, bandFill, clamp, fmt, PEG, SEAM, signed, type BandToken } from "../bands";
import { Arrow, Lattice, lerp, span, Svg, Tag, useSettle } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, ControlDef, InteractiveDefinition, Values, Verdict } from "./types";

/** Fixed-base ribbon: equal steps multiply, backward steps divide, half steps use √2. */
const W = 360;
const H = 300;
const LEFT = 32;
const UNIT = 36;
const RIBBON_Y = 104;
const THICKNESS = 32;
const TRACK_Y = 260;
const atStep = (x: number) => 68 + (x + 3) * 44;
const fromStep = (x: number) => (x - 68) / 44 - 3;
const endAt = (length: number) => LEFT + clamp(length, -2, 8) * UNIT;
const lengthOf = (x: number) => 2 ** x;
const halfStep = (x: number) => Math.abs(x - Math.floor(x) - 0.5) < 1e-6;

function lengthText(length: number) {
  return Number.isInteger(Math.log2(length)) && length < 1 ? `1/${Math.round(1 / length)}` : fmt(length);
}

function solve(target: Values): Values {
  const exponent_x = target.exponent_x ?? 0;
  return "answer" in target ? { exponent_x, answer: lengthOf(exponent_x) } : { exponent_x };
}

function evaluate(values: Values, target: Values, tolerance: number): Verdict {
  const choice = "answer" in target;
  const expected = choice ? lengthOf(target.exponent_x ?? 0) : target.exponent_x ?? 0;
  const picked = choice ? values.answer : values.exponent_x;
  if (picked === undefined || !Number.isFinite(picked)) return { correct: false, delta: 0 };
  const delta = picked - expected;
  if (Math.abs(delta) <= tolerance + 1e-9) return { correct: true, delta: 0 };
  if (choice) {
    if (picked < 0) return { correct: false, delta, kind: "negativeValue" };
    if (Math.abs(picked - lengthOf(-(target.exponent_x ?? 0))) < 1e-6) return { correct: false, delta, kind: "forward" };
    if (Math.abs(picked - (1 + (target.exponent_x ?? 0))) < 1e-6) return { correct: false, delta, kind: "additive" };
  } else {
    if (picked * expected < 0) return { correct: false, delta, kind: "forward" };
    const midpoint = (lengthOf(Math.floor(expected)) + lengthOf(Math.ceil(expected))) / 2;
    if ((halfStep(expected) && Math.abs(lengthOf(picked) - midpoint) < 0.02) || Math.abs(picked - (lengthOf(expected) - 1)) < 1e-6) {
      return { correct: false, delta, kind: "additive" };
    }
  }
  return { correct: false, delta };
}

/** Each ghost uses the same physical length scale as the live ribbon. */
function Ribbon({ length, y, token, ghost = false, labels = true, pulse = 0 }: {
  length: number; y: number; token: BandToken; ghost?: boolean; labels?: boolean; pulse?: number;
}) {
  const width = length * UNIT;
  return (
    <g data-exponent-ribbon={ghost ? "ghost" : "length"}>
      <rect key={pulse} x={LEFT} y={y} width={width} height={THICKNESS} rx={3}
        fill={bandFill(token, ghost ? 8 : 25)} stroke={bandColor(token)} strokeWidth={ghost ? 1.5 : 3}
        strokeDasharray={ghost ? "4 5" : undefined} className={ghost ? undefined : "gb-pulse"}
        style={{ ["--sw" as string]: "3px" }} />
      {/* Whole copies and half-fold creases remain visible inside the ribbon. */}
      {Array.from({ length: Math.max(0, Math.ceil(length) - 1) }, (_, i) => (
        <line key={i} x1={LEFT + (i + 1) * UNIT} x2={LEFT + (i + 1) * UNIT} y1={y + 3} y2={y + THICKNESS - 3}
          stroke={bandColor(token)} strokeWidth={1} opacity={0.5} />
      ))}
      {labels && <Tag x={width >= 60 ? LEFT + width / 2 : LEFT + width + 9} y={y + 21}
        anchor={width >= 60 ? "middle" : "start"} color={bandColor(token)}>{lengthText(length)}</Tag>}
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const anchoring = stage === 1;
  const guided = guide != null;
  const hidden = stage === 3 && verdict === null && !guided;
  const morphing = guided && guide < 1;
  const choice = "answer" in target;
  const wrong = stage === 3 && verdict !== null && !verdict.correct && !guided;
  const rose = bandColor("rose");
  const amber = bandColor("amber");
  const red = bandColor("red");
  // Final anchor frame keeps both a copied and a folded ribbon: useful without motion, too.
  const anchorX = anchorT < 0.4 ? lerp(0, 2, span(anchorT, 0.05, 0.35)) : lerp(2, -2, span(anchorT, 0.45, 0.92));
  const exactX = anchoring ? anchorX : stage === 4 ? target.exponent_x ?? -2 : guided
    ? lerp(0, target.exponent_x ?? -1, span(guide, 0.08, 0.9))
    : choice ? target.exponent_x ?? -1 : values.exponent_x ?? 0;
  const [shownX = exactX] = useSettle([hidden ? 0 : exactX], !anchoring && !guided && !hidden);
  const x = clamp(shownX, -3, 3);
  const length = lengthOf(x);
  const exactLength = lengthOf(exactX);
  const token: BandToken = halfStep(exactX) ? "amber" : exactX <= 0 ? "rose" : "blue";
  const labels = !anchoring && !morphing;
  const boardInput = anchoring || guided || stage === 4 ? undefined : input;
  const board = useBoardInput(boardInput, values);
  const pulse = changed?.name === "exponent_x" ? changed.tick : 0;
  const expectedX = target.exponent_x ?? -2;
  const expectedLength = lengthOf(expectedX);
  const desiredLength = expectedLength;
  const pickedLength = choice ? values.answer : lengthOf(values.exponent_x ?? 0);
  const discrepancy = Number.isFinite(pickedLength) ? (pickedLength ?? 0) - desiredLength : 0;
  const lowerX = Math.floor(x);
  const upperX = Math.ceil(x);
  const fractional = halfStep(exactX) && stage !== 4;
  const firstLength = anchoring ? 4 : fractional ? lengthOf(lowerX) : 1;
  const lastLength = fractional ? lengthOf(upperX) : stage === 4 ? Math.SQRT2 : lengthOf(Math.max(-3, Math.min(3, Math.round(exactX))));

  return (
    <Svg width={W} height={H} anchoring={anchoring} label={spec.stage1Anchoring.visualMetaphor}
      gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}>
      <Lattice cols={11} rows={7} unit={28} ox={24} oy={26} />
      <line x1={20} x2={340} y1={224} y2={224} stroke={SEAM} strokeWidth={1.5} />

      {/* A neutral starting strip is the only visible length before a prediction. */}
      {hidden ? (
        <g data-exponent-ribbon="hidden">
          <Ribbon length={1} y={RIBBON_Y} token="slate" />
          <Tag x={150} y={RIBBON_Y + 21} color={bandColor("slate")} anchor="start">
            {choice ? "?" : `? → ${lengthText(expectedLength)}`}
          </Tag>
        </g>
      ) : (
        <g data-exponent-ribbon="revealed">
          <Ribbon length={firstLength} y={40} token={anchoring ? "blue" : fractional ? "amber" : "slate"} ghost labels={labels} />
          <Ribbon length={length} y={RIBBON_Y} token={token} labels={false} pulse={pulse} />
          {labels && <Tag x={length * UNIT >= 60 ? LEFT + length * UNIT / 2 : endAt(length) + 9} y={RIBBON_Y + 21}
            anchor={length * UNIT >= 60 ? "middle" : "start"} color={bandColor(token)}>{lengthText(exactLength)}</Tag>}
          {exactX < 0 && !fractional && Array.from({ length: Math.ceil(-exactX) }, (_, i) => (
            <line key={i} x1={endAt(2 ** -(i + 1))} x2={endAt(2 ** -(i + 1))} y1={43} y2={69} stroke={rose} strokeDasharray="3 3" />
          ))}
          <Arrow x1={endAt(firstLength)} y1={76} x2={endAt(length)} y2={98} color={bandColor(token)} width={2} head={8} opacity={0.7} />
          {(fractional || stage === 4 || anchoring || guided) && (
            <g data-exponent-ribbon={fractional ? "geometric-mean" : "comparison"}>
              <Ribbon length={lastLength} y={168} token={stage === 4 || fractional ? "amber" : "rose"} ghost labels={labels && stage !== 4} />
              {stage !== 4 && <Arrow x1={endAt(length)} y1={142} x2={endAt(lastLength)} y2={162} color={fractional ? amber : rose} width={2} head={8} opacity={0.7} />}
              {fractional && labels && <>
                <Tag x={Math.min(290, Math.max(LEFT + 70, endAt(length) + 18))} y={91} color={amber} anchor="start">×1.41</Tag>
                <Tag x={Math.min(290, Math.max(LEFT + 70, endAt(lastLength) + 18))} y={156} color={amber} anchor="start">×1.41</Tag>
              </>}
            </g>
          )}
          {stage === 4 && <>
            <Tag x={Math.max(120, endAt(length) + 10)} y={RIBBON_Y + 21} color={rose} anchor="start">b⁻ˣ = 1/bˣ</Tag>
            <line x1={endAt(1)} x2={endAt(1)} y1={171} y2={197} stroke={amber} strokeDasharray="3 3" />
            <Tag x={endAt(Math.SQRT2) + 12} y={190} color={amber} anchor="start">√b = √2 ≈ 1.41</Tag>
          </>}
        </g>
      )}

      {wrong && Number.isFinite(pickedLength) && (
        <g data-exponent-ribbon="discrepancy">
          {!choice && !fractional && <Ribbon length={desiredLength} y={168} token="rose" ghost />}
          {/* A negative proposed length points behind the start, while the real strip stays positive. */}
          <rect x={Math.min(LEFT, endAt(pickedLength!))} y={RIBBON_Y - 5}
            width={Math.max(1, Math.abs(endAt(pickedLength!) - LEFT))} height={THICKNESS + 10} rx={3}
            fill="none" stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
          <line x1={endAt(desiredLength)} x2={endAt(pickedLength!)} y1={150} y2={150}
            stroke={red} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
          <Tag x={clamp((endAt(pickedLength!) + endAt(desiredLength)) / 2, 48, 290)} y={155} color={red}>
            {signed(discrepancy)}
          </Tag>
          {choice && <Tag x={clamp(endAt(pickedLength!) + 9, -34, 300)} y={RIBBON_Y - 12} color={red} anchor="start">{fmt(pickedLength!)}</Tag>}
          {!choice && <>
            <circle cx={atStep(expectedX)} cy={TRACK_Y} r={13} fill="none" stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
            <line x1={atStep(values.exponent_x ?? 0)} x2={atStep(expectedX)} y1={TRACK_Y - 16} y2={TRACK_Y - 16}
              stroke={red} strokeWidth={2.5} strokeDasharray="6 4" className="gb-march" />
          </>}
        </g>
      )}

      <g data-exponent-ribbon="track">
        <line x1={atStep(-3)} x2={atStep(3)} y1={TRACK_Y} y2={TRACK_Y} stroke={SEAM} strokeWidth={4} strokeLinecap="round" />
        {Array.from({ length: 13 }, (_, i) => i / 2 - 3).map((step) => (
          <g key={step}>
            <circle cx={atStep(step)} cy={TRACK_Y} r={Number.isInteger(step) ? 3.5 : 2} fill={PEG} />
            {labels && Number.isInteger(step) && <Tag x={atStep(step)} y={TRACK_Y + 27} color={step === 0 ? bandColor("slate") : rose} size={11}>{step}</Tag>}
          </g>
        ))}
        <circle cx={atStep(exactX)} cy={TRACK_Y} r={7} fill={rose} />
        {labels && <Tag x={atStep(exactX)} y={TRACK_Y - 21} color={rose}>{fmt(exactX)}</Tag>}
      </g>
      {board.can("exponent_x") && <PlaneHandle x={atStep(exactX)} y={TRACK_Y} color={rose} cursor="ew-resize"
        onDrag={(pt) => board.set("exponent_x", fromStep(pt.x))} />}
      <Rails input={boardInput} values={values} bind={{ exponent_x: {
        axis: "x", at: atStep, cross: H + RAIL_CROSS, reach: TRACK_Y,
      } }} />
    </Svg>
  );
}

export const exponentRibbon: InteractiveDefinition = {
  Board,
  axes: { exponent_x: "x" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3) return { exponent_x: 0 };
    const initial: Values = { ...spec.stage2Exploration.fixed };
    for (const c of spec.stage2Exploration.controls) initial[c.variableName] = c.initial;
    return initial;
  },
  predictionControls(spec, target) {
    const controls: ControlDef[] = spec.stage2Exploration.controls.map(({ variableName, label, min, max, step, colorToken }) => ({
      variableName, label, min, max, step, colorToken,
    }));
    if ("answer" in target) controls.push({
      variableName: "answer", label: "?", min: -2, max: 2, step: 0.5, colorToken: "slate", choices: [-2, 0, 0.5, 2],
    });
    return controls;
  },
  solve,
  evaluate,
  formatDelta: (verdict) => signed(verdict.delta),
};
