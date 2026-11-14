import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { lineAngle, matrixEigenvector, probeImage } from "./MatrixEigenvector";
import { INTERACTIVES } from "./index";
import type { BoardProps, Values } from "./types";

// Load the real source at runtime: the web tsconfig's rootDir intentionally excludes apps/api.
const vectorsPath: string = "../../../../../api/src/content/vectors";
const { vectorsModules } = await import(vectorsPath) as { vectorsModules: LearningModuleInput[] };

const lesson = vectorsModules.find((m) => m.interactive === "matrix-eigenvector")!;
const spec = lesson.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const tolerance = spec.stage3Prediction.tolerance;
const review = spec.retentionHooks.reviewTarget;
const assisted = { probeAngle: 45, answer: 0 };

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(matrixEigenvector.Board, {
    spec, stage: 3, values: { probeAngle: 20 }, target, verdict: null,
    anchorT: 1, changed: null, ...overrides,
  }));
}

describe("matrixEigenvector", () => {
  it("registers the content slug", () => {
    expect(INTERACTIVES[lesson.interactive]).toBe(matrixEigenvector);
  });

  it("solves angle representatives and the assisted landing without copying matrix context", () => {
    expect(matrixEigenvector.solve(target, spec)).toEqual({ probeAngle: 45 });
    expect(matrixEigenvector.solve(review, spec)).toEqual({ probeAngle: 135 });
    expect(matrixEigenvector.solve(assisted, spec)).toEqual(assisted);
    expect(matrixEigenvector.solve({ ...review, probeAngle: -45 }, spec)).toEqual({ probeAngle: 315 });
  });

  it("accepts every preserved line, including opposite representatives", () => {
    for (const probeAngle of [45, 135, 225, 315, -45, 405]) {
      expect(matrixEigenvector.evaluate({ probeAngle }, target, tolerance, spec).correct).toBe(true);
    }
    expect(probeImage(45, target, spec).factor).toBeCloseTo(2);
    expect(probeImage(135, target, spec).factor).toBeCloseTo(1);
  });

  it("accepts a negative stretch and applies review overrides before fixed entries", () => {
    expect(probeImage(135, review, spec).factor).toBeCloseTo(-1);
    expect(matrixEigenvector.evaluate({ probeAngle: 315 }, review, tolerance, spec)).toEqual({ correct: true, delta: 0 });
    const diagonal = { a: 2, b: 0, c: 0, d: -1, probeAngle: 90 };
    expect(matrixEigenvector.evaluate({ probeAngle: 90, a: 99, d: 99 }, diagonal, 0, spec).correct).toBe(true);
    expect(matrixEigenvector.evaluate({ probeAngle: 45 }, diagonal, 0, spec).correct).toBe(false);
  });

  it("excludes the previous line modulo 180 without excluding the flipped second line", () => {
    for (const probeAngle of [45, 225, -135, 405]) {
      expect(matrixEigenvector.evaluate({ probeAngle }, review, tolerance, spec).correct).toBe(false);
    }
    for (const probeAngle of [135, 315]) {
      expect(matrixEigenvector.evaluate({ probeAngle }, review, tolerance, spec).correct).toBe(true);
    }
    expect(lineAngle(45, 225)).toBe(0);
    expect(lineAngle(-5, 175)).toBe(0);
    expect(lineAngle(359, 1)).toBe(2);
  });

  it("uses angular deviation rather than coordinate or representative tolerance", () => {
    const identity = { a: 1, b: 0, c: 0, d: 1, probeAngle: 45 };
    const quarterTurn = { a: 0, b: -1, c: 1, d: 0, probeAngle: 45 };
    const halfTurn = { a: -1, b: 0, c: 0, d: -1, probeAngle: 45 };
    for (const probeAngle of [0, 25, 90, 170, 355]) {
      expect(matrixEigenvector.evaluate({ probeAngle }, identity, 0, spec).correct).toBe(true);
      expect(matrixEigenvector.evaluate({ probeAngle }, halfTurn, 0, spec).correct).toBe(true);
      expect(matrixEigenvector.evaluate({ probeAngle }, quarterTurn, 1, spec)).toEqual({ correct: false, delta: 90, kind: "sideways" });
    }
    expect(matrixEigenvector.evaluate({ probeAngle: 46 }, target, 0.6, spec).correct).toBe(true);
    expect(matrixEigenvector.evaluate({ probeAngle: 46 }, target, 0.4, spec).kind).toBe("sideways");
    const rotated: Values = { a: Math.cos(Math.PI / 180), b: -Math.sin(Math.PI / 180), c: Math.sin(Math.PI / 180), d: Math.cos(Math.PI / 180) };
    expect(matrixEigenvector.evaluate({ probeAngle: 0 }, rotated, 1, spec).correct).toBe(true);
    expect(matrixEigenvector.evaluate({ probeAngle: 0 }, rotated, 0.99, spec).correct).toBe(false);
  });

  it("handles the zero eigenvalue and rejects absent or nonfinite probes", () => {
    expect(matrixEigenvector.evaluate({ probeAngle: 90 }, { a: 2, b: 0, c: 0, d: 0 }, 0, spec).correct).toBe(true);
    // Angular tolerance must not change just because the entire warp is tiny.
    expect(matrixEigenvector.evaluate({ probeAngle: 0 }, { a: 0, b: -1e-15, c: 1e-15, d: 0 }, 1, spec).kind).toBe("sideways");
    const invalid: Values[] = [{}, { probeAngle: NaN }, { probeAngle: Infinity }];
    for (const values of invalid) {
      expect(matrixEigenvector.evaluate(values, target, tolerance, spec).correct).toBe(false);
    }
  });

  it("names sideways misses in both modes and never treats a flip as a sign error", () => {
    expect(matrixEigenvector.evaluate({ probeAngle: 0 }, target, tolerance, spec).kind).toBe("sideways");
    expect(matrixEigenvector.evaluate({ probeAngle: 135 }, review, tolerance, spec).kind).toBeUndefined();
    expect(matrixEigenvector.evaluate({ answer: 1 }, assisted, 100, spec)).toEqual({ correct: false, delta: 90, kind: "sideways" });
    expect(matrixEigenvector.evaluate({ answer: 0 }, assisted, 0, spec)).toEqual({ correct: true, delta: 0 });
    expect(matrixEigenvector.evaluate({}, assisted, 1, spec).correct).toBe(false);
    expect(matrixEigenvector.evaluate({ answer: 2 }, assisted, 1, spec).correct).toBe(false);
    expect(matrixEigenvector.formatDelta({ correct: false, delta: 12.5 })).toBe("12.5°");
  });

  it("starts from spec controls without leaking a target or preselecting an assisted answer", () => {
    for (const stage of [1, 2, 3] as const) {
      expect(matrixEigenvector.initialValues(spec, stage, review)).toEqual({ probeAngle: 20 });
    }
    expect(matrixEigenvector.initialValues(spec, 3, assisted)).toEqual({ probeAngle: 45 });
    expect(matrixEigenvector.initialValues(spec, 4, review)).toEqual({ probeAngle: 135 });
    const customized = { ...spec, stage2Exploration: { ...spec.stage2Exploration, controls: spec.stage2Exploration.controls.map((c) => ({ ...c, initial: 75 })) } };
    expect(matrixEigenvector.initialValues(customized, 3, review)).toEqual({ probeAngle: 75 });
  });

  it("exposes the angle slider plus an independent landing choice only when assisted", () => {
    const controls = matrixEigenvector.predictionControls(spec, target);
    expect(controls).toEqual([{ variableName: "probeAngle", label: spec.stage2Exploration.controls[0]!.label, min: 0, max: 355, step: 5, colorToken: "amber" }]);
    const assistedControls = matrixEigenvector.predictionControls(spec, assisted);
    expect(assistedControls.map((c) => c.variableName)).toEqual(["probeAngle", "answer"]);
    expect(assistedControls[1]!.choices).toEqual([0, 1]);
  });

  it("covers the real lesson, review and every practice target with reachable solutions", () => {
    const lessons = vectorsModules.filter((m) => m.interactive === "matrix-eigenvector");
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      const spec = lesson.spec as ModuleSpec;
      const targets = [spec.stage3Prediction.target, spec.retentionHooks.reviewTarget, ...(spec.practice?.items.map((item) => item.target) ?? [])];
      for (const target of targets) {
        const solution = matrixEigenvector.solve(target, spec);
        expect(matrixEigenvector.evaluate(solution, target, spec.stage3Prediction.tolerance, spec).correct).toBe(true);
        for (const c of matrixEigenvector.predictionControls(spec, target)) {
          const value = solution[c.variableName]!;
          expect(value).toBeGreaterThanOrEqual(c.min);
          expect(value).toBeLessThanOrEqual(c.max);
          if (c.choices) expect(c.choices).toContain(value);
          else expect((value - c.min) / c.step).toBeCloseTo(Math.round((value - c.min) / c.step));
        }
      }
      for (const item of spec.practice?.items ?? []) {
        const start = matrixEigenvector.initialValues(spec, 3, item.target);
        const solution = matrixEigenvector.solve(item.target, spec);
        for (const name of item.presetControls ?? []) start[name] = solution[name]!;
        if (item.fade === "assisted") {
          expect(start.probeAngle).toBe(45);
          expect(start.answer).toBeUndefined();
          expect(matrixEigenvector.predictionControls(spec, item.target).some((c) => !(item.presetControls ?? []).includes(c.variableName))).toBe(true);
        }
      }
      for (const kind of Object.keys(spec.stage3Prediction.adaptiveFeedback.byKind ?? {})) {
        expect(String(matrixEigenvector.evaluate({ probeAngle: 0 }, spec.stage3Prediction.target, spec.stage3Prediction.tolerance, spec).kind)).toBe(kind);
      }
    }
  });

  it("hides the output and alignment glow before commitment and reveals diagnostics afterwards", () => {
    const before = render({ values: { probeAngle: 45 } });
    expect(before).not.toContain("data-probe-output");
    expect(before).not.toContain('stroke-width="10"');
    expect(before).not.toContain("λ =");
    expect(before).not.toContain("× ");
    const after = render({ values: { probeAngle: 0 }, verdict: matrixEigenvector.evaluate({ probeAngle: 0 }, target, tolerance, spec) });
    expect(after).toContain("data-probe-output");
    expect(after).toContain('stroke-dasharray="6 4"');
    expect(after).toContain("gb-march");
    expect(after).toContain("18°");
  });

  it("keeps Stage 1 silent, the viewport fixed, and the guided demonstration visible", () => {
    const anchor = render({ stage: 1 });
    expect(anchor).toContain("gb-anchoring");
    expect(anchor).not.toContain("<text");
    const box = (markup: string) => markup.match(/viewBox="([^"]+)"/)?.[1];
    expect(box(anchor)).toBe(box(render()));
    expect(box(render({ stage: 4 }))).toBe(box(anchor));
    const guide = render({ guide: 0.5, values: { probeAngle: 32.5 } });
    expect(guide).toContain("data-probe-output");
    expect(guide).not.toContain("<text");
    const formal = render({ stage: 4, values: { probeAngle: 45 } });
    expect(formal).toContain("λ = +2");
    expect(formal).toContain(">v</text>");
    expect(formal).toContain(">A</text>");
  });

  it("renders both numbered assisted candidates while preserving the hidden output and preset lock", () => {
    const controls = matrixEigenvector.predictionControls(spec, assisted);
    const before = render({ target: assisted, values: { probeAngle: 45 }, input: { controls, locked: ["probeAngle"], onChange() {} } });
    expect(before).toContain('data-landing="0"');
    expect(before).toContain('data-landing="1"');
    expect(before).not.toContain("data-probe-output");
    expect(before).not.toContain("gb-handle");
    const after = render({ target: assisted, values: { probeAngle: 45, answer: 1 }, verdict: { correct: false, delta: 90, kind: "sideways" } });
    expect(after).toContain("90°");
    expect(after).toContain("gb-march");
  });
});
