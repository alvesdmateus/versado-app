import { bandColor, fmt, INK } from "../bands";
import { lerp, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/**
 * A point is an address: walk across the floor, then climb. The walk is drawn as two legs from the
 * centre (across in blue, up in amber) so the order of the pair is something the learner sees.
 */

const W = 340;
const H = 340;
const RANGE = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 } as const;

/** Stage-1 stops: one above the floor, one below it (zero numbers, only motion). */
const STOPS = [
  { x: 3, y: 2 },
  { x: -2, y: -3 },
];

/** The walk to an address: across the floor then up, as two board-space legs. */
function Walk({
  s,
  x,
  y,
  across,
  up,
  color,
  dashed = false,
  labels = false,
  formal = false,
}: {
  s: PlaneScale;
  x: number;
  y: number;
  across: string;
  up: string;
  color?: string;
  dashed?: boolean;
  labels?: boolean;
  formal?: boolean;
}) {
  const a = color ?? across;
  const u = color ?? up;
  const dash = dashed ? "6 5" : undefined;
  return (
    <g className={dashed ? "gb-march" : undefined}>
      {Math.abs(x) > 1e-9 && (
        <line x1={s.x(0)} y1={s.y(0)} x2={s.x(x)} y2={s.y(0)} stroke={a} strokeWidth={dashed ? 3 : 5} strokeLinecap="round" strokeDasharray={dash} />
      )}
      {Math.abs(y) > 1e-9 && (
        <line x1={s.x(x)} y1={s.y(0)} x2={s.x(x)} y2={s.y(y)} stroke={u} strokeWidth={dashed ? 3 : 5} strokeLinecap="round" strokeDasharray={dash} />
      )}
      {labels && Math.abs(x) > 1e-9 && (
        // Across count rides the floor walk, on the side away from the climb.
        <Tag x={s.x(x / 2)} y={s.y(0) + (y > 0 ? 34 : -12)} color={a}>
          {formal ? `x = ${fmt(x)}` : fmt(x)}
        </Tag>
      )}
      {labels && Math.abs(y) > 1e-9 && (
        <Tag x={s.x(x) + (x >= 0 ? 12 : -12)} y={s.y(y / 2) + 5} color={u} anchor={x >= 0 ? "start" : "end"}>
          {formal ? `y = ${fmt(y)}` : fmt(y)}
        </Tag>
      )}
    </g>
  );
}

function Board({ stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 26, ...RANGE });
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const red = bandColor("red");
  const board = useBoardInput(input, values);
  // Hooks run on every render, before the anchoring branch returns early.
  const [x, y] = useSettle([values.x ?? 0, values.y ?? 0], stage !== 1 && guide == null) as [number, number];

  // Stage 1: walk to each stop (across, then up), leaving a dot behind.
  if (stage === 1) {
    const legs = STOPS.map((stop, i) => {
      const t = span(anchorT, i * 0.5, i * 0.5 + 0.42);
      const across = span(t, 0, 0.5);
      const up = span(t, 0.5, 1);
      return { stop, t, x: lerp(0, stop.x, across), y: lerp(0, stop.y, up) };
    });
    return (
      <Svg anchoring width={W} height={H} label="A token walks across the floor, then up, and leaves a dot">
        <PlaneGrid s={s} />
        {legs.map(({ stop, t, x, y }, i) =>
          t > 0 ? (
            <g key={i} opacity={t >= 1 && i === 0 && anchorT > 0.5 ? 0.55 : 1}>
              <Walk s={s} x={x} y={y} across={blue} up={amber} />
              {t >= 1 ? (
                <circle className="gb-snap" cx={s.x(stop.x)} cy={s.y(stop.y)} r={7} fill={INK} />
              ) : (
                <circle cx={s.x(x)} cy={s.y(y)} r={8} fill={bandColor("violet")} />
              )}
            </g>
          ) : null
        )}
      </Svg>
    );
  }

  const rx = values.x ?? 0;
  const ry = values.y ?? 0;
  const formal = stage === 4;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const solved = (stage === 3 && verdict?.correct) || formal;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";
  const morphing = guide != null && guide < 1;

  return (
    <Svg
      width={W}
      height={H}
      label={`Point ${fmt(rx)} across, ${fmt(ry)} up`}
      gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}
    >
      <PlaneGrid s={s} />

      {/* The true walk after a miss: dashed red, so the learner compares two routes, not two dots */}
      {missed && (
        <g>
          <Walk s={s} x={target.x ?? 0} y={target.y ?? 0} across={red} up={red} dashed />
          <circle cx={s.x(target.x ?? 0)} cy={s.y(target.y ?? 0)} r={11} fill="none" stroke={red} strokeWidth={2.5} />
        </g>
      )}

      <g key={pulse} className="gb-pulse">
        <Walk s={s} x={x} y={y} across={blue} up={amber} labels={!morphing} formal={formal} />
      </g>
      <circle className="gb-snap" cx={s.x(x)} cy={s.y(y)} r={7.5} fill={INK} />
      {solved && (
        <Tag x={s.x(rx) + (rx >= 0 ? 12 : -12)} y={s.y(ry) + (ry >= 0 ? -12 : 24)} anchor={rx >= 0 ? "start" : "end"}>
          {`(${fmt(rx)}, ${fmt(ry)})`}
        </Tag>
      )}

      <PlaneTicks s={s} avoid={[{ x: rx, y: ry }, ...(missed ? [{ x: target.x ?? 0, y: target.y ?? 0 }] : [])]} />
      <Rails
        input={input}
        values={values}
        bind={{
          x: { axis: "x", at: s.x, cross: H + RAIL_CROSS, reach: s.y(ry) },
          y: { axis: "y", at: s.y, cross: -RAIL_CROSS, reach: s.x(rx) },
        }}
      />
      {(board.can("x") || board.can("y")) && (
        <PlaneHandle
          x={s.x(rx)}
          y={s.y(ry)}
          color={INK}
          cursor={board.can("x") && board.can("y") ? "move" : board.can("x") ? "ew-resize" : "ns-resize"}
          onDrag={(pt) => {
            board.set("x", s.fromX(pt.x));
            board.set("y", s.fromY(pt.y));
          }}
        />
      )}
    </Svg>
  );
}

function solve(target: Values): Values {
  return { x: target.x ?? 0, y: target.y ?? 0 };
}

export const planePoint: InteractiveDefinition = {
  Board,
  axes: { x: "x", y: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3) return { x: 0, y: 0 };
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(spec) {
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
  evaluate(values, target, tolerance) {
    const x = values.x ?? 0;
    const y = values.y ?? 0;
    const tx = target.x ?? 0;
    const ty = target.y ?? 0;
    const near = (a: number, b: number) => Math.abs(a - b) <= tolerance + 1e-9;
    const correct = near(x, tx) && near(y, ty);
    const delta = Math.abs(x - tx) + Math.abs(y - ty);
    if (correct) return { correct, delta: 0 };
    // Exchanging the pair is the misconception worth naming first; then walking the wrong way.
    if (tx !== ty && near(x, ty) && near(y, tx)) return { correct, delta, kind: "swap" };
    if (near(Math.abs(x), Math.abs(tx)) && near(Math.abs(y), Math.abs(ty))) return { correct, delta, kind: "sign" };
    return { correct, delta };
  },
  formatDelta(v) {
    return `${fmt(v.delta)} steps`;
  },
};
