import { bandColor, bandFill, GROUND, INK, MUTE, signed } from "../bands";
import { Lattice, lerp, span, Svg, Tag } from "./board-kit";
import type { BoardProps, InteractiveDefinition, Values, Verdict } from "./types";

/**
 * Completing the square: x² plus a strip of width b. The strip splits into two halves of b/2
 * that wrap two edges of the square, leaving one empty corner, a square of side b/2.
 * x is an unknown, so it is drawn as a fixed length and never given a number.
 */

const U = 21;
/** The unknown side x, in pegs. Long enough that even b/2 = 5 reads as "shorter than x". */
const X = 6;
/**
 * Stages 1–2 share one board sized for their widest layout (x beside the whole anchoring strip of 6,
 * or x + b/2 = 11 when wrapped) so it never resizes while exploring. From the prediction on, the
 * board crops to the question's own figure; k keeps labels and strokes the same size on screen.
 */
const COLS = X + 6;
const ROWS = X + 5 + 2;
const OX = 40;
const OY = 34;
const W = OX + COLS * U + 30;
const H = OY + ROWS * U + 40;
/** b used by the silent Stage-1 anchoring. */
const ANCHOR_B = 6;

type Kind = "whole" | "linear" | "half";

function Board({ stage, values, target, verdict, anchorT, changed }: BoardProps) {
  const b = stage === 3 || stage === 4 ? (target.b ?? 2) : stage === 1 ? ANCHOR_B : (values.b ?? 2);
  const h = b / 2;
  const XS = X * U;
  const HS = h * U;
  const amber = bandColor("amber");
  const emerald = bandColor("emerald");
  const red = bandColor("red");
  const tick = changed?.name === "b" ? changed.tick : 0;
  // Prediction and formalization: crop to this b's figure (whole strip, wrapped square and the
  // largest wrong tile, b by b, all fit), fixed for the question so the reveal never zooms.
  const fit = stage >= 3;
  const box = fit ? { x: OX - 1.5 * U, y: OY - 1.5 * U, w: (X + b + 3) * U, h: (X + b + 4.5) * U } : undefined;
  const k = box ? box.w / W : 1;

  // Stage 1: the whole strip sits beside the square, splits, and its second half swings below.
  const tSplit = stage === 1 ? span(anchorT, 0.25, 0.5) : 1;
  const tWrap = stage === 1 ? span(anchorT, 0.5, 0.85) : 1;
  const tGap = stage === 1 ? span(anchorT, 0.85, 1) : 1;
  const revealed = stage === 3 && verdict !== null;
  // The prediction shows only x² and the whole strip: halving it is the learner's step.
  // On the reveal the strip splits and wraps (gb-snap animates the move).
  const whole = (stage === 1 && tSplit === 0) || (stage === 3 && !revealed);
  const split = stage === 1 ? tSplit * 6 : 0; // a small gap opens between the halves before they part

  const right = { x: OX + XS, y: OY, w: HS, h: XS };
  const besideSecond = { x: OX + XS + HS + split, y: OY, w: HS, h: XS };
  const below = { x: OX, y: OY + XS, w: XS, h: HS };
  const second =
    stage === 1
      ? {
          x: lerp(besideSecond.x, below.x, tWrap),
          y: lerp(besideSecond.y, below.y, tWrap),
          w: lerp(besideSecond.w, below.w, tWrap),
          h: lerp(besideSecond.h, below.h, tWrap),
        }
      : whole
        ? besideSecond
        : below;
  const corner = { x: OX + XS, y: OY + XS, s: HS };

  const truth = h * h;
  const picked = values.corner;
  const filled = stage === 4 || (revealed && verdict!.correct);
  // A wrong tile is drawn at the corner at the size the answer implies: b² as a b-by-b square,
  // anything else as a strip b/2 wide, so the learner sees it overflow or fall short.
  const miss =
    revealed && !verdict!.correct && picked !== undefined
      ? picked === b * b
        ? { w: b * U, h: b * U }
        : { w: HS, h: (picked / h) * U }
      : null;
  const snap = stage === 1 ? undefined : "gb-snap";

  return (
    <Svg anchoring={stage === 1} width={W} height={H} box={box} label={`Square of side x with a strip of ${b}`}>
      {fit ? (
        <Lattice cols={X + b + 1} rows={X + b + 2} unit={U} ox={OX - U} oy={OY - U} r={1.6 * k} />
      ) : (
        <Lattice cols={COLS} rows={ROWS} unit={U} ox={OX} oy={OY} />
      )}

      {/* x²: opaque, so the lattice can't be counted through it — x is an unknown, not 6 */}
      <rect x={OX} y={OY} width={XS} height={XS} fill={GROUND} />
      <rect x={OX} y={OY} width={XS} height={XS} fill={bandFill("blue", 26)} stroke={bandColor("blue")} strokeWidth={2 * k} />

      {/* The two strip halves; while the strip is whole they carry no seam between them */}
      {[right, second].map((r, i) => (
        <g key={`half-${i}-${tick}`}>
          <rect className={snap} x={r.x} y={r.y} width={r.w} height={r.h} fill={GROUND} />
          <rect
            className={stage === 1 || whole ? snap : "gb-snap gb-pulse"}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={bandFill("amber", 30)}
            stroke={whole ? "none" : amber}
            strokeWidth={2 * k}
            style={{ ["--sw" as string]: "2px" }}
          />
        </g>
      ))}
      {whole && (
        <g>
          <rect x={right.x} y={right.y} width={2 * HS} height={XS} fill={GROUND} />
          <rect x={right.x} y={right.y} width={2 * HS} height={XS} fill={bandFill("amber", 30)} stroke={amber} strokeWidth={2 * k} />
        </g>
      )}

      {/* The corner: empty and dashed until it is filled */}
      {!whole && tGap > 0 && (
        <rect
          key={`corner-${tick}`}
          className={stage === 1 ? undefined : "gb-snap gb-pulse"}
          x={corner.x}
          y={corner.y}
          width={corner.s}
          height={corner.s}
          fill={filled ? bandFill("emerald", 40) : "none"}
          stroke={emerald}
          strokeWidth={2 * k}
          strokeDasharray={filled ? undefined : `${5 * k} ${4 * k}`}
          opacity={stage === 1 ? tGap : 1}
          style={{ ["--sw" as string]: "2px" }}
        />
      )}

      {/* The learner's tile, where it misses */}
      {miss && (
        <rect
          className="gb-march"
          x={corner.x}
          y={corner.y}
          width={miss.w}
          height={miss.h}
          fill={bandFill("red", 14)}
          stroke={red}
          strokeWidth={2.5 * k}
          strokeDasharray={`${6 * k} ${4 * k}`}
        />
      )}

      {/* Labels on the edges they measure (hidden in Stage 1 by .gb-anchoring) */}
      <Tag x={OX + XS / 2} y={OY - 10 * k} color={bandColor("blue")} k={k}>
        x
      </Tag>
      <Tag x={OX - 10 * k} y={OY + XS / 2 + 5 * k} color={bandColor("blue")} anchor="end" k={k}>
        x
      </Tag>
      {whole ? (
        <Tag x={OX + XS + HS} y={OY - 10 * k} color={amber} k={k}>
          {b}
        </Tag>
      ) : (
        <>
          <Tag x={OX + XS + HS / 2} y={OY - 10 * k} color={amber} k={k}>
            {h}
          </Tag>
          <Tag x={OX - 10 * k} y={OY + XS + HS / 2 + 5 * k} color={amber} anchor="end" k={k}>
            {h}
          </Tag>
        </>
      )}

      {/* The corner's own side, on its outer edges, once it is in place */}
      {stage !== 1 && !whole && (
        <>
          <Tag x={corner.x + corner.s / 2} y={corner.y + corner.s + 18 * k} color={emerald} size={12} k={k}>
            {h}
          </Tag>
          <Tag x={corner.x + corner.s + 8 * k} y={corner.y + corner.s / 2 + 4 * k} color={emerald} anchor="start" size={12} k={k}>
            {h}
          </Tag>
        </>
      )}

      {/* Areas inside the pieces are notation: they arrive with the formalization (Stage 4) */}
      {stage === 4 && (
        <Tag x={OX + XS / 2} y={OY + XS / 2 + 6 * k} color={bandColor("blue")} size={16} k={k}>
          x²
        </Tag>
      )}
      {stage === 4 && HS >= 2 * U && (
        <>
          <Tag x={OX + XS + HS / 2} y={OY + XS / 2 + 5 * k} color={amber} size={13} k={k}>
            {`${h}x`}
          </Tag>
          <Tag x={OX + XS / 2} y={OY + XS + HS / 2 + 5 * k} color={amber} size={13} k={k}>
            {`${h}x`}
          </Tag>
        </>
      )}
      {(revealed || stage === 4) && (
        <Tag
          x={corner.x + corner.s / 2}
          y={corner.y + corner.s / 2 + 5 * k}
          color={filled ? (stage === 4 ? emerald : INK) : revealed ? red : MUTE}
          size={HS >= 2 * U ? 15 : 12}
          k={k}
        >
          {filled ? truth : "?"}
        </Tag>
      )}

      {stage === 3 && (
        <Tag
          x={OX + (XS + HS) / 2}
          y={OY + XS + (whole ? 0 : Math.max(HS + 18 * k, miss?.h ?? 0)) + 34 * k}
          color={verdict && !verdict.correct ? red : MUTE}
          size={14}
          k={k}
        >
          {verdict === null
            ? `your tile: ${picked ?? "?"}`
            : verdict.correct
              ? `${h} × ${h} = ${truth}`
              : `${picked} → ${truth}  (${signed(verdict.delta)})`}
        </Tag>
      )}
    </Svg>
  );
}

function solve(target: Values): Values {
  const b = target.b ?? 2;
  return { b, corner: (b / 2) ** 2 };
}

/**
 * The four tiles for "which tile completes the square?": the true (b/2)² and the named
 * misconceptions b² (the whole b squared), b (the strip's width as an area) and b/2 (the side,
 * not squared). Duplicates (small b) are replaced by near values; shown in ascending order so
 * position gives nothing away.
 */
export function cornerChoices(b: number): number[] {
  const h = b / 2;
  const truth = h * h;
  const out = [truth];
  for (const c of [b * b, b, h, truth + 1, truth + 2, truth + 3]) if (c > 0 && !out.includes(c) && out.length < 4) out.push(c);
  return out.sort((x, y) => x - y);
}

function diagnose(picked: number, b: number): Kind | undefined {
  if (picked === b * b) return "whole";
  if (picked === b) return "linear";
  if (picked === b / 2) return "half";
  return undefined;
}

export const completeSquare: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target) {
    // Nothing is picked until the learner commits to a tile.
    if (stage === 3) return { b: target.b ?? 2 };
    if (stage === 4) return solve(target);
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(_spec, target) {
    const choices = cornerChoices(target.b ?? 2);
    return [
      {
        variableName: "corner",
        label: "Corner tile",
        min: choices[0]!,
        max: choices[choices.length - 1]!,
        step: 1,
        // Neutral: a picked (possibly wrong) answer must not look like the correct emerald corner.
        colorToken: "slate",
        choices,
      },
    ];
  },
  solve,
  evaluate(values, target): Verdict {
    const b = target.b ?? 2;
    const picked = values.corner ?? 0;
    const delta = picked - solve(target).corner!;
    if (delta === 0) return { correct: true, delta };
    const kind = diagnose(picked, b);
    return kind ? { correct: false, delta, kind } : { correct: false, delta };
  },
  formatDelta(v) {
    return signed(v.delta);
  },
};
