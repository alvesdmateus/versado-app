import { describe, expect, it } from "bun:test";
import type { ModuleSpec } from "@versado/core";
import { curve, parabola, rootsOf } from "./Parabola";

const control = (variableName: string, initial: number) => ({
  controlType: "slider" as const,
  variableName,
  label: variableName,
  min: -4,
  max: 5,
  step: 0.5,
  initial,
  colorToken: "amber" as const,
  visualSignaling: "",
});

const spec = (controls: ReturnType<typeof control>[], fixed: Record<string, number>) =>
  ({ stage2Exploration: { prompt: "", controls, fixed, spatialContiguityRules: [] } }) as unknown as ModuleSpec;

const shape = spec([control("a", 1)], { h: 0, k: 0 });
const vertex = spec([control("h", 0), control("k", 0)], { a: 1 });
const general = spec([control("b", 0), control("c", 1)], { a: 1 });
const roots = spec([control("k", 2)], { a: 1, h: 2 });

describe("parabola", () => {
  it("evaluates vertex and general forms", () => {
    expect(curve("hk", { a: 1, h: 2, k: -1 })(3)).toBe(0);
    expect(curve("bc", { a: 1, b: -4, c: 3 })(1)).toBe(0);
  });

  it("solves a from a single point with the vertex pinned", () => {
    expect(parabola.solve({ x1: 2, y1: -2 }, shape)).toEqual({ a: -0.5, h: 0, k: 0 });
  });

  it("solves the vertex from two points, honouring a downward opening", () => {
    expect(parabola.solve({ x1: 1, y1: 0, x2: 3, y2: 0 }, vertex)).toMatchObject({ a: 1, h: 2, k: -1 });
    expect(parabola.solve({ x1: 0, y1: 1, x2: 2, y2: 1, a: -1 }, vertex)).toMatchObject({ a: -1, h: 1, k: 2 });
  });

  it("solves b and c in the general form", () => {
    expect(parabola.solve({ x1: 0, y1: 3, x2: 1, y2: 0 }, general)).toMatchObject({ a: 1, b: -4, c: 3 });
  });

  it("keeps given parameters at the prediction gate and neutralises the learner's", () => {
    // In the vertex module the opening comes from the target; only h and k are the learner's.
    expect(parabola.initialValues(vertex, 3, { x1: 0, y1: 1, x2: 2, y2: 1, a: -1 })).toMatchObject({ a: -1, h: 0, k: 0 });
  });

  it("accepts an exact fit and reports the worst signed gap otherwise", () => {
    const target = { x1: 1, y1: 0, x2: 3, y2: 0 };
    expect(parabola.evaluate({ h: 2, k: -1 }, target, 0, vertex)).toEqual({ correct: true, delta: 0 });
    const miss = parabola.evaluate({ h: 2, k: 0 }, target, 0, vertex);
    expect(miss.correct).toBe(false);
    expect(miss.delta).toBe(-1);
    // Equal gaps: the axis is right, only the height is off.
    expect(miss.kind).toBe("height");
    // Unequal gaps: the axis of symmetry is in the wrong place.
    expect(parabola.evaluate({ h: 1, k: -1 }, target, 0, vertex).kind).toBe("axis");
  });

  it("names an opening (a) or lean (b) pointing the wrong way", () => {
    expect(parabola.evaluate({ a: 0.5 }, { x1: 2, y1: -2 }, 0, shape).kind).toBe("sign");
    expect(parabola.evaluate({ a: -1 }, { x1: 2, y1: -2 }, 0, shape).kind).toBeUndefined();
    expect(parabola.evaluate({ b: 4, c: 3 }, { x1: 0, y1: 3, x2: 1, y2: 0 }, 0, general).kind).toBe("sign");
  });

  it("finds two, one or no roots from the vertex form", () => {
    expect(rootsOf(1, 2, -1)).toEqual([1, 3]);
    expect(rootsOf(1, 2, 0)).toEqual([2]);
    expect(rootsOf(1, 2, 1)).toEqual([]);
    expect(rootsOf(-1, 2, 1)).toEqual([1, 3]); // opening down needs the vertex above the floor
  });

  it("solves the vertex height that puts the roots on the rings", () => {
    expect(parabola.solve({ x1: 1, y1: 0, x2: 3, y2: 0 }, roots)).toMatchObject({ a: 1, h: 2, k: -1 });
    expect(parabola.solve({ x1: 1.5, y1: 0, x2: 2.5, y2: 0, a: 2 }, roots)).toMatchObject({ a: 2, h: 2, k: -0.5 });
  });

  it("names a curve that never reaches the floor", () => {
    const target = { x1: 1, y1: 0, x2: 3, y2: 0 };
    expect(parabola.evaluate({ k: 1 }, target, 0, roots).kind).toBe("noRoots");
    expect(parabola.evaluate({ k: -2 }, target, 0, roots).kind).toBe("height");
    expect(parabola.evaluate({ k: -1 }, target, 0, roots).correct).toBe(true);
    // Opening down: a vertex below the floor never crosses it.
    expect(parabola.evaluate({ k: -1 }, { ...target, a: -1 }, 0, roots).kind).toBe("noRoots");
  });
});
