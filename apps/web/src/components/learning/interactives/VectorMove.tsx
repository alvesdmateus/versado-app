import { bandColor, fmt, signed, INK } from "../bands";
import { Arrow, clearOfXTicks, PlaneGrid, PlaneTicks, span, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import { PlaneHandle, RAIL_CROSS, RAIL_GUTTER, Rails, useBoardInput } from "./rail";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/**
 * A vector is a move: so many steps across, so many up — wherever it starts. The main arrow leaves
 * the dot A; while exploring, faded copies leave other spots and change with it, so "the same move"
 * is something the learner sees rather than reads.
 */

const W = 340;
const H = 340;
const RANGE = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 } as const;

/** Where the move starts while exploring (keeps every tip of the ±4 range on the board). */
const EXPLORE_START = { x: -1, y: -1 };
/** Other starting spots whose copies mirror the main arrow while exploring. */
const COPY_STARTS = [
  { x: -4, y: 2 },
  { x: 2, y: -4 },
];

/** Stage 1: one move, carried from one spot and then stamped from three others. */
const ANCHOR_MOVE = { x: 3, y: 2 };
const ANCHOR_STARTS = [
  { x: -4, y: -3 },
  { x: -1, y: 1 },
  { x: 1, y: -4 },
  { x: -4, y: 1 },
];

function inside(s: PlaneScale, p: { x: number; y: number }) {
  return p.x >= s.xMin && p.x <= s.xMax && p.y >= s.yMin && p.y <= s.yMax;
}

/** A small flag planted on a point: the destination. */
function Flag({ s, x, y, color }: { s: PlaneScale; x: number; y: number; color: string }) {
  const px = s.x(x);
  const py = s.y(y);
  return (
    <g>
      <line x1={px} y1={py} x2={px} y2={py - 24} stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <polygon points={`${px},${py - 24} ${px + 15},${py - 19} ${px},${py - 13}`} fill={color} />
      <circle cx={px} cy={py} r={4} fill={color} />
    </g>
  );
}

/** Across leg (blue) then up leg (amber) under a move, with optional step counts. */
function Legs({
  s,
  from,
  dx,
  dy,
  labels,
  formal,
}: {
  s: PlaneScale;
  from: { x: number; y: number };
  dx: number;
  dy: number;
  labels: boolean;
  formal: boolean;
}) {
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const cx = from.x + dx;
  // The across count sits mid-leg, but steps off the vertical axis so it never prints over its numbers.
  let lx = s.x(from.x + dx / 2);
  if (Math.abs(lx - s.x(0)) < 34) lx = s.x(0) + (lx >= s.x(0) ? 34 : -34);
  return (
    <g>
      {Math.abs(dx) > 1e-9 && (
        <line x1={s.x(from.x)} y1={s.y(from.y)} x2={s.x(cx)} y2={s.y(from.y)} stroke={blue} strokeWidth={3} strokeDasharray="4 4" strokeLinecap="round" />
      )}
      {Math.abs(dy) > 1e-9 && (
        <line x1={s.x(cx)} y1={s.y(from.y)} x2={s.x(cx)} y2={s.y(from.y + dy)} stroke={amber} strokeWidth={3} strokeDasharray="4 4" strokeLinecap="round" />
      )}
      {labels && Math.abs(dx) > 1e-9 && (
        <Tag x={lx} y={clearOfXTicks(s, s.y(from.y) + (dy > 0 ? 20 : -10), dy > 0)} color={blue} size={12}>
          {formal ? `Δx = ${fmt(dx)}` : signed(dx)}
        </Tag>
      )}
      {labels && Math.abs(dy) > 1e-9 && (
        <Tag x={s.x(cx) + (dx >= 0 ? 10 : -10)} y={s.y(from.y + dy / 2) + 4} color={amber} size={12} anchor={dx >= 0 ? "start" : "end"}>
          {formal ? `Δy = ${fmt(dy)}` : signed(dy)}
        </Tag>
      )}
    </g>
  );
}

function Board({ stage, values, target, verdict, anchorT, changed, guide, input }: BoardProps) {
  const s = usePlane({ width: W, height: H, pad: 26, ...RANGE });
  const violet = bandColor("violet");
  const rose = bandColor("rose");
  const slate = bandColor("slate");
  const red = bandColor("red");
  const board = useBoardInput(input, values);
  const [dx, dy] = useSettle([values.dx ?? 0, values.dy ?? 0], stage !== 1 && guide == null) as [number, number];

  if (stage === 1) {
    // First 40%: the token rides the arrow. Then the same arrow is stamped from the other spots.
    const ride = span(anchorT, 0, 0.4);
    return (
      <Svg anchoring width={W} height={H} label="The same arrow moves a token from several different starting spots">
        <PlaneGrid s={s} />
        {ANCHOR_STARTS.map((a, i) => {
          const t = i === 0 ? ride : span(anchorT, 0.4 + (i - 1) * 0.2, 0.4 + i * 0.2);
          if (t <= 0) return null;
          const tip = { x: a.x + ANCHOR_MOVE.x * t, y: a.y + ANCHOR_MOVE.y * t };
          return (
            <g key={i}>
              <circle cx={s.x(a.x)} cy={s.y(a.y)} r={5} fill={slate} />
              <Arrow x1={s.x(a.x)} y1={s.y(a.y)} x2={s.x(tip.x)} y2={s.y(tip.y)} color={violet} opacity={i === 0 ? 1 : 0.85} />
              {i === 0 && <circle cx={s.x(tip.x)} cy={s.y(tip.y)} r={7} fill={INK} />}
            </g>
          );
        })}
      </Svg>
    );
  }

  const exploring = stage === 2;
  const from = exploring ? EXPLORE_START : { x: target.ax ?? 0, y: target.ay ?? 0 };
  const flag = exploring ? null : { x: target.bx ?? 0, y: target.by ?? 0 };
  const rdx = values.dx ?? 0;
  const rdy = values.dy ?? 0;
  const land = { x: from.x + dx, y: from.y + dy };
  const rland = { x: from.x + rdx, y: from.y + rdy };
  const formal = stage === 4;
  const missed = stage === 3 && verdict !== null && !verdict.correct;
  const morphing = guide != null && guide < 1;
  const pulse = changed ? `${changed.name}-${changed.tick}` : "still";

  return (
    <Svg
      width={W}
      height={H}
      label={`Move of ${fmt(rdx)} across and ${fmt(rdy)} up${flag ? `, from the dot toward the flag` : ""}`}
      gutter={{ left: RAIL_GUTTER, bottom: RAIL_GUTTER }}
    >
      <PlaneGrid s={s} />

      {/* Copies from other spots: no numbers, they only mirror the main arrow */}
      {exploring &&
        COPY_STARTS.filter((c) => inside(s, { x: c.x + rdx, y: c.y + rdy })).map((c, i) => (
          <g key={i} opacity={0.4}>
            <circle cx={s.x(c.x)} cy={s.y(c.y)} r={4} fill={slate} />
            <Arrow x1={s.x(c.x)} y1={s.y(c.y)} x2={s.x(c.x + dx)} y2={s.y(c.y + dy)} color={violet} width={3} />
          </g>
        ))}

      {flag && <Flag s={s} x={flag.x} y={flag.y} color={rose} />}

      {/* Diagnosis: the gap from where the move lands to the flag; a wrong-way move also gets the right one */}
      {missed && flag && (
        <g>
          {verdict?.kind === "sign" && (
            <Arrow x1={s.x(from.x)} y1={s.y(from.y)} x2={s.x(flag.x)} y2={s.y(flag.y)} color={red} width={3} dashed className="gb-march" />
          )}
          <line x1={s.x(rland.x)} y1={s.y(rland.y)} x2={s.x(flag.x)} y2={s.y(flag.y)} stroke={red} strokeWidth={2.5} strokeDasharray="5 4" className="gb-march" />
          <circle cx={s.x(rland.x)} cy={s.y(rland.y)} r={11} fill="none" stroke={red} strokeWidth={2.5} />
          {/* "Position": the learner gave the flag's address, a walk from the centre — show it faintly */}
          {verdict?.kind === "position" && (
            <Arrow x1={s.x(0)} y1={s.y(0)} x2={s.x(flag.x)} y2={s.y(flag.y)} color={red} width={2} opacity={0.6} dashed />
          )}
        </g>
      )}

      <g key={pulse} className="gb-pulse">
        <Legs s={s} from={from} dx={dx} dy={dy} labels={!morphing} formal={formal} />
      </g>
      <Arrow x1={s.x(from.x)} y1={s.y(from.y)} x2={s.x(land.x)} y2={s.y(land.y)} color={violet} width={5} />
      <circle cx={s.x(from.x)} cy={s.y(from.y)} r={6.5} fill={slate} />

      {formal && flag && (
        <g>
          <Tag x={s.x(from.x) - 10} y={s.y(from.y) + 20} color={slate} anchor="end">
            A
          </Tag>
          <Tag x={s.x(flag.x) + 18} y={s.y(flag.y) - 26} color={rose} anchor="start">
            B
          </Tag>
          <Tag x={s.x((from.x + flag.x) / 2) - 10} y={s.y((from.y + flag.y) / 2) - 8} color={violet} anchor="end">
            v
          </Tag>
        </g>
      )}

      <PlaneTicks s={s} avoid={[from, rland, ...(flag ? [flag] : [])]} />
      {/* Each step count rides the axis it moves along; the thumb sits level with the arrow's tip */}
      <Rails
        input={input}
        values={values}
        bind={{
          dx: { axis: "x", at: (v) => s.x(from.x + v), cross: H + RAIL_CROSS, reach: s.y(rland.y) },
          dy: { axis: "y", at: (v) => s.y(from.y + v), cross: -RAIL_CROSS, reach: s.x(rland.x) },
        }}
      />
      {(board.can("dx") || board.can("dy")) && (
        <PlaneHandle
          x={s.x(rland.x)}
          y={s.y(rland.y)}
          color={violet}
          cursor={board.can("dx") && board.can("dy") ? "move" : board.can("dx") ? "ew-resize" : "ns-resize"}
          onDrag={(pt) => {
            board.set("dx", s.fromX(pt.x) - from.x);
            board.set("dy", s.fromY(pt.y) - from.y);
          }}
        />
      )}
    </Svg>
  );
}

function solve(target: Values): Values {
  return { dx: (target.bx ?? 0) - (target.ax ?? 0), dy: (target.by ?? 0) - (target.ay ?? 0) };
}

export const vectorMove: InteractiveDefinition = {
  Board,
  axes: { dx: "x", dy: "y" },
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    if (stage === 3) return { dx: 0, dy: 0 };
    const v: Values = {};
    for (const c of spec.stage2Exploration.controls) v[c.variableName] = c.initial;
    return v;
  },
  predictionControls(spec, target) {
    // The move's tip may reach anywhere on the board, so each rail spans the board from this start.
    const from: Record<string, number> = { dx: target.ax ?? 0, dy: target.ay ?? 0 };
    return spec.stage2Exploration.controls.map((c) => ({
      variableName: c.variableName,
      label: c.label,
      min: RANGE.xMin - (from[c.variableName] ?? 0),
      max: RANGE.xMax - (from[c.variableName] ?? 0),
      step: c.step,
      colorToken: c.colorToken,
    }));
  },
  solve,
  evaluate(values, target, tolerance) {
    const goal = solve(target);
    const dx = values.dx ?? 0;
    const dy = values.dy ?? 0;
    const near = (a: number, b: number) => Math.abs(a - b) <= tolerance + 1e-9;
    const correct = near(dx, goal.dx!) && near(dy, goal.dy!);
    const delta = Math.hypot(dx - goal.dx!, dy - goal.dy!);
    if (correct) return { correct, delta: 0 };
    // Giving the flag's own address is the core vector-vs-point confusion: name it first.
    if (near(dx, target.bx ?? 0) && near(dy, target.by ?? 0)) return { correct, delta, kind: "position" };
    if (near(dx, -goal.dx!) && near(dy, -goal.dy!)) return { correct, delta, kind: "sign" };
    return { correct, delta };
  },
  formatDelta(v) {
    return `${fmt(v.delta)} off`;
  },
};
