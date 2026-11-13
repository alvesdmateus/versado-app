import { describe, expect, it } from "bun:test";
import type { ModuleSpec } from "@versado/core";
import { planePoint } from "./PlanePoint";
import { vectorMove } from "./VectorMove";
import { vectorPath } from "./VectorPath";
import { apply, matrixTransform, modeOf } from "./MatrixTransform";

const control = (variableName: string, initial: number) => ({
  controlType: "drag_handle" as const,
  variableName,
  label: variableName,
  min: -4,
  max: 4,
  step: 1,
  initial,
  colorToken: "blue" as const,
  visualSignaling: "",
});

const spec = (controls: ReturnType<typeof control>[], fixed: Record<string, number> = {}) =>
  ({ stage2Exploration: { prompt: "", controls, fixed, spatialContiguityRules: [] } }) as unknown as ModuleSpec;

describe("planePoint", () => {
  const t = { x: 3, y: -2 };
  it("accepts the address and names swapped and wrong-way pairs", () => {
    expect(planePoint.evaluate({ x: 3, y: -2 }, t, 0).correct).toBe(true);
    expect(planePoint.evaluate({ x: -2, y: 3 }, t, 0).kind).toBe("swap");
    expect(planePoint.evaluate({ x: -3, y: -2 }, t, 0).kind).toBe("sign");
    expect(planePoint.evaluate({ x: 1, y: 1 }, t, 0).kind).toBeUndefined();
  });
  it("starts the prediction at the centre", () => {
    expect(planePoint.initialValues(spec([control("x", 2), control("y", 1)]), 3, t)).toEqual({ x: 0, y: 0 });
  });
});

describe("vectorMove", () => {
  const t = { ax: -2, ay: -1, bx: 2, by: 2 };
  it("solves the move as flag minus start", () => {
    expect(vectorMove.solve(t)).toEqual({ dx: 4, dy: 3 });
  });
  it("names the flag's address given as the move, and the reversed move", () => {
    expect(vectorMove.evaluate({ dx: 4, dy: 3 }, t, 0).correct).toBe(true);
    expect(vectorMove.evaluate({ dx: 2, dy: 2 }, t, 0).kind).toBe("position");
    expect(vectorMove.evaluate({ dx: -4, dy: -3 }, t, 0).kind).toBe("sign");
  });
});

describe("vectorPath", () => {
  const t = { ux: 2, uy: 3, vx: 3, vy: -1 };
  it("adds the moves component by component", () => {
    expect(vectorPath.solve(t)).toEqual({ sx: 5, sy: 2 });
  });
  it("names a shortcut that skips a move or subtracts it", () => {
    expect(vectorPath.evaluate({ sx: 5, sy: 2 }, t, 0).correct).toBe(true);
    expect(vectorPath.evaluate({ sx: 2, sy: 3 }, t, 0).kind).toBe("partial");
    expect(vectorPath.evaluate({ sx: 3, sy: -1 }, t, 0).kind).toBe("partial");
    expect(vectorPath.evaluate({ sx: -1, sy: 4 }, t, 0).kind).toBe("sign");
  });
  it("explores with the first move held fixed", () => {
    expect(vectorPath.initialValues(spec([control("vx", 2), control("vy", -2)], { ux: 3, uy: 2 }), 2, {})).toEqual({
      ux: 3,
      uy: 2,
      vx: 2,
      vy: -2,
    });
  });
});

describe("matrixTransform", () => {
  const stretch = spec([control("a", 2), control("d", 1)], { b: 0, c: 0 });
  const columns = spec([control("b", 1), control("d", 1)], { a: 1, c: 0, px: 2, py: 1 });

  it("picks the mode from the exposed controls", () => {
    expect(modeOf(stretch)).toBe("stretch");
    expect(modeOf(columns)).toBe("columns");
  });

  it("sends a point to x of the across arrow plus y of the up arrow", () => {
    expect(apply({ a: 1, c: 1, b: -1, d: 2 }, { x: 2, y: 1 })).toEqual({ x: 1, y: 4 });
  });

  it("stretch: accepts the fit and names swapped or flipped arrows", () => {
    const t = { a: 2, b: 0, c: 0, d: -1 };
    expect(matrixTransform.evaluate({ a: 2, d: -1 }, t, 0, stretch).correct).toBe(true);
    expect(matrixTransform.evaluate({ a: -1, d: 2 }, t, 0, stretch).kind).toBe("swap");
    expect(matrixTransform.evaluate({ a: 2, d: 1 }, t, 0, stretch).kind).toBe("sign");
  });

  it("columns: solves the landing and names unmoved and transposed answers", () => {
    const t = { a: 1, c: 1, b: -1, d: 2, px: 2, py: 1 };
    expect(matrixTransform.solve(t, columns)).toEqual({ mx: 1, my: 4 });
    expect(matrixTransform.evaluate({ mx: 1, my: 4 }, t, 0, columns).correct).toBe(true);
    expect(matrixTransform.evaluate({ mx: 2, my: 1 }, t, 0, columns).kind).toBe("unmoved");
    expect(matrixTransform.evaluate({ mx: 3, my: 0 }, t, 0, columns).kind).toBe("transpose");
  });

  it("columns: predicts with a marker, not the matrix", () => {
    expect(matrixTransform.predictionControls(columns, {}).map((c) => c.variableName)).toEqual(["mx", "my"]);
    expect(matrixTransform.initialValues(columns, 3, {})).toEqual({ mx: 0, my: 0 });
  });
});
