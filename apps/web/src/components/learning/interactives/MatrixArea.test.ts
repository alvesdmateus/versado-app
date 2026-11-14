import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleSpec } from "@versado/core";
// Load the real content at runtime: the web tsconfig rootDir excludes API source.
const contentPath = "../../../../../api/src/content/vectors";
const { vectorsModules } = await import(contentPath) as { vectorsModules: { id: string; interactive: string; spec: ModuleSpec }[] };
import { alignmentDelta, matrixArea, modeOf } from "./MatrixArea";
import type { BoardProps, Values } from "./types";

const lessons = vectorsModules.filter((lesson) => lesson.interactive === "matrix-area");
const diagonal = lessons.find((lesson) => lesson.id === "math-determinant-01")!.spec as ModuleSpec;
const collapse = lessons.find((lesson) => lesson.id === "math-singular-01")!.spec as ModuleSpec;
const render = (spec: ModuleSpec, props: Partial<BoardProps> = {}) => renderToStaticMarkup(createElement(matrixArea.Board, {
  spec, stage: 3, values: matrixArea.initialValues(spec, 3, spec.stage3Prediction.target),
  target: spec.stage3Prediction.target, verdict: null, anchorT: 1, changed: null, ...props,
}));

function checkSolution(target: Values, spec: ModuleSpec) {
  const solved = matrixArea.solve(target, spec);
  expect(matrixArea.evaluate(solved, target, spec.stage3Prediction.tolerance, spec)).toEqual({ correct: true, delta: 0 });
  for (const control of matrixArea.predictionControls(spec, target)) {
    const value = solved[control.variableName]!;
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(control.min);
    expect(value).toBeLessThanOrEqual(control.max);
    expect(Math.abs((value - control.min) / control.step - Math.round((value - control.min) / control.step))).toBeLessThan(1e-6);
    if (control.choices) expect(control.choices).toContain(value);
  }
}

describe("matrixArea diagonal mode", () => {
  it("infers its mode and preserves the spec's exploration values and fixed zero lean", () => {
    expect(modeOf(diagonal)).toBe("diagonal");
    expect(matrixArea.initialValues(diagonal, 2, { area: 3 })).toEqual({ a: 1, d: 1, b: 0, c: 0 });
    expect(matrixArea.initialValues(diagonal, 3, { a: 2, area: 3 })).toEqual({ a: 1, d: 1 });
    expect(matrixArea.initialValues(diagonal, 4, { area: 3 })).toEqual(matrixArea.solve({ area: 3 }, diagonal));
  });

  it("uses quarter-step signed rails, and solves an assisted preset without changing it", () => {
    expect(matrixArea.axes).toEqual({ a: "x", d: "y" });
    const controls = matrixArea.predictionControls(diagonal, { area: 3 });
    expect(controls.map((c) => [c.variableName, c.min, c.max, c.step, c.colorToken])).toEqual([
      ["a", -3, 3, 0.25, "blue"], ["d", -3, 3, 0.25, "amber"],
    ]);
    expect(matrixArea.solve({ a: 2, area: 3 }, diagonal)).toEqual({ a: 2, d: 1.5 });
    for (const area of [-9, -3, -2, 0, 2, 3, 9]) checkSolution({ area }, diagonal);
    expect(matrixArea.solve({ a: 0, area: 0 }, diagonal)).toEqual({ a: 0, d: 1 });
  });

  it("accepts all matching pairs, both-negative stretches, and area-unit tolerance", () => {
    for (const values of [{ a: 1, d: 3 }, { a: 2, d: 1.5 }, { a: -2, d: -1.5 }]) {
      expect(matrixArea.evaluate(values, { area: 3 }, 0.05, diagonal).correct).toBe(true);
    }
    expect(matrixArea.evaluate({ a: 2, d: 1.52 }, { area: 3 }, 0.05, diagonal).correct).toBe(true);
    expect(matrixArea.evaluate({ a: 2, d: 1.53 }, { area: 3 }, 0.05, diagonal).correct).toBe(false);
    expect(matrixArea.evaluate({ a: 0, d: 3 }, { area: 0 }, 0, diagonal).correct).toBe(true);
  });

  it("names unsigned area mistakes in either orientation and reports the signed discrepancy", () => {
    expect(matrixArea.evaluate({ a: -2, d: 1.5 }, { area: 3 }, 0.05, diagonal)).toEqual({ correct: false, delta: -6, kind: "unsigned" });
    expect(matrixArea.evaluate({ a: 2, d: 1 }, { area: -2 }, 0.05, diagonal)).toEqual({ correct: false, delta: 4, kind: "unsigned" });
    expect(matrixArea.evaluate({ a: 2, d: 2 }, { area: 3 }, 0.05, diagonal)).toEqual({ correct: false, delta: 1 });
    expect(matrixArea.formatDelta({ correct: false, delta: -6 })).toBe("−6");
  });
});

describe("matrixArea collapse mode", () => {
  it("keeps the second arrow free and starts without copying the expected angle", () => {
    expect(modeOf(collapse)).toBe("collapse");
    expect(matrixArea.initialValues(collapse, 2, { angle: 45 })).toEqual({ firstAngle: 45, firstLength: 2, secondLength: 2, angle: 90 });
    expect(matrixArea.initialValues(collapse, 3, { firstAngle: 135, angle: 135 })).toEqual({ angle: 90 });
    expect(matrixArea.initialValues(collapse, 4, { firstAngle: 135, angle: 135 })).toEqual({ angle: 135 });
    const controls = matrixArea.predictionControls(collapse, { angle: 45 });
    expect(controls).toHaveLength(1);
    expect(controls[0]).toMatchObject({ variableName: "angle", min: 0, max: 180, step: 5, colorToken: "amber" });
  });

  it("accepts collinearity modulo 180, including endpoints and multiple turns", () => {
    for (const angle of [45, 225, -135, 405]) {
      expect(matrixArea.evaluate({ angle }, { angle: 45 }, 1, collapse)).toEqual({ correct: true, delta: 0 });
    }
    expect(alignmentDelta(180, 0)).toBe(0);
    expect(matrixArea.evaluate({ angle: 180 }, { firstAngle: 0, angle: 0 }, 0, collapse).correct).toBe(true);
    expect(matrixArea.evaluate({ angle: 46 }, { angle: 45 }, 1, collapse).correct).toBe(true);
    expect(matrixArea.evaluate({ angle: 46.01 }, { angle: 45 }, 1, collapse).correct).toBe(false);
  });

  it("uses task context ahead of fixed values without leaking it into the response", () => {
    const review = { firstAngle: 135, angle: 135 };
    expect(matrixArea.solve(review, collapse)).toEqual({ angle: 135 });
    expect(matrixArea.evaluate({ angle: 135 }, review, 1, collapse).correct).toBe(true);
    expect(matrixArea.evaluate({ angle: 45 }, review, 1, collapse).kind).toBe("perpendicular");
    expect(matrixArea.evaluate({ angle: 45, firstAngle: 45 }, review, 1, collapse).correct).toBe(false);
  });

  it("distinguishes a remaining sliver from a perpendicular pair", () => {
    expect(matrixArea.evaluate({ angle: 50 }, { angle: 45 }, 1, collapse)).toEqual({ correct: false, delta: 5, kind: "thin" });
    expect(matrixArea.evaluate({ angle: 135 }, { angle: 45 }, 1, collapse)).toEqual({ correct: false, delta: -90, kind: "perpendicular" });
    expect(matrixArea.evaluate({}, { angle: 45 }, 1, collapse).correct).toBe(false);
    expect(matrixArea.evaluate({ angle: NaN }, { angle: 45 }, 1, collapse).correct).toBe(false);
  });

  it("adds an unanswered result choice alongside the assisted angle preset", () => {
    const target = { angle: 45, answer: 0 };
    const controls = matrixArea.predictionControls(collapse, target);
    expect(controls.map((c) => c.variableName)).toEqual(["angle", "answer"]);
    expect(controls[1]).toMatchObject({ choices: [0, 1], choiceLabels: {
      0: "lesson.choice.matrix-area.overlapping", 1: "lesson.choice.matrix-area.separate",
    } });
    const start = matrixArea.initialValues(collapse, 3, target);
    start.angle = matrixArea.solve(target, collapse).angle!;
    expect(start).toEqual({ angle: 45 });
    expect(start.answer).toBeUndefined();
    expect(matrixArea.evaluate(start, target, 1, collapse).correct).toBe(false);
    expect(matrixArea.evaluate({ ...start, answer: 1 }, target, 1, collapse).kind).toBe("thin");
    expect(matrixArea.evaluate({ ...start, answer: 0 }, target, 1, collapse)).toEqual({ correct: true, delta: 0 });
  });
});

describe("matrixArea reveal and practice", () => {
  it("hides the computed diagonal area until commitment and shows the signed target", () => {
    const before = render(diagonal, { values: { a: 2, d: 3 } });
    expect(before).toContain("? → 3");
    expect(before).not.toContain(">6</text>");
    const after = render(diagonal, { values: { a: 2, d: 3 }, verdict: { correct: false, delta: 3 } });
    expect(after).toContain(">6</text>");
    expect(after).toContain('data-matrix-area="discrepancy"');
    expect(after).toContain('stroke-dasharray="6 4"');
    expect(after).toContain("gb-march");
  });

  it("hides the folded tile and landings until commitment (the plain plane stays), including assisted practice", () => {
    for (const target of [{ angle: 45 }, { angle: 45, answer: 0 }] as Values[]) {
      const before = render(collapse, { target, values: { angle: 45 } });
      expect(before).not.toContain('data-matrix-area="tile"');
      expect(before).not.toContain('data-matrix-area="landings"');
      // The plain lattice gives nothing away, so the learner keeps their bearings.
      expect(before).toContain('fill="var(--color-gb-peg)"');
      const after = render(collapse, { target, values: { angle: "answer" in target ? 45 : 50, answer: 1 }, verdict: { correct: false, delta: 5, kind: "thin" } });
      expect(after).toContain('data-matrix-area="tile"');
      expect(after).toContain('data-matrix-area="landings"');
      expect(after).toContain('stroke-dasharray="6 4"');
    }
  });

  it("reveals guided practice, colors a flip violet, and keeps a fixed viewport across stages", () => {
    const guided = render(collapse, { guide: 0.7, values: { angle: 60 } });
    expect(guided).toContain('data-matrix-area="landings"');
    expect(guided).not.toContain(">60°</text>");
    const flipped = render(diagonal, { stage: 2, values: { a: 2, d: -1 } });
    expect(flipped).toContain('stroke="var(--color-band-violet)"');
    const viewBoxes = [1, 2, 3, 4].map((stage) => render(diagonal, { stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)![1]);
    expect(new Set(viewBoxes).size).toBe(1);
    const anchor = render(collapse, { stage: 1 });
    expect(anchor).toContain("gb-anchoring");
    expect(anchor).not.toContain("<text");
    expect(anchor).toContain('stroke-dasharray="4 5"');
  });

  it("keeps assisted presets locked and renders matching formal symbols", () => {
    const assisted = render(diagonal, { target: { a: 2, area: 3 }, values: { a: 2, d: 1 }, input: {
      controls: matrixArea.predictionControls(diagonal, { a: 2, area: 3 }), locked: ["a"], onChange() {},
    } });
    expect(assisted.match(/class="gb-handle"/g)).toHaveLength(1);
    expect(assisted).toContain('aria-disabled="true"');
    const formal = render(collapse, { stage: 4 });
    expect(formal).toContain("Au = Av");
    expect(formal).toContain("det(A) = 0");
    expect(render(diagonal, { stage: 4 })).toContain("b·c = 0");
  });
});

describe("matrixArea real lesson contract", () => {
  it("solves every lesson, spaced review and faded-practice target on its available controls", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["math-determinant-01", "math-singular-01"]);
    for (const lesson of lessons) {
      const spec = lesson.spec as ModuleSpec;
      const targets = [spec.stage3Prediction.target, spec.retentionHooks.reviewTarget!, ...(spec.practice?.items.map((item) => item.target) ?? [])];
      for (const target of targets) checkSolution(target, spec);
      for (const item of spec.practice?.items ?? []) {
        const solution = matrixArea.solve(item.target, spec);
        const initial = matrixArea.initialValues(spec, 3, item.target);
        for (const name of item.presetControls ?? []) initial[name] = solution[name]!;
        for (const name of item.presetControls ?? []) expect(initial[name]).toBe(item.target[name]);
        if ("answer" in item.target) expect(initial.answer).toBeUndefined();
      }
    }
  });
});
