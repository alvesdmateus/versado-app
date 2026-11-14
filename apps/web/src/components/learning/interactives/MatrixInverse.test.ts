import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleSpec } from "@versado/core";
import { forwardOf, matrixInverse, rewindFactors } from "./MatrixInverse";
import { snapTo } from "./rail";
import type { BoardProps, Values } from "./types";

// Bun loads the real fixture at runtime; the web compiler's rootDir excludes API source files.
const contentPath = "../../../../../api/src/content/vectors";
const { vectorsModules }: { vectorsModules: { id: string; interactive: string; spec: ModuleSpec }[] } = await import(contentPath);

const lesson = vectorsModules.find((m) => m.id === "math-inverse-01")!;
const spec = lesson.spec as ModuleSpec;
const target = spec.stage3Prediction.target;

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(matrixInverse.Board, {
    spec, stage: 3, target, values: { a: 1, d: 1 }, verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

function movingFrame(markup: string) {
  return markup.match(/data-moving-frame="true" points="([^"]*)"/)?.[1];
}

describe("matrixInverse", () => {
  it("keeps the forward case separate from the undo response", () => {
    expect(forwardOf(target, spec)).toEqual({ a: 2, d: 0.5 });
    expect(forwardOf({ a: 9, d: 7, forwardA: 3, forwardD: 0.25 }, spec)).toEqual({ a: 3, d: 0.25 });
    expect(matrixInverse.solve(target, spec)).toEqual({ a: 0.5, d: 2 });
    expect(matrixInverse.solve({ forwardA: 3, forwardD: 0.25 }, spec)).toEqual({ a: 1 / 3, d: 4 });
  });

  it("uses positive powers throughout the rewind and freezes a collapsed direction", () => {
    const forward = { a: 2, d: 0.5 };
    expect(rewindFactors(forward, 1)).toEqual(forward);
    expect(rewindFactors(forward, 0)).toEqual({ a: 1, d: 1 });
    expect(rewindFactors(forward, -1)).toEqual({ a: 0.5, d: 2 });
    expect(rewindFactors(forward, 0.5).a).toBeCloseTo(Math.sqrt(2));
    expect(rewindFactors(forward, -0.5).d).toBeCloseTo(Math.sqrt(2));
    for (const rewind of [-1, -0.5, 0, 1]) {
      expect(rewindFactors(forward, rewind, true)).toEqual({ a: 2, d: 0 });
      expect(rewindFactors({ a: 2, d: 0 }, rewind)).toEqual({ a: 2, d: 0 });
    }
  });

  it("replaces exploration controls with two emerald undo rails", () => {
    const controls = matrixInverse.predictionControls(spec, target);
    expect(controls.map((c) => c.variableName)).toEqual(["a", "d"]);
    expect(matrixInverse.axes).toEqual({ a: "x", d: "y" });
    for (const control of controls) {
      expect(control.min).toBe(-4);
      expect(control.max).toBe(4);
      expect(control.step).toBe(1 / 12);
      expect(control.colorToken).toBe("emerald");
      expect(control.choices).toBeUndefined();
    }
  });

  it("starts exploration from content and prediction from neutral undo factors", () => {
    expect(matrixInverse.initialValues(spec, 1, target)).toEqual({ rewind: 1, singular: 0 });
    expect(matrixInverse.initialValues(spec, 2, target)).toEqual({ rewind: 1, singular: 0 });
    expect(matrixInverse.initialValues(spec, 3, target)).toEqual({ a: 1, d: 1 });
    expect(matrixInverse.initialValues(spec, 4, target)).toEqual({ a: 0.5, d: 2 });
    const assisted = { rewind: 1, forwardA: 2, forwardD: 2, a: 0.5, d: 0.5 };
    expect(matrixInverse.initialValues(spec, 3, assisted)).toEqual({ a: 1, d: 1, rewind: 1 });
    expect(matrixInverse.solve(assisted, spec)).toEqual({ a: 0.5, d: 0.5, rewind: 1 });
  });

  it("measures tolerance in undo units, not in forward products", () => {
    expect(matrixInverse.evaluate({ a: 0.52, d: 1.98 }, target, 0.02, spec)).toEqual({ correct: true, delta: 0 });
    expect(matrixInverse.evaluate({ a: 0.521, d: 2 }, target, 0.02, spec).correct).toBe(false);
    expect(matrixInverse.evaluate({ a: 0.5, d: 2.021 }, target, 0.02, spec).correct).toBe(false);
    expect(matrixInverse.evaluate({ a: NaN, d: 2 }, target, 0.02, spec).correct).toBe(false);
  });

  it("diagnoses all three misconceptions using the current forward map", () => {
    for (const task of [target, spec.retentionHooks.reviewTarget!]) {
      const forward = forwardOf(task, spec);
      const mistakes = {
        negate: { a: -forward.a, d: -forward.d },
        same: forward,
        subtract: { a: 1 - forward.a, d: 1 - forward.d },
      };
      for (const [kind, answer] of Object.entries(mistakes)) {
        const verdict = matrixInverse.evaluate(answer, task, 0.02, spec);
        expect(verdict.correct).toBe(false);
        expect(kind).toBe(verdict.kind!);
        expect(verdict.delta).toBeGreaterThan(0);
      }
    }
    expect(matrixInverse.evaluate({ a: 0, d: 0 }, target, 0.02, spec).kind).toBeUndefined();
    expect(matrixInverse.formatDelta({ correct: false, delta: 0.5 })).toBe("Δ = 0.5");
  });

  it("solves every real lesson, review and practice target with reachable rail values", () => {
    const lessons = vectorsModules.filter((m) => m.interactive === "matrix-inverse");
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      const realSpec = lesson.spec as ModuleSpec;
      const tasks = [realSpec.stage3Prediction.target, realSpec.retentionHooks.reviewTarget!, ...(realSpec.practice?.items.map((item) => item.target) ?? [])];
      for (const task of tasks) {
        const solution = matrixInverse.solve(task, realSpec);
        const forward = forwardOf(task, realSpec);
        expect(forward.a * solution.a!).toBeCloseTo(1);
        expect(forward.d * solution.d!).toBeCloseTo(1);
        expect(matrixInverse.evaluate(solution, task, realSpec.stage3Prediction.tolerance, realSpec)).toEqual({ correct: true, delta: 0 });
        const snapped: Values = {};
        for (const control of matrixInverse.predictionControls(realSpec, task)) {
          expect(solution[control.variableName]!).toBeGreaterThanOrEqual(control.min);
          expect(solution[control.variableName]!).toBeLessThanOrEqual(control.max);
          snapped[control.variableName] = snapTo(control, solution[control.variableName]!);
        }
        expect(matrixInverse.evaluate(snapped, task, realSpec.stage3Prediction.tolerance, realSpec).correct).toBe(true);
      }
    }
  });

  it("keeps the result hidden until commitment and ignores exploration singular values", () => {
    const before = render();
    const edited = render({ values: { a: -2, d: 4, singular: 1, rewind: -1 } });
    expect(movingFrame(before)).toBeDefined();
    expect(movingFrame(before)).toBe(movingFrame(edited));
    expect(edited).not.toContain("data-products");
    expect(edited).not.toContain("data-merged-dot");
    expect(edited).not.toContain("data-discrepancy");
    const checked = render({ values: { a: 0.5, d: 2 }, verdict: { correct: true, delta: 0 } });
    expect(movingFrame(checked)).not.toBe(movingFrame(before));
    expect(checked).toContain("data-products");
    const wrong = render({ verdict: { correct: false, delta: 1 } });
    expect(wrong).toContain("data-discrepancy");
    expect(wrong).toContain('stroke-dasharray="6 4"');
    expect(wrong).toContain("gb-march");
    expect(wrong).toContain("Δa");
  });

  it("animates guided practice without a verdict and hides intermediate value labels", () => {
    const guided = render({ values: { a: 0.75, d: 1.5 }, guide: 0.5 });
    expect(movingFrame(guided)).not.toBe(movingFrame(render()));
    expect(guided).not.toContain("data-products");
    // Coordinate ticks may remain; live value tags wait until the demonstration settles.
    expect(guided.match(/<text[^>]*>.*?<\/text>/g)?.every((text) => text.includes('font-size="11"'))).toBe(true);
    expect(render({ values: { a: 0.5, d: 2 }, guide: 1 })).toContain("data-products");
  });

  it("has silent anchoring, informative merged-dot ghosts and a fixed viewport", () => {
    const anchor = render({ stage: 1 });
    expect(anchor).toContain("gb-anchoring");
    expect(anchor).not.toContain("<text");
    expect(anchor.match(/data-merged-dot/g)?.length).toBe(3);
    const collapsed = render({ stage: 2, values: { rewind: 1, singular: 1 } });
    expect(movingFrame(collapsed)).toBe(movingFrame(render({ stage: 2, values: { rewind: -1, singular: 1 } })));
    expect(collapsed).not.toContain("data-undo-factors");
    expect(anchor.match(/viewBox="[^"]*"/)?.[0]).toBe(render().match(/viewBox="[^"]*"/)?.[0]);
  });
});
