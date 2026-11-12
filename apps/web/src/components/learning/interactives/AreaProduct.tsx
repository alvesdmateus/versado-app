import { bandColor, bandFill, clamp, INK, MUTE, signed } from "../bands";
import { Lattice, Svg, Tag } from "./board-kit";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/** Multiplying is area: an a × b rectangle tiled by unit squares on a peg lattice. */

const U = 28;
const COLS = 10;
const ROWS = 9;
const OX = 40;
const W = OX + COLS * U + 20;
const H = ROWS * U + 64;
const OY = H - 36;

function Board({ stage, values, target, verdict, anchorT, changed }: BoardProps) {
  let a: number;
  let b: number;
  if (stage === 1) {
    a = 1 + Math.round(clamp(anchorT / 0.5, 0, 1) * 4);
    b = 1 + Math.round(clamp((anchorT - 0.5) / 0.5, 0, 1) * 2);
  } else {
    a = values.a ?? 1;
    b = values.b ?? 1;
  }

  const predicting = stage === 3;
  const showTiles = !predicting || verdict !== null;
  const goalRows = predicting ? (target.area ?? 0) / (target.a ?? 1) : 0;
  const tiles: { x: number; y: number }[] = [];
  if (showTiles) for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) tiles.push({ x: i, y: j });

  const pulse = (name: string) => (changed?.name === name ? `${name}-${changed.tick}` : name);
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const emerald = bandColor("emerald");
  const red = bandColor("red");

  return (
    <Svg anchoring={stage === 1} width={W} height={H} label={`Rectangle ${a} wide and ${b} tall`}>
      <Lattice cols={COLS} rows={ROWS} unit={U} ox={OX} oy={OY - ROWS * U} />

      {tiles.map((t) => (
        <rect
          key={`${t.x}:${t.y}`}
          x={OX + t.x * U + 2}
          y={OY - (t.y + 1) * U + 2}
          width={U - 4}
          height={U - 4}
          rx={3}
          fill={bandFill(verdict && !verdict.correct && verdict.delta > 0 && t.y >= goalRows ? "red" : "emerald", 30)}
        />
      ))}

      {/* Diagnostic: the rows the answer is missing, drawn where they belong */}
      {predicting && verdict && verdict.delta < 0 && (
        <g>
          <rect
            x={OX}
            y={OY - goalRows * U}
            width={a * U}
            height={(goalRows - b) * U}
            fill="none"
            stroke={red}
            strokeWidth={2}
            strokeDasharray="6 4"
            className="gb-march"
          />
          <Tag x={OX + (a * U) / 2} y={OY - ((goalRows + b) / 2) * U + 5} color={red}>
            {signed(verdict.delta)} tiles
          </Tag>
        </g>
      )}
      {predicting && verdict && verdict.delta > 0 && (
        <Tag x={OX + (a * U) / 2} y={OY - ((goalRows + b) / 2) * U + 5} color={red}>
          {signed(verdict.delta)} tiles
        </Tag>
      )}

      {/* Rectangle outline */}
      <rect
        className="gb-snap"
        x={OX}
        y={OY - b * U}
        width={a * U}
        height={b * U}
        fill="none"
        stroke={INK}
        strokeWidth={1.5}
      />
      {/* Width band along the bottom, height band along the left */}
      <line
        key={pulse("a")}
        className="gb-pulse"
        x1={OX}
        x2={OX + a * U}
        y1={OY}
        y2={OY}
        stroke={blue}
        strokeWidth={5}
        strokeLinecap="round"
        style={{ ["--sw" as string]: "5px" }}
      />
      <line
        key={pulse("b")}
        className="gb-pulse"
        x1={OX}
        x2={OX}
        y1={OY}
        y2={OY - b * U}
        stroke={amber}
        strokeWidth={5}
        strokeLinecap="round"
        style={{ ["--sw" as string]: "5px" }}
      />

      <Tag x={OX + (a * U) / 2} y={OY + 22} color={blue}>
        {stage === 4 ? `a = ${a}` : a}
      </Tag>
      <Tag x={OX - 12} y={OY - (b * U) / 2 + 5} color={amber} anchor="end">
        {stage === 4 ? `b = ${b}` : b}
      </Tag>

      {showTiles ? (
        <Tag x={OX + (a * U) / 2} y={OY - (b * U) / 2 + 6} color={stage === 4 ? emerald : INK} size={18} weight={800}>
          {a * b}
        </Tag>
      ) : (
        <Tag x={OX + (COLS * U) / 2} y={OY - ROWS * U + 18} color={MUTE} size={14} weight={700}>
          {`goal ${target.area} tiles`}
        </Tag>
      )}
    </Svg>
  );
}

const control = (spec: Parameters<InteractiveDefinition["predictionControls"]>[0], name: string) =>
  spec.stage2Exploration.controls.find((c) => c.variableName === name)!;

function solve(target: Values): Values {
  return { a: target.a ?? 1, b: (target.area ?? 0) / (target.a ?? 1) };
}

export const areaProduct: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target): Values {
    if (stage === 3) return { a: target.a ?? 1, b: 1 };
    if (stage === 4) return solve(target);
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(spec) {
    const b = control(spec, "b");
    return [{ variableName: "b", label: b.label, min: b.min, max: b.max, step: b.step, colorToken: b.colorToken }];
  },
  solve,
  evaluate(values, target) {
    const delta = (target.a ?? 0) * (values.b ?? 0) - (target.area ?? 0);
    return { correct: delta === 0, delta };
  },
  formatDelta(v) {
    return `${signed(v.delta)} tiles`;
  },
};
