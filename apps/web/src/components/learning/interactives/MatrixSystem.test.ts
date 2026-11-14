import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { clipDiscrepancy, matrixSystem, systemOf, transform } from "./MatrixSystem";
import type { BoardProps, Values } from "./types";

// Load the real API content at runtime: web's rootDir deliberately excludes apps/api.
const contentPath = "../../../../../api/src/content/vectors";
const { vectorsModules } = await import(contentPath) as { vectorsModules: LearningModuleInput[] };
const lessons = vectorsModules.filter((lesson) => lesson.interactive === "matrix-system");
const lesson = lessons[0]!;
const spec = lesson.spec as ModuleSpec;
const target = spec.stage3Prediction.target;

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(matrixSystem.Board, {
    spec, stage: 3, target, values: { x: 0, y: 0 }, verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

describe("matrixSystem", () => {
  it("uses column-vector conventions and keeps input coordinates out of the map context", () => {
    const m = systemOf({ bx: 0, by: 2, x: -1, y: 2 }, spec);
    expect(m).toEqual({ a: 2, b: 1, c: 0, d: 1, bx: 0, by: 2 });
    expect(transform(m, { x: -1, y: 2 })).toEqual({ x: 0, y: 2 });
    expect(systemOf({}, spec).bx).toBe(3);
    expect(systemOf({ a: 0, b: -1, c: 1, d: 0 }, spec).a).toBe(0);
  });

  it("solves inputs from explicit targets or by inverting the fixed map", () => {
    expect(matrixSystem.solve(target, spec)).toEqual({ x: 1, y: 1 });
    expect(matrixSystem.solve({ bx: 0, by: 2 }, spec)).toEqual({ x: -1, y: 2 });
    const rotated = { a: 0, b: -1, c: 1, d: 0, bx: -2, by: 1 };
    expect(matrixSystem.solve(rotated, spec)).toEqual({ x: 1, y: 2 });
  });

  it("evaluates the transformed landing against the pin, rather than copying target input coordinates", () => {
    expect(matrixSystem.evaluate({ x: 1, y: 1 }, target, 0, spec)).toEqual({ correct: true, delta: 0 });
    expect(matrixSystem.evaluate({ x: 0, y: 1 }, target, 0, spec)).toEqual({ correct: false, delta: -2 });
    expect(matrixSystem.evaluate({ x: 1, y: 1 }, { ...target, bx: 4 }, 0, spec).correct).toBe(false);
    expect(matrixSystem.evaluate({ x: 1.04, y: 1 }, target, 0.1, spec).correct).toBe(true);
    expect(matrixSystem.evaluate({ x: 1.1, y: 1 }, target, 0.1, spec).correct).toBe(false);
    expect(matrixSystem.evaluate({}, target, 0, spec).correct).toBe(false);
    expect(matrixSystem.evaluate({ x: NaN, y: 1 }, target, 0, spec).correct).toBe(false);
  });

  it("names the destination misconception for the lesson and overridden review pin", () => {
    expect(matrixSystem.evaluate({ x: 3, y: 1 }, target, 0, spec)).toEqual({ correct: false, delta: 4, kind: "destination" });
    expect(matrixSystem.evaluate({ x: 0, y: 2 }, { bx: 0, by: 2, x: -1, y: 2 }, 0, spec).kind).toBe("destination");
    // A fixed point really is a solution, even when its address is also the pin's.
    expect(matrixSystem.evaluate({ x: 3, y: 1 }, { a: 1, b: 0, c: 0, d: 1 }, 0, spec).correct).toBe(true);
    expect(matrixSystem.formatDelta({ correct: false, delta: 4 })).toBe("+4");
  });

  it("accepts all singular preimages, and cannot solve or accept an unreachable pin", () => {
    const collapsed = { a: 1, b: 1, c: 0, d: 0, bx: 2, by: 0 };
    for (const values of [{ x: 0, y: 2 }, { x: 1, y: 1 }, { x: 3, y: -1 }]) {
      expect(matrixSystem.evaluate(values, collapsed, 0, spec).correct).toBe(true);
    }
    expect(matrixSystem.evaluate(matrixSystem.solve(collapsed, spec), collapsed, 0, spec).correct).toBe(true);
    expect(matrixSystem.solve({ ...collapsed, by: 1 }, spec)).toEqual({});
    expect(matrixSystem.evaluate({ x: 1, y: 1 }, { ...collapsed, by: 1 }, 0, spec).correct).toBe(false);
  });

  it("clips off-plane discrepancy segments along the true gap, rather than along the output arrow", () => {
    const range = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
    expect(clipDiscrepancy(range, { x: 7, y: -1 }, { x: 3, y: 1 })).toEqual({ from: { x: 5, y: 0 }, to: { x: 3, y: 1 } });
    expect(clipDiscrepancy(range, { x: 0, y: 8 }, { x: 0, y: 2 })).toEqual({ from: { x: 0, y: 5 }, to: { x: 0, y: 2 } });
    expect(clipDiscrepancy(range, { x: 7, y: 8 }, { x: 7, y: 2 })).toBeNull();
  });

  it("starts from spec controls, clears the gate, and solves formalization without merging case context", () => {
    const changed = { ...spec, stage2Exploration: { ...spec.stage2Exploration, controls: spec.stage2Exploration.controls.map((c) => ({ ...c, initial: c.variableName === "x" ? -2 : 3 })) } };
    expect(matrixSystem.initialValues(changed, 1, target)).toEqual({ x: -2, y: 3 });
    expect(matrixSystem.initialValues(changed, 2, target)).toEqual({ x: -2, y: 3 });
    expect(matrixSystem.initialValues(changed, 3, { ...target, bx: -3 })).toEqual({ x: 0, y: 0 });
    expect(matrixSystem.initialValues(spec, 4, target)).toEqual({ x: 1, y: 1 });
    expect(matrixSystem.axes).toEqual({ x: "x", y: "y" });
    expect(matrixSystem.predictionControls(spec, target)).toEqual(spec.stage2Exploration.controls.map((c) => ({
      variableName: c.variableName, label: c.label, min: -4, max: 4, step: 0.5, colorToken: "blue",
    })));
  });

  it("solves every real lesson, review and practice target, with legal control values and named feedback", () => {
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      const s = lesson.spec as ModuleSpec;
      const targets: Values[] = [s.stage3Prediction.target, s.retentionHooks.reviewTarget!, ...(s.practice?.items.map((item) => item.target) ?? [])];
      for (const t of targets) {
        const solved = matrixSystem.solve(t, s);
        expect(matrixSystem.evaluate(solved, t, s.stage3Prediction.tolerance, s).correct).toBe(true);
        for (const c of matrixSystem.predictionControls(s, t)) {
          const value = solved[c.variableName]!;
          expect(value).toBeGreaterThanOrEqual(c.min);
          expect(value).toBeLessThanOrEqual(c.max);
          expect((value - c.min) / c.step).toBeCloseTo(Math.round((value - c.min) / c.step));
        }
      }
      for (const item of s.practice?.items ?? []) {
        for (const key of item.presetControls ?? []) expect(matrixSystem.solve(item.target, s)[key]).toBeDefined();
      }
      const m = systemOf(s.stage3Prediction.target, s);
      const verdict = matrixSystem.evaluate({ x: m.bx, y: m.by }, s.stage3Prediction.target, 0, s);
      expect(verdict.kind).toBe("destination");
      expect(s.stage3Prediction.adaptiveFeedback.byKind?.[verdict.kind!]).toBeDefined();
    }
  });

  it("keeps anchoring silent, with an informative final-frame ghost and fixed geometry", () => {
    const silent = render({ stage: 1 });
    expect(silent).toContain("gb-anchoring");
    expect(silent).not.toContain("<text");
    expect(silent).toContain('opacity="0.3"');
    expect(silent).toContain('data-system="shadow"');
    const boxes = [1, 2, 3, 4].map((stage) => render({ stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)?.[1]);
    expect(new Set(boxes).size).toBe(1);
  });

  it("hides the shadow, its coordinates, discrepancy and diagnostics until commitment", () => {
    const waiting = render({ values: { x: 2, y: -1 }, target: { bx: 0, by: 2, x: -1, y: 2 } });
    expect(waiting).toContain('data-system="pin"');
    expect(waiting).not.toContain('data-system="shadow"');
    expect(waiting).not.toContain('data-system="gap"');
    expect(waiting).not.toContain("Δ");
    expect(waiting).not.toContain("(3, −1)");
    const revealed = render({ values: { x: 3, y: 1 }, verdict: { correct: false, delta: 4, kind: "destination" } });
    expect(revealed).toContain('data-system="shadow"');
    expect(revealed).toContain('data-system="gap"');
    expect(revealed).toContain('stroke-dasharray="6 4"');
    expect(revealed).toContain("gb-march");
    expect(revealed).toContain("Δ (−4, 0)");
  });

  it("shows the guided shadow through the demo, delays tags, and renders locked assisted rails", () => {
    const moving = render({ guide: 0.5, values: { x: 0.5, y: 0.5 } });
    expect(moving).toContain('data-system="shadow"');
    expect(moving).not.toContain("(0.5, 0.5)");
    expect(render({ guide: 1, values: { x: 1, y: 1 } })).toContain("(1, 1)");
    const assisted = render({ values: { x: 2, y: 0 }, input: { controls: matrixSystem.predictionControls(spec, target), onChange() {}, locked: ["x"] } });
    expect(assisted).toContain('data-locked="true"');
    expect(assisted).toContain('aria-label="Input across"');
    expect(assisted).toContain('aria-label="Input up"');
    expect(assisted).toContain('cursor:ns-resize');
  });

  it("lets keyboard input move both coordinates, and preserves an assisted x preset", () => {
    const calls: [string, number][] = [];
    const props: BoardProps = {
      spec, stage: 3, target, values: { x: 2, y: 0 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: matrixSystem.predictionControls(spec, target), onChange: (name, value) => calls.push([name, value]) },
    };
    const view = mount(createElement(matrixSystem.Board, props));
    try {
      fireEvent.keyDown(view.getByRole("slider", { name: "Input across" }), { key: "ArrowRight" });
      fireEvent.keyDown(view.getByRole("slider", { name: "Input up" }), { key: "ArrowDown" });
      expect(calls).toEqual([["x", 2.5], ["y", -0.5]]);
      calls.length = 0;
      view.rerender(createElement(matrixSystem.Board, { ...props, input: { ...props.input!, locked: ["x"] } }));
      fireEvent.keyDown(view.getByRole("slider", { name: "Input across" }), { key: "ArrowRight" });
      fireEvent.keyDown(view.getByRole("slider", { name: "Input up" }), { key: "ArrowDown" });
      expect(calls).toEqual([["y", -0.5]]);
      calls.length = 0;
      const svg = view.container.querySelector("svg")!;
      const handle = view.container.querySelector(".gb-handle")!;
      Object.defineProperty(svg, "getScreenCTM", { value: () => null });
      Object.defineProperty(handle, "setPointerCapture", { value() {} });
      fireEvent.pointerDown(handle, { clientX: 58, clientY: 198, pointerId: 1 });
      expect(calls).toEqual([["y", -1]]);
    } finally {
      view.unmount();
    }
  });

  it("labels formalization with the specified colors and compares the two singular pins", () => {
    const formal = render({ stage: 4, values: matrixSystem.solve(target, spec) });
    expect(formal).toContain("x = (1, 1)");
    expect(formal).toContain("Ax = (3, 1)");
    expect(formal).toContain("b = (3, 1)");
    expect(formal).toContain("A = [2 1; 0 1]");
    expect(formal).toContain('data-system="singular-comparison"');
    expect(formal).toContain("(2, 0): ∞");
    expect(formal).toContain("(2, 1): 0");
  });
});
