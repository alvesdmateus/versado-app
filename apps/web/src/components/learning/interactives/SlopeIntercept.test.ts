import { describe, expect, it } from "bun:test";
import type { ModuleSpec } from "@versado/core";
import { slopeIntercept } from "./SlopeIntercept";

const control = (variableName: string, initial: number) => ({
  controlType: "slider" as const,
  variableName,
  label: variableName,
  min: -3,
  max: 5,
  step: 0.5,
  initial,
  colorToken: "amber" as const,
  visualSignaling: "",
});

const spec = (controls: ReturnType<typeof control>[], fixed: Record<string, number> = {}) =>
  ({ stage2Exploration: { prompt: "", controls, fixed, spatialContiguityRules: [] } }) as unknown as ModuleSpec;

const slopeOnly = spec([control("m", 1)], { c: 0 });
const interceptOnly = spec([control("c", 0)], { m: 1 });
const both = spec([control("m", 1), control("c", 0)]);

describe("slopeIntercept", () => {
  it("solves m and c from two points, including falling lines", () => {
    expect(slopeIntercept.solve({ x1: 0, y1: 1, x2: 2, y2: 5 })).toEqual({ m: 2, c: 1 });
    expect(slopeIntercept.solve({ x1: 1, y1: 1, x2: 2, y2: -1 })).toEqual({ m: -2, c: 3 });
  });

  it("holds the fixed parameter while exploring a single building block", () => {
    expect(slopeIntercept.initialValues(slopeOnly, 2, {})).toEqual({ c: 0, m: 1 });
    expect(slopeIntercept.initialValues(interceptOnly, 2, {})).toEqual({ m: 1, c: 0 });
  });

  it("starts the prediction with exposed controls neutral and hidden ones solved", () => {
    // Intercept-only: the tilt comes from the target's own line; only c is the learner's to set.
    expect(slopeIntercept.initialValues(interceptOnly, 3, { x1: 2, y1: 5, x2: 3, y2: 6 })).toEqual({ m: 1, c: 0 });
    expect(slopeIntercept.initialValues(both, 3, { x1: 0, y1: 1, x2: 2, y2: 5 })).toEqual({ m: 0, c: 0 });
  });

  it("reports the signed gap to the furthest point when the line misses", () => {
    const target = { x1: 0, y1: 1, x2: 2, y2: 5 };
    expect(slopeIntercept.evaluate({ m: 2, c: 1 }, target, 0)).toEqual({ correct: true, delta: 0 });
    const miss = slopeIntercept.evaluate({ m: 1.5, c: 1 }, target, 0);
    expect(miss.correct).toBe(false);
    expect(miss.delta).toBe(1); // the point at x=2 sits 1 above the learner's line
  });

  it("treats a sign error as a miss (direction matters)", () => {
    const falling = { x1: 0, y1: 0, x2: 2, y2: -3 };
    const flipped = slopeIntercept.evaluate({ m: 1.5, c: 0 }, falling, 0);
    expect(flipped.correct).toBe(false);
    expect(flipped.kind).toBe("sign");
    expect(slopeIntercept.evaluate({ m: -1.5, c: 0 }, falling, 0).correct).toBe(true);
    // Right direction, wrong steepness: a plain distance miss, not a sign error.
    expect(slopeIntercept.evaluate({ m: -0.5, c: 0 }, falling, 0).kind).toBeUndefined();
  });
});
