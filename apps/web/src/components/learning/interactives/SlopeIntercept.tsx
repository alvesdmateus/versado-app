import type { ModuleSpec } from "@versado/core";
import { bandColor, fmt, signed, INK, MUTE } from "../bands";
import { lineEnds, PlaneGrid, PlaneTicks, Svg, Tag, usePlane, useSettle, type PlaneScale } from "./board-kit";
import type { BoardProps, InteractiveDefinition, Values } from "./types";

/**
 * y = m·x + c on a square-unit plane.
 * The same board serves three modules, picked by which controls the spec exposes:
 *  - "m":    slope alone (c held fixed) — the line swings around its pin; the sign sets direction.
 *  - "c":    intercept alone (m held fixed) — the line slides along the vertical axis.
 *  - "both": the full function, plus the faded practice set.
 */

const W = 340;
// Square units: a climb of 1 must look like a climb of 1.
const H = 26 * 2 + 8 * ((W - 52) / 6);

type Mode = "m" | "c" | "both";

function modeOf(spec: ModuleSpec): Mode {
  const names = spec.stage2Exploration.controls.map((c) => c.variableName);
  if (names.includes("m") && names.includes("c")) return "both";
  return names.includes("m") ? "m" : "c";
}

function fixedOf(spec: ModuleSpec): Values {
  return spec.stage2Exploration.fixed ?? {};
}

/** Stage-1 anchoring motion for each mode (t from 0 to 1). */
function anchorLine(mode: Mode, t: number, fixed: Values) {
  if (mode === "m") return { m: 2 - 4 * t, c: fixed.c ?? 0 }; // uphill → flat → downhill
  if (mode === "c") return { m: fixed.m ?? 1, c: 2 + 2.5 * Math.sin(2 * Math.PI * t) }; // glide up and down
  return { m: 1, c: 0 };
}

/** Arrowhead at the right end of the line: the direction of travel, up or down. */
function DirectionArrow({ s, m, c, color }: { s: PlaneScale; m: number; c: number; color: string }) {
  const ends = lineEnds(s, m, c);
  if (!ends) return null;
  const angle = Math.atan2(ends.y2 - ends.y1, ends.x2 - ends.x1);
  const len = 13;
  const spread = 0.45;
  const p = (a: number) => `${ends.x2 - len * Math.cos(a)},${ends.y2 - len * Math.sin(a)}`;
  return <polygon points={`${ends.x2},${ends.y2} ${p(angle - spread)} ${p(angle + spread)}`} fill={color} />;
}

/** A short dashed red band from the start point in the direction the answer needed. */
function SignHint({ s, c, rising, color }: { s: PlaneScale; c: number; rising: boolean; color: string }) {
  const dx = 1.2;
  const dy = rising ? 1.2 : -1.2;
  const x2 = s.x(dx);
  const y2 = s.y(c + dy);
  const angle = Math.atan2(y2 - s.y(c), x2 - s.x(0));
  const p = (a: number) => `${x2 - 11 * Math.cos(a)},${y2 - 11 * Math.sin(a)}`;
  return (
    <g>
      <line x1={s.x(0)} y1={s.y(c)} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeDasharray="6 4" className="gb-march" />
      <polygon points={`${x2},${y2} ${p(angle - 0.45)} ${p(angle + 0.45)}`} fill={color} />
    </g>
  );
}

function Board({ spec, stage, values, target, verdict, anchorT, changed, guide }: BoardProps) {
  const mode = modeOf(spec);
  // Slope alone pivots around the origin, so the plane is centred there (rising and falling room);
  // with an intercept the line mostly lives above the axis.
  const range = mode === "m" ? { xMin: -3, xMax: 3, yMin: -4, yMax: 4 } : { xMin: -2, xMax: 4, yMin: -2, yMax: 6 };
  const s = usePlane({ width: W, height: H, pad: 26, ...range });
  const blue = bandColor("blue");
  const amber = bandColor("amber");
  const violet = bandColor("violet");
  const red = bandColor("red");
  const rose = bandColor("rose");
  const slate = bandColor("slate");

  const fixed = fixedOf(spec);
  const walking = stage === 1 && mode === "both";
  const raw =
    stage === 1
      ? anchorLine(mode, anchorT, fixed)
      : { m: values.m ?? fixed.m ?? 0, c: values.c ?? fixed.c ?? 0 };
  // The band snaps into place with the world's spring; anchoring and guided demos drive their own motion.
  const [m, c] = useSettle([raw.m, raw.c], stage !== 1 && guide == null) as [number, number];

  const pts =
    stage >= 3
      ? [
          { x: target.x1 ?? 0, y: target.y1 ?? 0 },
          { x: target.x2 ?? 0, y: target.y2 ?? 0 },
        ]
      : [];
  // In the slope-only module the line is pinned: a target point on the pin is the pin, not a goal.
  const isPin = (p: { x: number; y: number }) => mode === "m" && p.x === 0 && p.y === (fixed.c ?? 0);

  // Stage 1 (both): a point walks right, climbing the same amount at every step.
  const walkX = s.xMin + (s.xMax - s.xMin) * anchorT;
  const ends = walking
    ? { x1: s.x(s.xMin), y1: s.y(m * s.xMin + c), x2: s.x(walkX), y2: s.y(m * walkX + c) }
    : lineEnds(s, m, c);

  const stepKey = changed?.name === "m" ? changed.tick : 0;
  const startKey = changed?.name === "c" ? changed.tick : 0;
  // While a guided demonstration morphs the line, intermediate values are noise: show labels once it settles.
  const morphing = guide != null && guide < 1;
  // Labels read the exact values; only the geometry springs. Keep the step label off the x-axis ticks.
  let stepTagY = (s.y(c) + s.y(c + m)) / 2 + 5;
  if (Math.abs(stepTagY - 5 - s.y(0)) < 12) stepTagY += m >= 0 ? -16 : 16;
  const showStep = !walking && mode !== "c" && !morphing;
  const showStart = !walking && mode !== "m";
  const formal = stage === 4;

  // Guided demonstration: run, then rise, between the two target points.
  const p1 = pts[0];
  const p2 = pts[1];
  const showRun = guide != null && p1 && p2 && guide > 0.1;
  const showRise = guide != null && p1 && p2 && guide > 0.45;

  return (
    <Svg anchoring={stage === 1}
      width={W}
      height={H}
      label={`Line y = ${fmt(m)}x ${c < 0 ? "−" : "+"} ${fmt(Math.abs(c))}, ${m > 0 ? "rising" : m < 0 ? "falling" : "flat"}`}
    >
      <PlaneGrid s={s} />

      {/* Step bar: one step right, m up (or down when m is negative) */}
      {showStep && (
        <g key={`step-${stepKey}`} className="gb-pulse">
          <line x1={s.x(0)} y1={s.y(c)} x2={s.x(1)} y2={s.y(c)} stroke={MUTE} strokeWidth={2} strokeDasharray="3 3" />
          <line x1={s.x(1)} y1={s.y(c)} x2={s.x(1)} y2={s.y(c + m)} stroke={amber} strokeWidth={4} strokeLinecap="round" />
          {!morphing && Math.abs(raw.m) > 1e-9 && (
            <Tag x={s.x(1) + 8} y={stepTagY} color={amber} anchor="start">
              {formal ? `m = ${fmt(raw.m)}` : signed(raw.m)}
            </Tag>
          )}
          {!morphing && Math.abs(raw.m) <= 1e-9 && (
            <Tag x={s.x(1) + 8} y={s.y(c) - 8} color={amber} anchor="start">
              {formal ? "m = 0" : "0"}
            </Tag>
          )}
        </g>
      )}
      {walking &&
        [-1, 0, 1, 2, 3].filter((x) => x + 1 <= walkX).map((x) => (
          <g key={x}>
            <line x1={s.x(x)} y1={s.y(x * m + c)} x2={s.x(x + 1)} y2={s.y(x * m + c)} stroke={MUTE} strokeWidth={2} strokeDasharray="3 3" />
            <line x1={s.x(x + 1)} y1={s.y(x * m + c)} x2={s.x(x + 1)} y2={s.y((x + 1) * m + c)} stroke={amber} strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}

      {/* Guided demonstration overlay: run (slate) then rise (amber) between the points */}
      {showRun && p1 && p2 && (
        <g>
          <line x1={s.x(p1.x)} y1={s.y(p1.y)} x2={s.x(p2.x)} y2={s.y(p1.y)} stroke={MUTE} strokeWidth={2.5} strokeDasharray="3 3" />
          <Tag x={(s.x(p1.x) + s.x(p2.x)) / 2} y={s.y(p1.y) + (p2.y >= p1.y ? 18 : -10)} color={slate} size={12}>
            {`run ${fmt(p2.x - p1.x)}`}
          </Tag>
        </g>
      )}
      {showRise && p1 && p2 && (
        <g>
          <line x1={s.x(p2.x)} y1={s.y(p1.y)} x2={s.x(p2.x)} y2={s.y(p2.y)} stroke={amber} strokeWidth={3.5} strokeDasharray="3 3" />
          <Tag x={s.x(p2.x) + 10} y={(s.y(p1.y) + s.y(p2.y)) / 2 + 5} color={amber} anchor="start" size={12}>
            {`rise ${signed(p2.y - p1.y)}`}
          </Tag>
        </g>
      )}

      {ends && <line {...ends} stroke={blue} strokeWidth={4} strokeLinecap="round" />}
      {!walking && <DirectionArrow s={s} m={m} c={c} color={blue} />}
      {walking && <circle cx={s.x(walkX)} cy={s.y(m * walkX + c)} r={7} fill={blue} />}

      {/* Pin of the slope-only lever */}
      {mode === "m" && <circle cx={s.x(0)} cy={s.y(c)} r={5.5} fill={INK} />}

      {/* Start height on the vertical axis */}
      {showStart && (
        <g key={`start-${startKey}`}>
          <circle className="gb-snap gb-pulse" cx={s.x(0)} cy={s.y(c)} r={7} fill={violet} />
          {!morphing && (
            // Right of the axis (tick labels own the left), on the side away from the line.
            <Tag x={s.x(0) + 12} y={s.y(c) + (m > 0 ? 20 : -12)} color={violet} anchor="start">
              {formal ? `c = ${fmt(raw.c)}` : fmt(raw.c)}
            </Tag>
          )}
        </g>
      )}

      {/* Sign error: the direction the line should have taken, as a dashed red band from its start */}
      {verdict?.kind === "sign" && (
        <SignHint s={s} c={c} rising={solve(target).m! > 0} color={red} />
      )}

      {/* Target points and, after a miss, the dashed gaps to the learner's line (kept on the board) */}
      {pts
        .filter((p) => !isPin(p))
        .map((p, i) => {
          const onLine = m * p.x + c;
          const gap = p.y - onLine;
          const missed = verdict && !verdict.correct && Math.abs(gap) > 1e-9;
          const shownLine = Math.min(s.yMax, Math.max(s.yMin, onLine));
          const cut = shownLine !== onLine;
          let tagY = (s.y(shownLine) + s.y(p.y)) / 2 + 5;
          if (Math.abs(tagY - 5 - s.y(0)) < 12) tagY -= 16; // keep the delta clear of the x-axis ticks
          return (
            <g key={i}>
              {missed && (
                <>
                  <line x1={s.x(p.x)} y1={s.y(shownLine)} x2={s.x(p.x)} y2={s.y(p.y)} stroke={red} strokeWidth={2.5} strokeDasharray="5 4" className="gb-march" />
                  {cut && (
                    <line x1={s.x(p.x) - 7} x2={s.x(p.x) + 7} y1={s.y(shownLine)} y2={s.y(shownLine)} stroke={red} strokeWidth={2.5} />
                  )}
                  <Tag x={s.x(p.x) + 10} y={tagY} color={red} anchor="start" size={12}>
                    {signed(gap)}
                  </Tag>
                </>
              )}
              <circle cx={s.x(p.x)} cy={s.y(p.y)} r={11} fill="none" stroke={rose} strokeWidth={2} />
              <circle cx={s.x(p.x)} cy={s.y(p.y)} r={4.5} fill={rose} />
            </g>
          );
        })}
      <PlaneTicks
        s={s}
        avoid={[...pts, ...(showStart || mode === "m" ? [{ x: 0, y: c }] : [])]}
      />
    </Svg>
  );
}

function solve(target: Values): Values {
  const m = ((target.y2 ?? 0) - (target.y1 ?? 0)) / ((target.x2 ?? 1) - (target.x1 ?? 0));
  const c = (target.y1 ?? 0) - m * (target.x1 ?? 0);
  return { m, c };
}

export const slopeIntercept: InteractiveDefinition = {
  Board,
  initialValues(spec, stage, target) {
    if (stage === 4) return solve(target);
    const controls = spec.stage2Exploration.controls;
    if (stage === 3) {
      // Exposed controls start neutral; anything held fixed comes from the target's own line.
      const solved = solve(target);
      const v: Values = { ...solved };
      for (const c of controls) v[c.variableName] = 0;
      return v;
    }
    const v: Values = { ...fixedOf(spec) };
    for (const c of controls) v[c.variableName] = c.initial;
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
    const m = values.m ?? 0;
    const c = values.c ?? 0;
    const g1 = (target.y1 ?? 0) - (m * (target.x1 ?? 0) + c);
    const g2 = (target.y2 ?? 0) - (m * (target.x2 ?? 0) + c);
    const worst = Math.abs(g1) >= Math.abs(g2) ? g1 : g2;
    const correct = Math.abs(g1) <= tolerance + 1e-9 && Math.abs(g2) <= tolerance + 1e-9;
    const goal = solve(target).m!;
    // Pointing the wrong way is the misconception worth naming, ahead of plain distance.
    const signError = !correct && goal !== 0 && m !== 0 && Math.sign(m) !== Math.sign(goal);
    return signError ? { correct, delta: worst, kind: "sign" as const } : { correct, delta: worst };
  },
  formatDelta(v) {
    return signed(v.delta);
  },
};
