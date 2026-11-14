import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleSpec } from "@versado/core";
// @ts-ignore TS6059: this real-content test fixture intentionally lives outside web's rootDir.
import { vectorsModules } from "../../../../../api/src/content/vectors";
import { matrixOrder, orderLanding } from "./MatrixOrder";
import type { BoardProps, Values } from "./types";

const lesson = vectorsModules.find((module) => module.id === "math-transform-order-01")!;
const spec = lesson.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const review = spec.retentionHooks.reviewTarget!;

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(matrixOrder.Board, {
    spec, stage: 3, values: matrixOrder.initialValues(spec, 3, target), target,
    verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

describe("matrixOrder", () => {
  it("applies column-vector stretch/turn composition in both orders", () => {
    expect(orderLanding({ order: 0 }, spec)).toEqual({ x: -1, y: 4 });
    expect(orderLanding({ order: 1 }, spec)).toEqual({ x: -2, y: 2 });
    expect(orderLanding({ order: 0, px: 1, py: 2 }, spec)).toEqual({ x: -2, y: 2 });
  });

  it("lets task context override fixed factors, source and turn", () => {
    const c = { a: 3, d: 2, turn: -1, px: 1, py: 2 };
    expect(orderLanding({ ...c, order: 0 }, spec)).toEqual({ x: 4, y: -3 });
    expect(orderLanding({ ...c, order: 1 }, spec)).toEqual({ x: 6, y: -2 });
    expect(orderLanding({ ...c, turn: 2, order: 0 }, spec)).toEqual({ x: -3, y: -4 });
  });

  it("solves context independently of the authored expected coordinates", () => {
    expect(matrixOrder.solve(target, spec)).toEqual({ order: 0, x: -1, y: 4 });
    expect(matrixOrder.solve(review, spec)).toEqual({ order: 1, x: -2, y: 2 });
    expect(orderLanding({ ...target, x: 999, y: 999 }, spec)).toEqual({ x: -1, y: 4 });
  });

  it("starts prediction neutrally and freezes order without copying expected coordinates", () => {
    expect(matrixOrder.initialValues(spec, 2, target)).toEqual({ a: 2, d: 1, turn: 1, px: 2, py: 1, order: 0 });
    expect(matrixOrder.initialValues(spec, 3, target)).toEqual({ order: 0, x: 0, y: 0 });
    expect(matrixOrder.initialValues(spec, 3, review)).toEqual({ order: 1, x: 0, y: 0 });
    expect(matrixOrder.initialValues(spec, 4, review)).toEqual(matrixOrder.solve(review, spec));
  });

  it("replaces the exploration toggle with two rose marker rails", () => {
    const controls = matrixOrder.predictionControls(spec, target);
    expect(controls.map((c) => c.variableName)).toEqual(["x", "y"]);
    expect(matrixOrder.axes).toEqual({ x: "x", y: "y" });
    for (const c of controls) {
      expect({ min: c.min, max: c.max, step: c.step, colorToken: c.colorToken }).toEqual({ min: -4, max: 4, step: 1, colorToken: "rose" });
      expect(c.choices).toBeUndefined();
    }
  });

  it("diagnoses the other order in either direction, without trusting learner context", () => {
    expect(matrixOrder.evaluate({ x: -2, y: 2, order: 0 }, target, 0, spec).kind).toBe("reversed");
    expect(matrixOrder.evaluate({ x: -1, y: 4, order: 1 }, review, 0, spec).kind).toBe("reversed");
    expect(matrixOrder.evaluate({ x: -1, y: 4, order: 1, a: 999 }, target, 0, spec).correct).toBe(true);
    const miss = matrixOrder.evaluate({ x: 0, y: 0 }, target, 0, spec);
    expect(miss.correct).toBe(false);
    expect(miss.kind).toBeUndefined();
    expect(miss.delta).toBeCloseTo(Math.sqrt(17));
    expect(matrixOrder.formatDelta(miss)).toBe("Δ 4.12");
  });

  it("uses authored x/y with coordinate tolerance and accepts commuting cases", () => {
    expect(matrixOrder.evaluate({ x: -0.9, y: 3.9 }, target, 0.1, spec).correct).toBe(true);
    expect(matrixOrder.evaluate({ x: -0.8, y: 4 }, target, 0.1, spec).correct).toBe(false);
    expect(matrixOrder.evaluate({ x: 3, y: 2 }, { ...target, x: 3, y: 2 }, 0, spec).correct).toBe(true);
    const commuting = { a: 2, d: 2, order: 0, px: 2, py: 1 };
    expect(matrixOrder.evaluate(matrixOrder.solve(commuting, spec), commuting, 0, spec)).toEqual({ correct: true, delta: 0 });
  });

  it("keeps BOTH comparison results and trails out of an uncommitted prediction", () => {
    for (const t of [target, review]) {
      const svg = render({ target: t });
      expect(svg).not.toContain("data-result-flag");
      expect(svg).not.toContain("data-trail");
      expect(svg).not.toContain("data-diagnostic-gap");
      expect(svg).toContain("data-marker");
      expect(svg).toContain("2× / 1×");
      expect(svg).toContain("90°");
      expect(svg).not.toContain("(-1, 4)");
      expect(svg).not.toContain("(-2, 2)");
    }
  });

  it("reveals both flags after commitment and draws a red marching gap at the settled landing", () => {
    const values = { x: -2, y: 2 };
    const verdict = matrixOrder.evaluate(values, target, 0, spec);
    const revealed = render({ values, verdict, guide: 1 });
    expect(revealed.match(/data-result-flag/g)).toHaveLength(2);
    expect(revealed).toContain("data-diagnostic-gap");
    expect(revealed).toContain('stroke-dasharray="6 4" class="gb-march"');
    expect(revealed).toContain("Δ 2.24");
    expect(revealed).toContain("(-1, 4)");
  });

  it("anchors silently with a fixed frame and an informative final motion frame", () => {
    const start = render({ stage: 1, anchorT: 0 });
    const end = render({ stage: 1, anchorT: 1 });
    expect(end).toContain("gb-anchoring");
    expect(end).not.toContain("<text");
    expect(end.match(/data-result-flag/g)).toHaveLength(2);
    expect(start).not.toEqual(end);
    const viewBox = (svg: string) => svg.match(/viewBox="([^"]+)"/)![1];
    expect(viewBox(start)).toEqual(viewBox(render()));
    expect(viewBox(end)).toEqual(viewBox(render({ stage: 4 })));
  });

  it("plays the guided steps from source through the intermediate position to both results", () => {
    const start = render({ guide: 0 });
    const halfway = render({ guide: 0.5 });
    const end = render({ guide: 1 });
    expect(start).not.toEqual(halfway);
    expect(halfway).not.toEqual(end);
    expect(end).toContain("(-1, 4)");
    expect(end).toContain("(-2, 2)");
    expect(end).not.toContain("data-marker");
    expect(end).not.toContain("data-diagnostic-gap");
  });

  it("keeps assisted order preset and both response rails editable", () => {
    const assisted = spec.practice!.items.find((item) => item.fade === "assisted")!;
    const values = matrixOrder.initialValues(spec, 3, assisted.target);
    const solved = matrixOrder.solve(assisted.target, spec);
    for (const name of assisted.presetControls) values[name] = solved[name]!;
    expect(values).toEqual({ order: 1, x: 0, y: 0 });
    const svg = render({ target: assisted.target, values, input: {
      controls: matrixOrder.predictionControls(spec, assisted.target), onChange() {}, locked: assisted.presetControls,
    } });
    expect(svg.match(/role="slider"/g)).toHaveLength(2);
    expect(svg).not.toContain('aria-disabled="true"');
    expect(svg).toContain("gb-handle-grip");
  });

  it("covers the real lesson, review and every practice target within the marker bounds", () => {
    const modules = vectorsModules.filter((module) => module.interactive === "matrix-order");
    expect(modules.length).toBeGreaterThan(0);
    for (const module of modules) {
      const real = module.spec as ModuleSpec;
      const targets: Values[] = [real.stage3Prediction.target, real.retentionHooks.reviewTarget!, ...real.practice!.items.map((item) => item.target)];
      for (const t of targets) {
        const solved = matrixOrder.solve(t, real);
        expect({ x: solved.x, y: solved.y }).toEqual({ x: t.x, y: t.y });
        expect(matrixOrder.evaluate(solved, t, real.stage3Prediction.tolerance, real)).toEqual({ correct: true, delta: 0 });
        for (const control of matrixOrder.predictionControls(real, t)) {
          const value = solved[control.variableName]!;
          expect(value).toBeGreaterThanOrEqual(control.min);
          expect(value).toBeLessThanOrEqual(control.max);
          expect((value - control.min) % control.step).toBe(0);
        }
      }
      for (const kind of Object.keys(real.stage3Prediction.adaptiveFeedback.byKind ?? {})) {
        const reversed = matrixOrder.solve({ ...real.stage3Prediction.target, order: 1 }, real);
        expect(kind).toBe(matrixOrder.evaluate(reversed, real.stage3Prediction.target, 0, real).kind!);
      }
    }
  });
});
