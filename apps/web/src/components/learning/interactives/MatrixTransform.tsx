import { useId } from "react";
import type { ModuleSpec } from "@versado/core";
import { bandColor, bandFill, fmt, INK, SEAM } from "../bands";
import { Arrow, lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/**
 * A matrix is where the two unit arrows land; the whole grid (and anything drawn on it) follows.
 * M = [a b; c d]: the across arrow lands on (a, c), the up arrow on (b, d), and (x, y) ↦ x·(a, c) + y·(b, d).
 *
 * Two modules share the board, picked by the exposed controls:
 *  - "stretch": a and d alone (no lean) — reshape an F-shaped flag to fit an outline.
 *  - "columns": lean the up arrow (b, d); a dot keeps its recipe (x across arrows, y up arrows) and
 *    follows. The prediction hides the grid and asks where the dot lands for given arrows.
 */

const W = 340;
const H = 340;
const RANGE = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 } as const;

type Mode = "stretch" | "columns";
type P = { x: number; y: number };
type M = { a: number; b: number; c: number; d: number };

const IDENTITY: M = { a: 1, b: 0, c: 0, d: 1 };

/** An asymmetric flag (an F) so flips and swaps are visible. Unit coordinates, foot at the origin. */
const FLAG: P[] = [
  { x: 0, y: 0 },
  { x: 0.45, y: 0 },
  { x: 0.45, y: 0.9 },
  { x: 1.1, y: 0.9 },
  { x: 1.1, y: 1.3 },
  { x: 0.45, y: 1.3 },
  { x: 0.45, y: 1.6 },
  { x: 1.5, y: 1.6 },
  { x: 1.5, y: 2 },
  { x: 0, y: 2 },
];

export function modeOf(spec: ModuleSpec): Mode {
  return spec.stage2Exploration.controls.some((c) => c.variableName === "b") ? "columns" : "stretch";
}

export function apply(m: M, p: P): P {
  return { x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y };
}

function matrixOf(values: Values, base: Values): M {
  const pick = (k: keyof M) => values[k] ?? base[k] ?? IDENTITY[k];
  return { a: pick("a"), b: pick("b"), c: pick("c"), d: pick("d") };
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Stage-1 motion of the stretch module: wide, then tall, then flipped. */
function anchorStretch(t: number): M {
  const keys: [number, number][] = [
    [1, 1],
    [2.5, 1],
    [1, 2.2],
    [1.5, -1.2],
  ];
  // The first animation frame can report a timestamp before the start, so t may dip below 0.
  const u = Math.min(1, Math.max(0, t));
  const seg = Math.min(keys.length - 2, Math.floor(u * (keys.length - 1)));
  const local = smooth(u * (keys.length - 1) - seg);
  const [a0, d0] = keys[seg]!;
  const [a1, d1] = keys[seg + 1]!;
  return { a: lerp(a0, a1, local), b: 0, c: 0, d: lerp(d0, d1, local) };
}

/** The image of every grid line, clipped to the board by the caller. */
function WarpedGrid({ s, m, opacity = 1 }: { s: PlaneScale; m: M; opacity?: number }) {
  const lines: { p: P; q: P; key: string; axis: boolean }[] = [];
  // Extend past the board so sheared lines still reach its edges.
  const R = 12;
  for (let k = -R; k <= R; k++) {
    lines.push({ p: apply(m, { x: k, y: -R }), q: apply(m, { x: k, y: R }), key: `v${k}`, axis: k === 0 });
    lines.push({ p: apply(m, { x: -R, y: k }), q: apply(m, { x: R, y: k }), key: `h${k}`, axis: k === 0 });
  }
  return (
    <g aria-hidden opacity={opacity}>
      {lines.map(({ p, q, key, axis }) => (
        <line
          key={key}
          x1={s.x(p.x)}
          y1={s.y(p.y)}
          x2={s.x(q.x)}
          y2={s.y(q.y)}
          stroke={axis ? bandColor("violet") : SEAM}
          strokeWidth={axis ? 1.75 : 1}
          opacity={axis ? 0.55 : 0.9}
        />
      ))}
    </g>
  );
}

function flagPoints(s: PlaneScale, m: M) {
  return FLAG.map((p) => apply(m, p))
    .map((p) => `${s.x(p.x)},${s.y(p.y)}`)
    .join(" ");
}

/** Copies of the landed arrows laid end to end: x across arrows, then y up arrows, reaching the dot. */
function Recipe({ s, m, p, faded = false }: { s: PlaneScale; m: M; p: P; faded?: boolean }) {
  const steps: { from: P; to: P; color: string }[] = [];
  let at: P = { x: 0, y: 0 };
  const push = (n: number, v: P, color: string) => {
    const sign = Math.sign(n);
    for (let i = 0; i < Math.abs(n); i++) {
      const to = { x: at.x + sign * v.x, y: at.y + sign * v.y };
      steps.push({ from: at, to, color });
      at = to;
    }
  };
  push(Math.round(p.x), { x: m.a, y: m.c }, faded ? bandColor("slate") : bandColor("blue"));
  push(Math.round(p.y), { x: m.b, y: m.d }, faded ? bandColor("slate") : bandColor("amber"));
  return (
    <g opacity={faded ? 0.45 : 0.7}>
      {steps.map((st, i) => (
        <Arrow key={i} x1={s.x(st.from.x)} y1={s.y(st.from.y)} x2={s.x(st.to.x)} y2={s.y(st.to.y)} color={st.color} width={2.5} head={9} />
      ))}
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 26, ...RANGE });
  const clip = useId().replace(/:/g, "");
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const rose = bandColor("rose");
  const red = bandColor("red");
  const slate = bandColor("slate");
  const board = useBoardInput(input, values);
  const mode = modeOf(spec);
  const fixed = spec.stage2Exploration.fixed ?? {};

  const columnsPredict = mode === "columns" && stage === 3;
  const revealed = !columnsPredict || verdict !== null;
  // The matrix on the board: the learner's (stretch, exploring) or the given one (columns predict/formal).
  const shownMatrix: M =
    stage === 1
      ? mode === "stretch"
        ? anchorStretch(anchorT)
        : { a: 1, b: smooth(span(anchorT, 0.45, 1)), c: 0, d: 1 }
      : mode === "columns" && stage >= 3
        ? matrixOf(target, {})
        : matrixOf(values, fixed);
  const settle = stage !== 1 && guide == null;
  const [a, b, c, d] = useSettle([shownMatrix.a, shownMatrix.b, shownMatrix.c, shownMatrix.d], settle);
  const m: M = { a: a!, b: b!, c: c!, d: d! };
  const [mx, my] = useSettle([values.mx ?? 0, values.my ?? 0], settle) as [number, number];

  const formal = stage === 4;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";
  const morphing = guide != null && guide < 1;
  const iTip = { x: m.a, y: m.c };
  const jTip = { x: m.b, y: m.d };
  const rTipI = { x: shownMatrix.a, y: shownMatrix.c };
  const rTipJ = { x: shownMatrix.b, y: shownMatrix.d };

  // Columns: the dot's recipe (how many of each arrow), fixed while exploring, from the target otherwise.
  const recipe: P = stage === 2 || stage === 1 ? { x: fixed.px ?? 2, y: fixed.py ?? 1 } : { x: target.px ?? 0, y: target.py ?? 0 };
  const image = apply(m, recipe);
  const rImage = apply(shownMatrix, recipe);
  const anchorRecipe = stage === 1 ? span(anchorT, 0, 0.4) : 1;

  const label =
    mode === "stretch"
      ? `Across arrow lands at ${fmt(shownMatrix.a)}, up arrow at ${fmt(shownMatrix.d)}`
      : `Across arrow lands at (${fmt(shownMatrix.a)}, ${fmt(shownMatrix.c)}), up arrow at (${fmt(shownMatrix.b)}, ${fmt(shownMatrix.d)})`;

  const tipTag = (tip: P, real: P, color: string, sym: string) => {
    const right = tip.x >= 0;
    const text =
      mode === "stretch"
        ? formal
          ? `${sym} = ${fmt(sym === "a" ? real.x : real.y)}`
          : fmt(sym === "a" ? real.x : real.y)
        : formal
          ? sym === "a"
            ? "(a, c)"
            : "(b, d)"
          : `(${fmt(real.x)}, ${fmt(real.y)})`;
    return (
      <Tag x={s.x(tip.x) + (right ? 10 : -10)} y={s.y(tip.y) + (tip.y > 0 ? -10 : tip.y < 0 ? 20 : -10)} color={color} anchor={right ? "start" : "end"} size={12}>
        {text}
      </Tag>
    );
  };

  return (
    <Svg
      anchoring={stage === 1}
      width={W}
      height={H}
      label={label}
      gutter={stage === 1 ? undefined : { left: RAIL_GUTTER, bottom: RAIL_GUTTER }}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={s.x(s.xMin)} y={s.y(s.yMax)} width={s.x(s.xMax) - s.x(s.xMin)} height={s.y(s.yMin) - s.y(s.yMax)} />
        </clipPath>
      </defs>
      <PlaneGrid s={s} />

      <g clipPath={`url(#${clip})`}>
        {revealed && (
          <g key={pulse} className="gb-pulse">
            <WarpedGrid s={s} m={m} />
          </g>
        )}

        {mode === "stretch" && (
          <g>
            {/* The outline to fit: rose while predicting, red where it still misses */}
            {stage === 3 && (
              <polygon
                points={flagPoints(s, matrixOf(target, {}))}
                fill="none"
                stroke={missed ? red : rose}
                strokeWidth={2.5}
                strokeDasharray="6 5"
                className={missed ? "gb-march" : undefined}
              />
            )}
            <polygon points={flagPoints(s, m)} fill={bandFill("rose", 45)} stroke={rose} strokeWidth={2} strokeLinejoin="round" />
          </g>
        )}

        {mode === "columns" && (
          <g>
            {/* Before the reveal, the dot's recipe is shown on the untouched arrows, faded */}
            {!revealed && <Recipe s={s} m={IDENTITY} p={recipe} faded />}
            {!revealed && <circle cx={s.x(recipe.x)} cy={s.y(recipe.y)} r={5} fill={slate} />}
            {revealed && anchorRecipe > 0 && (
              <g opacity={anchorRecipe}>
                <Recipe s={s} m={m} p={recipe} />
              </g>
            )}
            {revealed && <circle className="gb-snap" cx={s.x(image.x)} cy={s.y(image.y)} r={7.5} fill={rose} />}
            {revealed && !morphing && stage !== 1 && (
              <Tag x={s.x(image.x) + 12} y={s.y(image.y) - 10} color={rose} anchor="start" size={12}>
                {formal ? "M·(x, y)" : `(${fmt(rImage.x)}, ${fmt(rImage.y)})`}
              </Tag>
            )}
          </g>
        )}
      </g>

      {/* The two unit arrows where they land */}
      <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(iTip.x)} y2={s.y(iTip.y)} color={blue} width={5} />
      <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(jTip.x)} y2={s.y(jTip.y)} color={amber} width={5} />
      {stage !== 1 && !morphing && tipTag(iTip, rTipI, blue, "a")}
      {stage !== 1 && !morphing && tipTag(jTip, rTipJ, amber, "d")}

      {/* Columns prediction: the learner's marker, and after a miss the gap to the true landing */}
      {columnsPredict && (
        <g>
          {missed && (
            <line x1={s.x(values.mx ?? 0)} y1={s.y(values.my ?? 0)} x2={s.x(image.x)} y2={s.y(image.y)} stroke={red} strokeWidth={2.5} strokeDasharray="5 4" className="gb-march" />
          )}
          <circle cx={s.x(mx)} cy={s.y(my)} r={11} fill="none" stroke={missed ? red : INK} strokeWidth={2.5} />
          <line x1={s.x(mx) - 6} x2={s.x(mx) + 6} y1={s.y(my)} y2={s.y(my)} stroke={missed ? red : INK} strokeWidth={2} />
          <line x1={s.x(mx)} x2={s.x(mx)} y1={s.y(my) - 6} y2={s.y(my) + 6} stroke={missed ? red : INK} strokeWidth={2} />
        </g>
      )}

      {stage !== 1 && <PlaneTicks s={s} avoid={[rTipI, rTipJ, ...(mode === "columns" ? [rImage, recipe] : [])]} />}
      <Rails
        input={input}
        values={values}
        bind={{
          a: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(0) },
          d: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(rTipJ.x) },
          b: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(rTipJ.y) },
          mx: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(values.my ?? 0) },
          my: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(values.mx ?? 0) },
        }}
      />
      {board.can("a") && (
        <PlaneHandle x={s.x(rTipI.x)} y={s.y(rTipI.y)} color={blue} cursor="ew-resize" onDrag={(pt) => board.set("a", s.fromX(pt.x))} />
      )}
      {(board.can("b") || board.can("d")) && (
        <PlaneHandle
          x={s.x(rTipJ.x)}
          y={s.y(rTipJ.y)}
          color={amber}
          cursor={board.can("b") && board.can("d") ? "move" : board.can("b") ? "ew-resize" : "ns-resize"}
          onDrag={(pt) => {
            board.set("b", s.fromX(pt.x));
            board.set("d", s.fromY(pt.y));
          }}
        />
      )}
      {(board.can("mx") || board.can("my")) && (
        <PlaneHandle
          x={s.x(values.mx ?? 0)}
          y={s.y(values.my ?? 0)}
          color={INK}
          onDrag={(pt) => {
            board.set("mx", s.fromX(pt.x));
            board.set("my", s.fromY(pt.y));
          }}
        />
      )}
    </Svg>
  );
}

function solve(target: Values, spec?: ModuleSpec): Values {
  if (spec && modeOf(spec) === "columns") {
    const p = apply(matrixOf(target, {}), { x: target.px ?? 0, y: target.py ?? 0 });
    return { mx: p.x, my: p.y };
  }
  return { a: target.a ?? 1, d: target.d ?? 1 };
}

export const matrixTransform: InteractiveDefinition = {
  Board,
  axes: { a: "x", d: "y", b: "x", mx: "x", my: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return { ...target, ...solve(target, spec) };
    if (stage === 3) return modeOf(spec) === "columns" ? { mx: 0, my: 0 } : { a: 1, d: 1 };
    const v: Values = { ...(spec.stage2Exploration.fixed ?? {}) };
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(spec) {
    if (modeOf(spec) === "columns") {
      return [
        { variableName: "mx", label: "Across", min: -5, max: 5, step: 1, colorToken: "rose" },
        { variableName: "my", label: "Up", min: -5, max: 5, step: 1, colorToken: "rose" },
      ];
    }
    return spec.stage2Exploration.controls.map((c) => ({
      variableName: c.variableName,
      label: c.label,
      min: c.min,
      max: c.max,
      step: c.step,
      colorToken: c.colorToken,
    }));
  },
  solve,
  evaluate(values, target, tolerance, spec) {
    const near = (x: number, y: number) => Math.abs(x - y) <= tolerance + 1e-9;
    if (spec && modeOf(spec) === "columns") {
      const goal = solve(target, spec);
      const mx = values.mx ?? 0;
      const my = values.my ?? 0;
      const is = (x: number, y: number) => near(mx, x) && near(my, y);
      const delta = Math.hypot(mx - goal.mx!, my - goal.my!);
      if (is(goal.mx!, goal.my!)) return { correct: true, delta: 0 };
      const p = { x: target.px ?? 0, y: target.py ?? 0 };
      if (is(p.x, p.y)) return { correct: false, delta, kind: "unmoved" };
      // Reading rows as arrows: the transpose sends the dot somewhere else.
      const t = matrixOf(target, {});
      const tr = apply({ a: t.a, b: t.c, c: t.b, d: t.d }, p);
      if (is(tr.x, tr.y)) return { correct: false, delta, kind: "transpose" };
      return { correct: false, delta };
    }
    const a = values.a ?? 1;
    const d = values.d ?? 1;
    const ta = target.a ?? 1;
    const td = target.d ?? 1;
    const delta = Math.abs(a - ta) + Math.abs(d - td);
    if (near(a, ta) && near(d, td)) return { correct: true, delta: 0 };
    if (ta !== td && near(a, td) && near(d, ta)) return { correct: false, delta, kind: "swap" };
    if (near(Math.abs(a), Math.abs(ta)) && near(Math.abs(d), Math.abs(td))) return { correct: false, delta, kind: "sign" };
    return { correct: false, delta };
  },
  formatDelta(v) {
    return `${fmt(v.delta)} off`;
  },
};
