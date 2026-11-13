import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { bandColor, fmt, PANEL, SEAM } from "../bands";
import type { Axis, BoardInput, ControlDef, Values } from "./types";

/**
 * Axis rails: the app-wide control pattern for anything that lives on a board axis.
 *
 * A quantity that moves an element horizontally is driven by a horizontal rail under the board;
 * one that moves it vertically, by a vertical rail beside it. The rail is drawn in the board's own
 * coordinates, so the thumb sits level with the element it moves (spatial contiguity) and a faint
 * leader joins the two. Parameters with no position on an axis (slopes, curvature, totals) stay
 * as band sliders under the board.
 *
 * Pointer → board coordinates goes through `svgPoint`, shared with future free (2-D) handles such
 * as draggable vertices and vector tips.
 */

/** Room the board reserves for its rails, in viewBox units. */
export const RAIL_GUTTER = 44;

/** Where a rail runs across its axis: centred in the gutter. */
export const RAIL_CROSS = RAIL_GUTTER / 2;

/** Map a pointer position along the rail to a control value: linear, snapped to the step, clamped. */
export function railValue(p: number, p0: number, p1: number, min: number, max: number, step: number): number {
  if (p1 === p0) return min;
  const raw = min + ((p - p0) / (p1 - p0)) * (max - min);
  const snapped = min + Math.round((raw - min) / step) * step;
  const clean = Number(snapped.toFixed(6));
  return Math.min(max, Math.max(min, clean));
}

/** Keyboard stepping for a rail (arrows, page keys, home/end), or null when the key is not ours. */
export function railKey(key: string, value: number, min: number, max: number, step: number): number | null {
  const big = Math.max(step, Math.round((max - min) / 10 / step) * step);
  const next =
    key === "ArrowUp" || key === "ArrowRight"
      ? value + step
      : key === "ArrowDown" || key === "ArrowLeft"
        ? value - step
        : key === "PageUp"
          ? value + big
          : key === "PageDown"
            ? value - big
            : key === "Home"
              ? min
              : key === "End"
                ? max
                : null;
  if (next === null) return null;
  return Math.min(max, Math.max(min, Number((min + Math.round((next - min) / step) * step).toFixed(6))));
}

/** Client (pointer) coordinates → the SVG's own viewBox coordinates. */
export function svgPoint(el: SVGGraphicsElement, clientX: number, clientY: number): { x: number; y: number } {
  const svg = el.ownerSVGElement ?? (el as unknown as SVGSVGElement);
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: pt.x, y: pt.y };
}

export interface RailBinding {
  axis: Axis;
  /** Board coordinate along the axis for a value (the board's own scale). */
  at: (v: number) => number;
  /** Cross-axis position of the rail (x of a vertical rail, y of a horizontal one). */
  cross: number;
  /** Cross-axis coordinate of the element the value moves; a faint leader joins thumb and element. */
  reach?: number;
}

export function AxisRail({
  control,
  value,
  binding,
  onChange,
  locked = false,
}: {
  control: ControlDef;
  value: number;
  binding: RailBinding;
  onChange?: (v: number) => void;
  locked?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const { axis, at, cross, reach } = binding;
  const color = bandColor(control.colorToken);
  const p0 = at(control.min);
  const p1 = at(control.max);
  const pv = at(Math.min(control.max, Math.max(control.min, value)));
  const seg = (a: number, b: number) =>
    axis === "y" ? { x1: cross, x2: cross, y1: a, y2: b } : { x1: a, x2: b, y1: cross, y2: cross };
  const thumb = axis === "y" ? { cx: cross, cy: pv } : { cx: pv, cy: cross };
  const interactive = !locked && !!onChange;

  const update = (e: PointerEvent<SVGGElement>) => {
    const pt = svgPoint(e.currentTarget, e.clientX, e.clientY);
    const v = railValue(axis === "y" ? pt.y : pt.x, p0, p1, control.min, control.max, control.step);
    if (v !== value) onChange?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (!interactive) return;
    const v = railKey(e.key, value, control.min, control.max, control.step);
    if (v === null) return;
    e.preventDefault();
    if (v !== value) onChange?.(v);
  };

  // The name sits past the low end of a horizontal rail and above the top of a vertical one.
  const labelPos =
    axis === "y"
      ? { x: cross, y: Math.min(p0, p1) - 20, anchor: "middle" as const }
      : { x: Math.min(p0, p1) - 16, y: cross + 4, anchor: "end" as const };

  return (
    <g
      className="gb-rail"
      data-active={dragging || undefined}
      data-locked={locked || undefined}
      role="slider"
      tabIndex={interactive ? 0 : -1}
      aria-label={control.label}
      aria-orientation={axis === "y" ? "vertical" : "horizontal"}
      aria-valuemin={control.min}
      aria-valuemax={control.max}
      aria-valuenow={value}
      aria-valuetext={fmt(value)}
      aria-disabled={!interactive || undefined}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (!interactive) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        setDragging(true);
        update(e);
      }}
      onPointerMove={(e) => dragging && update(e)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      style={{ ["--band" as string]: color }}
    >
      {reach !== undefined && (
        <line
          {...(axis === "y" ? { x1: cross, x2: reach, y1: pv, y2: pv } : { x1: pv, x2: pv, y1: cross, y2: reach })}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="2 4"
          opacity={dragging ? 0.85 : 0.4}
          pointerEvents="none"
        />
      )}
      {/* Generous invisible hit area along the whole track */}
      <line {...seg(p0, p1)} stroke="transparent" strokeWidth={RAIL_GUTTER - 4} strokeLinecap="round" />
      <line {...seg(p0, p1)} stroke={SEAM} strokeWidth={4} strokeLinecap="round" pointerEvents="none" />
      <line
        {...seg(p0, pv)}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={locked ? 0.45 : 1}
        pointerEvents="none"
      />
      <circle className="gb-rail-ring" {...thumb} r={16} fill="none" stroke={bandColor("blue")} strokeWidth={3} pointerEvents="none" />
      {locked ? (
        <circle {...thumb} r={7} fill={color} pointerEvents="none" />
      ) : (
        <circle className="gb-rail-thumb" {...thumb} r={11} fill={PANEL} stroke={color} strokeWidth={3} pointerEvents="none" />
      )}
      <text
        x={labelPos.x}
        y={labelPos.y}
        textAnchor={labelPos.anchor}
        fontSize={11}
        fontWeight={700}
        fill={color}
        pointerEvents="none"
      >
        {control.label}
      </text>
    </g>
  );
}

/** Snap a raw value to a control's step and range. */
export function snapTo(control: ControlDef, raw: number): number {
  const snapped = control.min + Math.round((raw - control.min) / control.step) * control.step;
  return Math.min(control.max, Math.max(control.min, Number(snapped.toFixed(6))));
}

/**
 * The board's side of direct manipulation: which variables the learner may move right now, and a
 * setter that snaps, respects locks and skips no-op updates. Handles call `set` with raw board values.
 */
export function useBoardInput(input: BoardInput | undefined, values: Values) {
  const find = (name: string) => input?.controls.find((c) => c.variableName === name);
  const can = (name: string) => !!find(name) && !input?.locked?.includes(name);
  const set = (name: string, raw: number) => {
    const c = find(name);
    if (!c || !can(name) || !Number.isFinite(raw)) return;
    const v = snapTo(c, raw);
    if (v !== values[name]) input!.onChange(name, v);
  };
  return { can, set };
}

/**
 * A draggable region on the board. Its children are the hit geometry (drawn transparent or visible);
 * every pointer position arrives in board (viewBox) coordinates. Rails remain the keyboard and
 * screen-reader path, so these regions stay out of the tab order and the accessibility tree.
 */
export function DragArea({
  onDrag,
  cursor = "grab",
  children,
}: {
  onDrag: (pt: { x: number; y: number }) => void;
  cursor?: "grab" | "ns-resize" | "ew-resize" | "move";
  children: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const at = (e: PointerEvent<SVGGElement>) => onDrag(svgPoint(e.currentTarget, e.clientX, e.clientY));
  return (
    <g
      className="gb-handle"
      data-active={dragging || undefined}
      aria-hidden
      style={{ cursor: dragging && cursor === "grab" ? "grabbing" : cursor }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        at(e);
      }}
      onPointerMove={(e) => dragging && at(e)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {children}
    </g>
  );
}

/** A grip on a point of the plane (a vertex, an intercept): visible ring, finger-sized hit area. */
export function PlaneHandle({
  x,
  y,
  color,
  onDrag,
  cursor = "move",
  r = 8,
}: {
  x: number;
  y: number;
  color: string;
  onDrag: (pt: { x: number; y: number }) => void;
  cursor?: "grab" | "ns-resize" | "ew-resize" | "move";
  r?: number;
}) {
  return (
    <DragArea onDrag={onDrag} cursor={cursor}>
      <circle cx={x} cy={y} r={22} fill="transparent" />
      <circle className="gb-handle-grip" cx={x} cy={y} r={r} fill={PANEL} stroke={color} strokeWidth={3} />
    </DragArea>
  );
}

/** Renders a rail for every bound control the board was handed; unbound ones stay under the board. */
export function Rails({
  input,
  values,
  bind,
}: {
  input?: BoardInput;
  values: Values;
  bind: Partial<Record<string, RailBinding>>;
}) {
  if (!input) return null;
  return (
    <>
      {input.controls.map((c) => {
        const binding = bind[c.variableName];
        if (!binding) return null;
        return (
          <AxisRail
            key={c.variableName}
            control={c}
            value={values[c.variableName] ?? c.min}
            binding={binding}
            onChange={(v) => input.onChange(c.variableName, v)}
            locked={input.locked?.includes(c.variableName)}
          />
        );
      })}
    </>
  );
}
