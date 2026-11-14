import { describe, expect, it } from "bun:test";
import type { ModuleSpec } from "@versado/core";
import { completeSquare, cornerChoices } from "./CompleteSquare";

const spec = {
  stage2Exploration: {
    prompt: "",
    controls: [
      { controlType: "slider", variableName: "b", label: "b", min: 2, max: 10, step: 2, initial: 4, colorToken: "amber", visualSignaling: "" },
    ],
    fixed: {},
    spatialContiguityRules: [],
  },
} as unknown as ModuleSpec;

describe("completeSquare", () => {
  it("solves the missing corner as (b/2)²", () => {
    expect(completeSquare.solve({ b: 6 })).toEqual({ b: 6, corner: 9 });
    expect(completeSquare.solve({ b: 10 })).toEqual({ b: 10, corner: 25 });
  });

  it("offers the truth and the three named misconceptions, ascending", () => {
    expect(cornerChoices(6)).toEqual([3, 6, 9, 36]);
    expect(cornerChoices(10)).toEqual([5, 10, 25, 100]);
  });

  it("keeps four distinct choices when misconceptions collide with the truth", () => {
    // b = 2: half (1) equals the truth (1), so a near value fills the gap.
    const c = cornerChoices(2);
    expect(c).toHaveLength(4);
    expect(new Set(c).size).toBe(4);
    expect(c).toContain(1);
  });

  it("names each misconception so the feedback can explain it", () => {
    const t = { b: 6 };
    expect(completeSquare.evaluate({ b: 6, corner: 9 }, t, 0)).toEqual({ correct: true, delta: 0 });
    expect(completeSquare.evaluate({ b: 6, corner: 36 }, t, 0)).toEqual({ correct: false, delta: 27, kind: "whole" });
    expect(completeSquare.evaluate({ b: 6, corner: 6 }, t, 0)).toEqual({ correct: false, delta: -3, kind: "linear" });
    expect(completeSquare.evaluate({ b: 6, corner: 3 }, t, 0)).toEqual({ correct: false, delta: -6, kind: "half" });
  });

  it("starts exploration from the spec and the prediction with nothing picked", () => {
    expect(completeSquare.initialValues(spec, 2, {})).toEqual({ b: 4 });
    expect(completeSquare.initialValues(spec, 3, { b: 6 })).toEqual({ b: 6 });
    expect(completeSquare.initialValues(spec, 4, { b: 6 })).toEqual({ b: 6, corner: 9 });
  });

  it("asks for one multiple-choice answer at the prediction gate", () => {
    const [control, ...rest] = completeSquare.predictionControls(spec, { b: 10 });
    expect(rest).toHaveLength(0);
    expect(control!.variableName).toBe("corner");
    expect(control!.choices).toEqual([5, 10, 25, 100]);
  });
});
