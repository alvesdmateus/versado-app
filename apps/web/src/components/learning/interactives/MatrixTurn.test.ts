import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { matrixTurn, rotatePoint, turnCase } from "./MatrixTurn";
import type { BoardProps, Values } from "./types";

// Load the real content at runtime: its source is outside the web tsconfig's rootDir.
const contentPath = "../../../../../api/src/content/vectors";
const { vectorsModules } = await import(contentPath) as { vectorsModules: LearningModuleInput[] };

const lesson = vectorsModules.find((module) => module.id === "math-matrix-rotation-01")!;
const spec = lesson.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const render = (overrides: Partial<BoardProps> = {}) => renderToStaticMarkup(createElement(matrixTurn.Board, {
  spec, stage: 3, target, values: { x: 0, y: 0 }, verdict: null, anchorT: 1, changed: null, ...overrides,
}));

describe("matrixTurn", () => {
  it("rotates exact quarter turns anticlockwise, clockwise and through a half turn", () => {
    expect(rotatePoint({ x: 2, y: 1 }, 1)).toEqual({ x: -1, y: 2 });
    expect(rotatePoint({ x: 2, y: 1 }, -1)).toEqual({ x: 1, y: -2 });
    expect(rotatePoint({ x: 2, y: 1 }, 2)).toEqual({ x: -2, y: -1 });
    expect(rotatePoint({ x: 2, y: 1 }, -2)).toEqual({ x: -2, y: -1 });
    expect(rotatePoint({ x: 2, y: 1 }, 0)).toEqual({ x: 2, y: 1 });
    expect(rotatePoint({ x: 2, y: 1 }, 4)).toEqual({ x: 2, y: 1 });
  });

  it("reads fixed context and lets the task override it", () => {
    expect(turnCase(target, spec)).toEqual({ turn: 1, p: { x: 2, y: 1 } });
    expect(turnCase({ turn: -1, px: -3, py: 2 }, spec)).toEqual({ turn: -1, p: { x: -3, y: 2 } });
    expect(matrixTurn.solve({ turn: -1, px: -3, py: 2 }, spec)).toEqual({ turn: -1, x: 2, y: 3 });
    expect(matrixTurn.solve(target, spec)).toEqual({ turn: 1, x: -1, y: 2 });
  });

  it("starts prediction at zero without copying the expected landing or exposing turn", () => {
    expect(matrixTurn.initialValues(spec, 3, target)).toEqual({ x: 0, y: 0 });
    expect(matrixTurn.initialValues(spec, 2, target)).toEqual({ turn: 0 });
    expect(matrixTurn.initialValues(spec, 1, target)).toEqual({ turn: 0 });
    expect(matrixTurn.initialValues(spec, 4, target)).toEqual(matrixTurn.solve(target, spec));
  });

  it("uses two rose integer marker rails and replaces the exploration slider", () => {
    expect(matrixTurn.axes).toEqual({ x: "x", y: "y" });
    expect(matrixTurn.predictionControls(spec, target)).toEqual([
      { variableName: "x", label: "x", min: -4, max: 4, step: 1, colorToken: "rose" },
      { variableName: "y", label: "y", min: -4, max: 4, step: 1, colorToken: "rose" },
    ]);
  });

  it("evaluates the marker against the task, ignoring exploration and source values in the answer", () => {
    expect(matrixTurn.evaluate({ x: -1, y: 2, turn: -1, px: 4, py: 4 }, target, 0, spec)).toEqual({ correct: true, delta: 0 });
    expect(matrixTurn.evaluate({ x: 2, y: 1, turn: 0 }, target, 0, spec).correct).toBe(false);
    expect(matrixTurn.evaluate({ x: -0.9, y: 2 }, target, 0.11, spec).correct).toBe(true);
    expect(matrixTurn.evaluate({ x: -0.9, y: 2 }, target, 0, spec).correct).toBe(false);
    expect(matrixTurn.evaluate({ x: 0, y: 0 }, target, 0, spec).delta).toBeCloseTo(Math.sqrt(5));
  });

  it("names clockwise and unsigned swapping misses", () => {
    expect(matrixTurn.evaluate({ x: 1, y: -2 }, target, 0, spec).kind).toBe("clockwise");
    expect(matrixTurn.evaluate({ x: 1, y: 2 }, target, 0, spec).kind).toBe("swap");
    const reverse = { turn: -1, x: 1, y: -2 };
    expect(matrixTurn.evaluate({ x: -1, y: 2 }, reverse, 0, spec).kind).toBe("clockwise");
    expect(matrixTurn.evaluate({ x: -3, y: 3 }, target, 0, spec).kind).toBeUndefined();
    expect(matrixTurn.evaluate({ x: 0, y: 0 }, { turn: 0, px: 0, py: 0, x: 0, y: 0 }, 0, spec)).toEqual({ correct: true, delta: 0 });
  });

  it("keeps Stage 1 silent with a source ghost and fixed board dimensions", () => {
    const anchor = render({ stage: 1, anchorT: 1 });
    expect(anchor).not.toContain("<text");
    expect(anchor).toContain("gb-anchoring");
    expect(anchor).toContain('data-turn-source=""');
    expect(anchor.match(/viewBox="[^"]+"/)?.[0]).toBe(render().match(/viewBox="[^"]+"/)?.[0]);
    expect(render({ stage: 1, anchorT: -0.2 })).not.toContain("NaN");
  });

  it("hides all landed geometry, trail and formal tags before commitment", () => {
    const hidden = render();
    expect(hidden).toContain('data-turn-floor="source" transform="rotate(0 ');
    expect(hidden).not.toContain("data-turn-landing");
    expect(hidden).not.toContain("data-turn-trail");
    expect(hidden).not.toContain("(−y, x)");
    expect(hidden).toContain('data-turn-marker=""');
    expect(hidden).not.toContain("data-turn-miss");
  });

  it("reveals a committed landing and draws a marching red diagnostic with delta", () => {
    const verdict = matrixTurn.evaluate({ x: 1, y: -2 }, target, 0, spec);
    const shown = render({ values: { x: 1, y: -2 }, verdict });
    expect(shown).toContain('data-turn-floor="revealed"');
    expect(shown).toContain('data-turn-landing=""');
    expect(shown).toContain('data-turn-trail=""');
    expect(shown).toContain('data-turn-miss=""');
    expect(shown).toContain('stroke-dasharray="6 4"');
    expect(shown).toContain("gb-march");
    expect(shown).toContain("Δ");
    expect(render({ verdict: { correct: true, delta: 0 } })).not.toContain("data-turn-miss");
  });

  it("animates guided practice from the source and suppresses solved marker and value tags in motion", () => {
    const start = render({ guide: 0, values: matrixTurn.solve(target, spec) });
    const middle = render({ guide: 0.5, values: matrixTurn.solve(target, spec) });
    const end = render({ guide: 1, values: matrixTurn.solve(target, spec) });
    expect(start).toContain('transform="rotate(0 ');
    expect(middle).toContain('transform="rotate(-45 ');
    expect(middle).not.toContain("data-turn-marker");
    expect(end).toContain('transform="rotate(-90 ');
    expect(end).toContain("(-1, 2)");
  });

  it("matches the Stage 4 formula's blue, amber and rose tags", () => {
    const formal = render({ stage: 4, values: matrixTurn.solve(target, spec) });
    for (const mapping of spec.stage4Formalization.colorMapping) {
      expect(formal).toContain(mapping.symbol);
      expect(formal).toContain(`var(--color-band-${mapping.colorToken})`);
    }
  });

  it("keeps assisted turn fixed while both response controls remain editable", () => {
    const item = spec.practice!.items.find((item) => item.fade === "assisted")!;
    const solved = matrixTurn.solve(item.target, spec);
    expect(solved.turn).toBe(item.target.turn);
    expect(matrixTurn.predictionControls(spec, item.target).every((control) => !item.presetControls?.includes(control.variableName))).toBe(true);
    const shown = render({ target: item.target, values: { turn: solved.turn!, x: 0, y: 0 }, input: {
      controls: matrixTurn.predictionControls(spec, item.target), locked: item.presetControls, onChange() {},
    } });
    expect((shown.match(/role="slider"/g) ?? []).length).toBe(2);
    expect(shown).not.toContain('aria-disabled="true"');
  });

  it("solves every real lesson, review and practice target within the marker bounds", () => {
    const lessons = vectorsModules.filter((module) => module.interactive === "matrix-turn");
    expect(lessons.map((module) => module.id)).toContain("math-matrix-rotation-01");
    for (const module of lessons) {
      const realSpec = module.spec as ModuleSpec;
      const targets: Values[] = [realSpec.stage3Prediction.target, realSpec.retentionHooks.reviewTarget!, ...(realSpec.practice?.items.map((item) => item.target) ?? [])];
      for (const realTarget of targets) {
        const solved = matrixTurn.solve(realTarget, realSpec);
        const { p, turn } = turnCase(realTarget, realSpec);
        expect({ x: solved.x!, y: solved.y! }).toEqual(rotatePoint(p, turn));
        expect(matrixTurn.evaluate(solved, realTarget, realSpec.stage3Prediction.tolerance, realSpec)).toEqual({ correct: true, delta: 0 });
        for (const control of matrixTurn.predictionControls(realSpec, realTarget)) {
          expect(solved[control.variableName]!).toBeGreaterThanOrEqual(control.min);
          expect(solved[control.variableName]!).toBeLessThanOrEqual(control.max);
          expect((solved[control.variableName]! - control.min) % control.step).toBe(0);
        }
      }
    }
  });
});
