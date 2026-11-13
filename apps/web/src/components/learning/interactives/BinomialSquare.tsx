import { bandColor, bandFill, INK, MUTE, signed } from "../bands";
import { Lattice, Svg, Tag } from "./board-kit";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/** (a + b)²: one square, two cuts, four pieces. */

const U = 21;
const MAX = 13;
const OX = 46;
const OY = 34;
const W = OX + MAX * U + 22;

function Board({ stage, values, target, verdict, anchorT, changed }: BoardProps) {
  const a = stage === 3 ? (target.a ?? 1) : stage === 1 ? 5 : (values.a ?? 1);
  const b = stage === 3 ? (target.b ?? 1) : stage === 1 ? 3 : (values.b ?? 1);
  const gap = stage === 1 ? Math.sin(Math.PI * Math.min(1, anchorT * 1.25)) * 16 : 0;
  const hidden = stage === 3 && verdict === null;
  // Which strips the answer left out: a² + b² skips both, a² + ab + b² skips one.
  const total = values.total;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const skipped = !missed ? 0 : total === a * a + b * b ? 2 : total === a * a + a * b + b * b ? 1 : 0;
  const isMissed = (id: string) => (skipped === 2 && (id === "ab1" || id === "ab2")) || (skipped === 1 && id === "ab2");

  const blue = bandColor("blue");
  const emerald = bandColor("emerald");
  const red = bandColor("red");
  // The plane only needs to hold the square plus room for the readout below it.
  const rows = stage >= 3 ? Math.min(MAX, a + b + 1) : MAX;
  const H = OY + rows * U + 52;
  // Once the square is fixed (prediction, formalization) the board crops to the figure so it is
  // the hero of the scene; k keeps labels and strokes at the same on-screen size.
  const fit = stage >= 3;
  const n = a + b;
  const m = Math.max(1, Math.round((n / 0.66 - n) / 2)); // whole-peg margin on every side
  const span = (n + 2 * m + 1) * U; // half a peg of air beyond the outer pegs
  const k = fit ? span / W : 1;
  const box = fit
    ? { x: OX - m * U - U / 2, y: OY - m * U - U / 2, w: span, h: span + U }
    : undefined;
  const tick = (name: string) => (changed?.name === name ? changed.tick : 0);

  const A = a * U;
  const B = b * U;
  const pieces = [
    { id: "aa", x: OX, y: OY, w: A, h: A, token: "blue" as const, area: a * a, sym: "a²", pulse: tick("a") },
    { id: "ab1", x: OX + A + gap, y: OY, w: B, h: A, token: "amber" as const, area: a * b, sym: "ab", pulse: tick("a") + tick("b") },
    { id: "ab2", x: OX, y: OY + A + gap, w: A, h: B, token: "amber" as const, area: a * b, sym: "ab", pulse: tick("a") + tick("b") },
    { id: "bb", x: OX + A + gap, y: OY + A + gap, w: B, h: B, token: "emerald" as const, area: b * b, sym: "b²", pulse: tick("b") },
  ];

  return (
    <Svg anchoring={stage === 1} width={W} height={H} box={box} label={`Square of side ${a} plus ${b}`}>
      {fit ? (
        <Lattice cols={n + 2 * m} rows={n + 2 * m + 1} unit={U} ox={OX - m * U} oy={OY - m * U} r={1.6 * k} />
      ) : (
        <Lattice cols={MAX} rows={rows} unit={U} ox={OX} oy={OY} />
      )}

      {pieces.map((p) => {
        const strip = isMissed(p.id);
        return (
          <g key={p.id}>
            <rect
              key={`${p.id}-${p.pulse}`}
              className="gb-snap gb-pulse"
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={bandFill(p.token, strip ? 45 : 26)}
              stroke={strip ? red : bandColor(p.token)}
              strokeWidth={(strip ? 3 : 2) * k}
              strokeDasharray={strip ? `${7 * k} ${4 * k}` : undefined}
              style={{ ["--sw" as string]: "2px" }}
            />
            {Math.min(p.w, p.h) >= 26 && (
              <Tag
                x={p.x + p.w / 2}
                y={p.y + p.h / 2 + 5 * k}
                color={stage === 4 ? bandColor(p.token) : INK}
                size={Math.min(p.w, p.h) / k >= 60 ? 16 : 12}
                k={k}
              >
                {hidden ? "?" : stage === 4 ? `${p.sym} = ${p.area}` : p.area}
              </Tag>
            )}
          </g>
        );
      })}

      {/* Side lengths sit on the edges they measure */}
      <Tag x={OX + A / 2} y={OY - 10 * k} color={blue} k={k}>
        {stage === 4 ? `a = ${a}` : a}
      </Tag>
      <Tag x={OX + A + gap + B / 2} y={OY - 10 * k} color={emerald} k={k}>
        {stage === 4 ? `b = ${b}` : b}
      </Tag>
      <Tag x={OX - 10 * k} y={OY + A / 2 + 5 * k} color={blue} anchor="end" k={k}>
        {a}
      </Tag>
      <Tag x={OX - 10 * k} y={OY + A + gap + B / 2 + 5 * k} color={emerald} anchor="end" k={k}>
        {b}
      </Tag>

      {stage === 3 && (
        <Tag x={OX + (A + B) / 2} y={OY + A + B + 30 * k} color={verdict && !verdict.correct ? red : MUTE} size={14} k={k}>
          {verdict === null
            ? `your total: ${values.total ?? "?"}`
            : verdict.correct
              ? `${(a + b) ** 2}`
              : `${values.total} → ${(a + b) ** 2}  (${signed(verdict.delta)})`}
        </Tag>
      )}
      {stage === 4 && (
        <Tag x={OX + (A + B) / 2} y={OY + A + B + 30 * k} color={INK} size={15} k={k}>
          {`(${a} + ${b})² = ${(a + b) ** 2}`}
        </Tag>
      )}
    </Svg>
  );
}

function solve(target: Values): Values {
  const a = target.a ?? 1;
  const b = target.b ?? 1;
  return { a, b, total: (a + b) ** 2 };
}

/**
 * The four boxes for "predict the total area": the true (a + b)² and three named misconceptions —
 * a² + b² (both strips forgotten), a² + ab + b² (one strip), 2(a + b) (doubled instead of squared).
 * Shown in ascending order so position gives nothing away.
 */
export function choicesFor(a: number, b: number): number[] {
  const truth = (a + b) ** 2;
  const candidates = [a * a + b * b, a * a + a * b + b * b, 2 * (a + b), truth + a * b, truth - 1, truth + 1];
  const out = [truth];
  for (const c of candidates) if (c > 0 && !out.includes(c) && out.length < 4) out.push(c);
  return out.sort((x, y) => x - y);
}

export const binomialSquare: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target) {
    // Nothing is picked until the learner commits to a box.
    if (stage === 3) return { a: target.a ?? 1, b: target.b ?? 1 };
    if (stage === 4) return solve(target);
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(_spec, target) {
    const choices = choicesFor(target.a ?? 1, target.b ?? 1);
    return [
      {
        variableName: "total",
        label: "Total area",
        min: choices[0]!,
        max: choices[choices.length - 1]!,
        step: 1,
        colorToken: "slate",
        choices,
      },
    ];
  },
  solve,
  evaluate(values, target) {
    const a = target.a ?? 1;
    const b = target.b ?? 1;
    const delta = (values.total ?? 0) - solve(target).total!;
    if (delta !== 0 && values.total === 2 * (a + b)) return { correct: false, delta, kind: "doubled" as const };
    return { correct: delta === 0, delta };
  },
  formatDelta(v) {
    return signed(v.delta);
  },
};
