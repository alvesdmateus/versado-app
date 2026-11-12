import { bandColor, bandFill, fmt, signed } from "../bands";
import { lineEnds, PlaneGrid, PlaneTicks, Svg, Tag, usePlane } from "./board-kit";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/** Equations are crossings: where m·x + b meets the flat line y = c. */

const W = 340;
const H = 420;

function crossing(m: number, b: number, c: number) {
  return (c - b) / m;
}

function Board({ stage, values, target, verdict, anchorT, changed }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 26, xMin: -1, xMax: 6, yMin: -3, yMax: 12 });
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const emerald = bandColor("emerald");
  const red = bandColor("red");

  const m = stage >= 3 ? (target.m ?? 1) : 2;
  const b = stage >= 3 ? (target.b ?? 0) : 1;
  const c = stage === 1 ? 1 + anchorT * 6 : stage >= 3 ? (target.c ?? 0) : (values.c ?? 0);
  const xc = crossing(m, b, c);
  const showCross = stage !== 3 || verdict !== null;
  const marker = values.x ?? 0;
  const rising = lineEnds(s, m, b);
  const pulse = changed?.name === "c" ? changed.tick : 0;

  return (
    <Svg anchoring={stage === 1} width={W} height={H} label={`Rising line meets level ${fmt(c)}`}>
      <PlaneGrid s={s} yStep={2} />
      {rising && <line {...rising} stroke={blue} strokeWidth={4} strokeLinecap="round" />}
      <line
        key={`flat-${pulse}`}
        className="gb-pulse"
        x1={s.x(s.xMin)}
        x2={s.x(s.xMax)}
        y1={s.y(c)}
        y2={s.y(c)}
        stroke={amber}
        strokeWidth={4}
        strokeLinecap="round"
        style={{ ["--sw" as string]: "4px" }}
      />
      <Tag x={s.x(s.xMin) + 4} y={s.y(c) - 8} color={amber} anchor="start">
        {fmt(c)}
      </Tag>
      {stage === 4 && (
        <Tag x={s.x(s.xMax) - 4} y={s.y(m * (s.xMax - 0.4) + b) + 4} color={blue} anchor="end">
          {`${fmt(m)}x ${b < 0 ? "−" : "+"} ${fmt(Math.abs(b))}`}
        </Tag>
      )}

      {/* Diagnostic gap on the floor between the marker and the true crossing */}
      {stage === 3 && verdict && !verdict.correct && (
        <g>
          <rect
            x={s.x(Math.min(marker, xc))}
            y={s.y(0) - 8}
            width={Math.abs(s.x(marker) - s.x(xc))}
            height={16}
            fill={bandFill("red", 30)}
          />
          <Tag x={(s.x(marker) + s.x(xc)) / 2} y={s.y(0) + 30} color={red} size={12}>
            {signed(marker - xc)}
          </Tag>
        </g>
      )}

      {showCross && xc >= s.xMin && xc <= s.xMax && (
        <g>
          <line x1={s.x(xc)} y1={s.y(c)} x2={s.x(xc)} y2={s.y(0)} stroke={emerald} strokeWidth={2} strokeDasharray="4 4" />
          <circle className="gb-snap" cx={s.x(xc)} cy={s.y(c)} r={8} fill={emerald} />
          <circle className="gb-snap" cx={s.x(xc)} cy={s.y(0)} r={4} fill={emerald} />
          <Tag x={s.x(xc) + 12} y={s.y(c) - 10} color={emerald} anchor="start">
            {stage === 4 ? `x = ${fmt(xc)}` : `(${fmt(xc)}, ${fmt(c)})`}
          </Tag>
        </g>
      )}

      {/* The learner's floor marker */}
      {stage === 3 && (
        <g>
          <polygon
            className="gb-snap"
            points={`${s.x(marker)},${s.y(0) - 2} ${s.x(marker) - 9},${s.y(0) - 18} ${s.x(marker) + 9},${s.y(0) - 18}`}
            fill={bandColor("slate")}
          />
          <Tag x={s.x(marker)} y={s.y(0) - 24} size={12}>
            {fmt(marker)}
          </Tag>
        </g>
      )}
      <PlaneTicks s={s} yStep={2} />
    </Svg>
  );
}

function solve(target: Values): Values {
  return { x: crossing(target.m ?? 1, target.b ?? 0, target.c ?? 0), c: target.c ?? 0 };
}

export const lineIntersection: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target) {
    if (stage === 3) return { x: 0 };
    if (stage === 4) return solve(target);
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls() {
    return [{ variableName: "x", label: "Marker", min: 0, max: 6, step: 0.25, colorToken: "slate" }];
  },
  solve,
  evaluate(values, target, tolerance) {
    const delta = (values.x ?? 0) - solve(target).x!;
    return { correct: Math.abs(delta) <= tolerance + 1e-9, delta };
  },
  formatDelta(v) {
    return signed(v.delta);
  },
};
