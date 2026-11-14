import { bandColor, bandFill, fmt, signed } from "../bands";
import { DirectionArrow, lineEnds, PlaneGrid, PlaneTicks, Svg, Tag, lerp, span, usePlane, type PlaneScale } from "./board-kit";
import { DragArea, PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values, Verdict } from "./types";

/**
 * When lines never meet: a fixed line y = m·x + b and a moving line y = m2·x + b2 cross once,
 * never (same steepness, different start) or everywhere (the same line).
 * Prediction: before the lines are drawn out, pick how many times they cross (0, 1 or endless).
 */

const W = 340;
const H = 420;
/** Choice value for "endless" (the lines coincide). */
export const ENDLESS = 2;
/** x positions where a constant gap is measured (clear of the up axis and its tick labels). */
const GAP_XS = [-3, 1, 3.5];
/** Where the Stage-4 expressions sit along their lines. */
const TAG_X = -3.5;
/** Stage 3 shows only the start of each line, up to this x. */
const STUB_X = 1.25;

export type Crossings = 0 | 1 | typeof ENDLESS;

export function crossings(m: number, b: number, m2: number, b2: number): Crossings {
  if (m !== m2) return 1;
  return b === b2 ? ENDLESS : 0;
}

type Kind = NonNullable<Verdict["kind"]>;

/** Name the mistake from what was picked against what is true. */
export function diagnose(picked: number, truth: Crossings): Kind | undefined {
  if (picked === truth) return undefined;
  if (truth === 0) return picked === 1 ? "alwaysOne" : "endless";
  if (truth === ENDLESS) return "sameLine";
  return "crosses";
}

function lines(stage: BoardProps["stage"], spec: BoardProps["spec"], values: Values, target: Values, anchorT: number) {
  if (stage === 1) {
    // Side by side first, then the moving rail tilts until the two cross at one peg.
    return { m: 2, b: 1, m2: lerp(2, 1, span(anchorT, 0.55, 0.9)), b2: 4 };
  }
  if (stage >= 3) {
    return { m: target.m ?? 2, b: target.b ?? 1, m2: target.m2 ?? 2, b2: target.b2 ?? 4 };
  }
  const fixed = spec.stage2Exploration.fixed ?? {};
  return { m: fixed.m ?? 2, b: fixed.b ?? 1, m2: values.m2 ?? 1, b2: values.b2 ?? 4 };
}

/** Clip a line to the board between two x values (for the Stage-3 stubs). */
function segment(s: PlaneScale, m: number, b: number, x0: number, x1: number) {
  return { x1: s.x(x0), y1: s.y(m * x0 + b), x2: s.x(x1), y2: s.y(m * x1 + b) };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 26, xMin: -5, xMax: 5, yMin: -8, yMax: 12 });
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const emerald = bandColor("emerald");
  const red = bandColor("red");
  const slate = bandColor("slate");

  const { m, b, m2, b2 } = lines(stage, spec, values, target, anchorT);
  const anchoring = stage === 1;
  const hidden = stage === 3 && verdict === null;
  const kind = crossings(m, b, m2, b2);
  const wrong = stage === 3 && verdict !== null && !verdict.correct;
  const pulse = changed && (changed.name === "m2" || changed.name === "b2") ? changed.tick : 0;
  const board = useBoardInput(input, values);

  const fixedLine = lineEnds(s, m, b);
  const movingLine = lineEnds(s, m2, b2);
  const xc = kind === 1 ? (b2 - b) / (m - m2) : 0;
  const yc = m * xc + b;
  const onBoard = kind === 1 && xc >= s.xMin && xc <= s.xMax && yc >= s.yMin && yc <= s.yMax;
  const gap = b2 - b;

  const label = hidden
    ? "Two lines start on the left edge; how many times will they cross?"
    : kind === 0
      ? "Two lines with the same steepness never meet"
      : kind === ENDLESS
        ? "The two lines lie on top of each other"
        : "The two lines cross once";

  return (
    <Svg anchoring={anchoring} width={W} height={H} label={label} gutter={{ left: RAIL_GUTTER }}>
      <PlaneGrid s={s} yStep={2} />

      {/* The same line twice: the whole shared line glows */}
      {!hidden && kind === ENDLESS && movingLine && (
        <line
          key={`same-${pulse}`}
          className="gb-pulse"
          {...movingLine}
          stroke={wrong ? bandFill("red", 45) : bandFill("emerald", 45)}
          strokeWidth={14}
          strokeLinecap="round"
          style={{ ["--sw" as string]: "14px" }}
        />
      )}

      {/* Anchoring: where the moving rail ran side by side before it tilted (also the reduced-motion frame) */}
      {anchoring && anchorT >= 0.55 && (() => {
        const was = lineEnds(s, 2, 4);
        return was && <line {...was} stroke={amber} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="6 6" strokeLinecap="round" />;
      })()}

      {hidden ? (
        <g>
          {/* Only where each line starts and which way it heads: the rest is the prediction */}
          <line {...segment(s, m, b, s.xMin, STUB_X)} stroke={blue} strokeWidth={4} strokeLinecap="round" />
          <line {...segment(s, m2, b2, s.xMin, STUB_X)} stroke={amber} strokeWidth={4} strokeLinecap="round" strokeDasharray={m === m2 && b === b2 ? "10 8" : undefined} />
          <line {...segment(s, m, b, STUB_X, STUB_X + 1)} stroke={blue} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
          <line {...segment(s, m2, b2, STUB_X, STUB_X + 1)} stroke={amber} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
          <Tag x={s.x(STUB_X) + 10} y={s.y(m * STUB_X + b) + (m * STUB_X + b <= m2 * STUB_X + b2 ? 16 : -8)} color={blue} anchor="start">
            {`steepness ${fmt(m)}`}
          </Tag>
          <Tag x={s.x(STUB_X) + 10} y={s.y(m2 * STUB_X + b2) + (m * STUB_X + b <= m2 * STUB_X + b2 ? -8 : 16)} color={amber} anchor="start">
            {`steepness ${fmt(m2)}`}
          </Tag>
        </g>
      ) : (
        <g className={stage === 3 ? "gb-snap" : undefined}>
          {fixedLine && <line {...fixedLine} stroke={blue} strokeWidth={4} strokeLinecap="round" />}
          <DirectionArrow s={s} m={m} c={b} color={blue} />
          {kind !== ENDLESS && <DirectionArrow s={s} m={m2} c={b2} color={amber} />}
          {movingLine && (
            <line
              key={`move-${pulse}`}
              className="gb-pulse"
              {...movingLine}
              stroke={amber}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={kind === ENDLESS ? "10 8" : undefined}
              style={{ ["--sw" as string]: "4px" }}
            />
          )}
        </g>
      )}

      {/* Start pegs on the up axis: where each line begins */}
      {!anchoring && (
        <g>
          <circle cx={s.x(0)} cy={s.y(b)} r={5} fill={blue} />
          {b2 !== b && <circle cx={s.x(0)} cy={s.y(b2)} r={5} fill={rose} />}
        </g>
      )}

      {/* No crossing: the gap measured at three spots never shrinks */}
      {!hidden && kind === 0 && (
        <g>
          {GAP_XS.map((gx) => {
            const y1 = m * gx + b;
            const y2 = m2 * gx + b2;
            if (Math.max(y1, y2) > s.yMax || Math.min(y1, y2) < s.yMin) return null;
            return (
              <g key={gx}>
                <line x1={s.x(gx)} x2={s.x(gx)} y1={s.y(y1)} y2={s.y(y2)} stroke={wrong ? red : rose} strokeWidth={3} strokeDasharray={wrong ? "6 4" : "4 4"} className={wrong ? "gb-march" : undefined} />
                {!anchoring && (
                  <Tag x={s.x(gx) + 8} y={s.y((y1 + y2) / 2) + 4} color={wrong ? red : rose} anchor="start" size={12}>
                    {fmt(Math.abs(gap))}
                  </Tag>
                )}
              </g>
            );
          })}
          {!anchoring && stage === 2 && (
            <Tag x={s.x(GAP_XS[1]!) - 10} y={s.y((m * GAP_XS[1]! + b + m2 * GAP_XS[1]! + b2) / 2) + 6} color={slate} anchor="end" size={18}>
              0
            </Tag>
          )}
        </g>
      )}

      {/* One crossing: a peg where they meet, with the count beside it */}
      {!hidden && kind === 1 && onBoard && (
        <g>
          {wrong && <circle cx={s.x(xc)} cy={s.y(yc)} r={15} fill="none" stroke={red} strokeWidth={3} />}
          <circle className="gb-snap" cx={s.x(xc)} cy={s.y(yc)} r={8} fill={emerald} />
          {!anchoring && (
            <Tag x={s.x(xc) + 14} y={s.y(yc) + 6} color={emerald} anchor="start" size={18}>
              {stage === 4 ? `(${fmt(xc)}, ${fmt(yc)})` : "1"}
            </Tag>
          )}
        </g>
      )}
      {!hidden && !anchoring && kind === 1 && !onBoard && (
        // The crossing is past the board's edge: point the count toward it.
        <Tag
          x={xc > s.xMax ? s.x(s.xMax) - 4 : s.x(s.xMin) + 4}
          y={s.y(clamp(m * clamp(xc, s.xMin, s.xMax) + b, s.yMin + 1, s.yMax - 1))}
          color={emerald}
          anchor={xc > s.xMax ? "end" : "start"}
          size={18}
        >
          {xc > s.xMax ? "1 →" : "← 1"}
        </Tag>
      )}

      {/* Endless: every point is shared */}
      {!hidden && !anchoring && kind === ENDLESS && (
        <Tag x={s.x(2.5) + 16} y={s.y(m * 2.5 + b) + 8} color={wrong ? red : emerald} anchor="start" size={20}>
          ∞
        </Tag>
      )}

      {/* Formalization: each line carries its own expression, the upper one above-left, the lower one below-right */}
      {stage === 4 &&
        [
          { m, b, color: blue },
          { m: m2, b: b2, color: amber },
        ]
          .filter((_, i) => i === 0 || kind !== ENDLESS)
          .map((l, i, all) => {
            const other = all[1 - i];
            const upper = !other || l.m * TAG_X + l.b >= other.m * TAG_X + other.b;
            return (
              <Tag
                key={i}
                x={s.x(TAG_X) + (upper ? -8 : 8)}
                y={s.y(l.m * TAG_X + l.b) + (upper ? -10 : 20)}
                color={l.color}
                anchor={upper ? "end" : "start"}
              >
                {`${fmt(l.m)}x ${l.b < 0 ? "−" : "+"} ${fmt(Math.abs(l.b))}`}
              </Tag>
            );
          })}

      {/* The committed answer, next to the board's own count */}
      {wrong && (
        <Tag x={W / 2} y={H - 6} color={red} size={14}>
          {`you picked ${countText(values.count)}`}
        </Tag>
      )}

      <PlaneTicks s={s} yStep={2} avoid={anchoring ? [] : [{ x: 0, y: b }, { x: 0, y: b2 }]} />
      <Rails input={input} values={values} bind={{ b2: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(0) } }} />

      {/* Direct manipulation: lift the moving line itself, or its start peg */}
      {board.can("b2") && movingLine && (
        <DragArea cursor="ns-resize" onDrag={(pt) => board.set("b2", s.fromY(pt.y) - m2 * s.fromX(pt.x))}>
          <line {...movingLine} stroke="transparent" strokeWidth={26} />
        </DragArea>
      )}
      {board.can("b2") && (
        <PlaneHandle x={s.x(0)} y={s.y(b2)} color={rose} cursor="ns-resize" onDrag={(pt) => board.set("b2", s.fromY(pt.y))} />
      )}
    </Svg>
  );
}

function countText(v: number | undefined) {
  return v === undefined ? "?" : v === ENDLESS ? "∞" : String(v);
}

function solve(target: Values): Values {
  return { count: crossings(target.m ?? 2, target.b ?? 1, target.m2 ?? 2, target.b2 ?? 4) };
}

export const linePair: InteractiveDefinition = {
  Board,
  axes: { b2: "y" },
  initialValues(spec, stage, target) {
    // Nothing is picked until the learner commits to a count.
    if (stage === 3) return {};
    if (stage === 4) return solve(target);
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls() {
    return [
      {
        variableName: "count",
        label: "Crossings",
        min: 0,
        max: ENDLESS,
        step: 1,
        colorToken: "slate",
        choices: [0, 1, ENDLESS],
        choiceLabels: { [ENDLESS]: "lesson.choice.endless" },
      },
    ];
  },
  solve,
  evaluate(values, target): Verdict {
    const truth = solve(target).count as Crossings;
    const picked = values.count ?? -1;
    const delta = picked - truth;
    const kind = diagnose(picked, truth);
    return kind ? { correct: false, delta, kind } : { correct: delta === 0, delta };
  },
  formatDelta(v) {
    return signed(v.delta);
  },
};
