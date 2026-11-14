import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import { areaAt, calculusArea, edgeHeight, leftSum } from "./CalculusArea";
import type { BoardProps, Values } from "./types";

// Runtime import keeps API source outside the web compiler's rootDir.
const contentPath = "../../../../../api/src/content/calculus";
const { calculusModules } = await import(contentPath) as { calculusModules: { id: string; interactive: string; spec: ModuleSpec }[] };
const lessons = calculusModules.filter((lesson) => lesson.interactive === "calculus-area");
const integral = lessons.find((lesson) => lesson.id === "math-integral-01")!.spec;
const ftc = lessons.find((lesson) => lesson.id === "math-ftc-01")!.spec;
const render = (spec: ModuleSpec, props: Partial<BoardProps> = {}) => renderToStaticMarkup(createElement(calculusArea.Board, {
  spec, stage: 3, values: calculusArea.initialValues(spec, 3, spec.stage3Prediction.target),
  target: spec.stage3Prediction.target, verdict: null, anchorT: 1, changed: null, ...props,
}));

describe("calculusArea finite slices", () => {
  it("sums left endpoints and preserves a finite error at 200 slices", () => {
    expect(leftSum(0, 2, 4)).toBe(3);
    expect(leftSum(0, 2, 200)).toBe(3.98);
    expect(leftSum(0, 3, 200)).toBe(8.955);
    expect(leftSum(-1, 1, 200)).toBe(-0.02);
  });

  it("preserves exploration and fixes 200 slices only at the main/review gate", () => {
    expect(calculusArea.initialValues(integral, 2, {})).toEqual({ mode: 1, left_bound_a: 0, right_bound_b: 1, slice_count_n: 4 });
    expect(calculusArea.initialValues(integral, 3, { right_bound_b: 2 }).slice_count_n).toBe(200);
    expect(calculusArea.initialValues(integral, 3, { right_bound_b: 3, slice_count_n: 200 }).slice_count_n).toBe(4);
    expect(calculusArea.initialValues(integral, 4, { right_bound_b: 1 })).toEqual(calculusArea.solve({ right_bound_b: 1 }, integral));
    expect(calculusArea.predictionControls(integral, { right_bound_b: 2 }).map((c) => c.variableName)).toEqual(["right_bound_b"]);
    expect(calculusArea.predictionControls(integral, { right_bound_b: 3, slice_count_n: 200 }).map((c) => c.variableName)).toEqual(["slice_count_n", "right_bound_b"]);
  });

  it("uses boundary tolerance, requires practice refinement, and diagnoses all integral kinds", () => {
    expect(calculusArea.evaluate({ right_bound_b: 2.02 }, { right_bound_b: 2 }, 0.02, integral).correct).toBe(true);
    expect(calculusArea.evaluate({ right_bound_b: 2.021 }, { right_bound_b: 2 }, 0.02, integral).correct).toBe(false);
    expect(calculusArea.evaluate({ right_bound_b: 0.5 }, { right_bound_b: 1 }, 0.02, integral).kind).toBe("height");
    expect(calculusArea.evaluate({ right_bound_b: 1 }, { right_bound_b: 2 }, 0.02, integral).kind).toBeUndefined();
    expect(calculusArea.evaluate({ right_bound_b: 3, slice_count_n: 4 }, { right_bound_b: 3, slice_count_n: 200 }, 0.02, integral)).toEqual({ correct: false, delta: -2.25, kind: "coarse" });
    expect(calculusArea.evaluate({ right_bound_b: 1, answer: 2 }, { left_bound_a: -1, right_bound_b: 1, answer: 0 }, 0.02, integral)).toEqual({ correct: false, delta: 2, kind: "unsigned" });
    for (const v of [undefined, NaN, Infinity]) expect(calculusArea.evaluate({ right_bound_b: v! }, { right_bound_b: 2 }, 0.02, integral).correct).toBe(false);
  });
});

describe("calculusArea fundamental theorem", () => {
  it("matches height with area growth and supplies the four specified numeric choices", () => {
    expect(edgeHeight(2)).toBe(4);
    expect(areaAt(2)).toBeCloseTo(16 / 3);
    expect(areaAt(4)).toBeCloseTo(32 / 3);
    expect(calculusArea.predictionControls(ftc, { sweep_x: 2 })).toHaveLength(1);
    expect(calculusArea.predictionControls(ftc, { sweep_x: 2, answer: 4 })[1]!.choices).toEqual([4, 16 / 3, 2, 0]);
    expect(calculusArea.predictionControls(ftc, { sweep_x: 1, answer: 3 })[1]!.choices).toEqual([3, 5 / 3, 1, 2]);
    expect(calculusArea.initialValues(ftc, 3, { sweep_x: 4 }).sweep_x).toBe(0.5);
    expect(calculusArea.initialValues(ftc, 3, { sweep_x: 2, answer: 4 }).answer).toBeUndefined();
  });

  it("checks position before rate, rejects unanswered choices, and names every rate misconception", () => {
    const target = { sweep_x: 2, answer: 4 };
    expect(calculusArea.evaluate({ sweep_x: 1, answer: 4 }, target, 0.05, ftc).correct).toBe(false);
    expect(calculusArea.evaluate({ sweep_x: 2 }, target, 0.05, ftc).correct).toBe(false);
    expect(calculusArea.evaluate({ sweep_x: 4 }, { sweep_x: 2 }, 0.05, ftc).kind).toBe("total");
    expect(calculusArea.evaluate({ sweep_x: 2 }, { sweep_x: 4 }, 0.05, ftc).kind).toBe("curve_flat");
    expect(calculusArea.evaluate({ sweep_x: 1 }, { sweep_x: 2 }, 0.05, ftc).kind).toBeUndefined();
    for (const [answer, kind] of [[16 / 3, "total"], [2, "position"], [0, "curve_flat"]] as const) {
      expect(calculusArea.evaluate({ sweep_x: 2, answer }, target, 0.05, ftc).kind).toBe(kind);
    }
    expect(calculusArea.evaluate({ sweep_x: 1, answer: 2 }, { sweep_x: 1, answer: 3 }, 0.05, ftc).kind).toBe("curve_flat");
    expect(calculusArea.evaluate({ sweep_x: 2.05 }, { sweep_x: 2 }, 0.05, ftc).correct).toBe(true);
    expect(calculusArea.evaluate({ sweep_x: 0 }, { sweep_x: 4 }, 0.05, ftc).correct).toBe(false);
    expect(calculusArea.formatDelta({ correct: false, delta: -2 })).toBe("−2");
  });
});

describe("calculusArea stages and fading", () => {
  it("is silent in anchoring and keeps each mode's viewBox fixed across stages", () => {
    for (const spec of [integral, ftc]) {
      const viewBoxes = [1, 2, 3, 4].map((stage) => render(spec, { stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)![1]);
      expect(new Set(viewBoxes).size).toBe(1);
      const anchored = render(spec, { stage: 1 });
      expect(anchored).toContain("gb-anchoring");
      expect(anchored).not.toContain("<text");
      expect(anchored).toContain('data-calculus="ghost"');
      expect(render(spec, { stage: 1, anchorT: 0.1 })).not.toBe(anchored);
    }
  });

  it("hides the integral total and FTC growth until commitment", () => {
    const before = render(integral, { values: { right_bound_b: 2, slice_count_n: 200 } });
    expect(before).not.toContain(">3.98<");
    expect(before).toContain('data-count="200"');
    const after = render(integral, { values: { right_bound_b: 2, slice_count_n: 200 }, verdict: { correct: true, delta: 0 } });
    expect(after).toContain(">3.98<");
    expect(before).toContain('data-calculus="sliver"');
    expect(render(ftc)).not.toContain('data-calculus="growth"');
    expect(render(ftc)).not.toContain('data-calculus="nudges"');
    expect(render(ftc, { verdict: { correct: true, delta: 0 }, values: { sweep_x: 2 } })).toContain('data-calculus="growth"');
  });

  it("draws diagnostic discrepancy shapes, signed cancellation, and formal band tags", () => {
    for (const spec of [integral, ftc]) {
      const markup = render(spec, { values: spec === ftc ? { sweep_x: 4 } : { right_bound_b: 0.5 }, verdict: { correct: false, delta: -1 } });
      expect(markup).toContain('stroke-dasharray="6 4"');
      expect(markup).toContain("gb-march");
    }
    const integralFormal = render(integral, { stage: 4 });
    expect(integralFormal).toContain('data-calculus="signed"');
    expect(integralFormal).toContain("−1 + 1 = 0");
    expect(integralFormal).toContain("Δx → dx");
    expect(render(ftc, { stage: 4 })).toContain("A′(x) = ");
  });

  it("guides both demos without leaking intermediate tags", () => {
    for (const spec of [integral, ftc]) {
      const target = spec.practice!.items[0]!.target;
      const moving = render(spec, { target, guide: 0.5 });
      expect(moving).not.toContain("<text");
      expect(render(spec, { target, guide: 0 })).not.toBe(render(spec, { target, guide: 1 }));
    }
  });

  it("activates only the position, then locks it before revealing rate choices (including assisted)", () => {
    const target = { sweep_x: 1, answer: 3 };
    const input = { controls: calculusArea.predictionControls(ftc, target), onChange() {} };
    const placing = render(ftc, { target, input, values: { sweep_x: 0.5 } });
    expect(placing).not.toContain('data-calculus="rate-choice"');
    expect(placing).toContain("gb-handle");
    const positioned = render(ftc, { target, input, values: { sweep_x: 1 } });
    expect(positioned).toContain('data-calculus="rate-choice"');
    expect(positioned).toContain('data-locked="true"');
    expect(positioned).not.toContain("gb-handle");
    const assisted = ftc.practice!.items[1]!;
    const assistedValues = calculusArea.initialValues(ftc, 3, assisted.target);
    for (const key of assisted.presetControls ?? []) assistedValues[key] = calculusArea.solve(assisted.target, ftc)[key]!;
    expect(assistedValues.answer).toBeUndefined();
    expect(render(ftc, { target: assisted.target, values: assistedValues, input: { controls: calculusArea.predictionControls(ftc, assisted.target), onChange() {}, locked: assisted.presetControls } })).toContain('data-calculus="rate-choice"');
  });

  it("supports the position-to-rate keyboard sequence and respects both assisted locks", () => {
    const target = { sweep_x: 1, answer: 3 };
    const calls: [string, number][] = [];
    const props: BoardProps = {
      spec: ftc, stage: 3, target, values: { sweep_x: 0.9 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: calculusArea.predictionControls(ftc, target), onChange: (name, value) => calls.push([name, value]) },
    };
    const view = mount(createElement(calculusArea.Board, props));
    try {
      fireEvent.keyDown(view.getByRole("slider", { name: "Sweep edge" }), { key: "ArrowRight" });
      expect(calls).toEqual([["sweep_x", 1]]);
      expect(view.queryByRole("radiogroup")).toBeNull();
      calls.length = 0;
      view.rerender(createElement(calculusArea.Board, { ...props, values: { sweep_x: 1 } }));
      fireEvent.keyDown(view.getByRole("slider", { name: "Sweep edge" }), { key: "ArrowRight" });
      expect(calls).toEqual([]);
      fireEvent.click(view.getByRole("radio", { name: "3" }));
      expect(calls).toEqual([["answer", 3]]);
      calls.length = 0;
      view.rerender(createElement(calculusArea.Board, { ...props, values: { sweep_x: 1 }, input: { ...props.input!, locked: ["sweep_x", "answer"] } }));
      fireEvent.click(view.getByRole("radio", { name: "3" }));
      expect(calls).toEqual([]);
    } finally {
      view.unmount();
    }
  });
});

describe("calculusArea real lesson contract", () => {
  it("solves the lesson target, review, and every practice item on its actual controls", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["math-integral-01", "math-ftc-01"]);
    for (const { spec } of lessons) {
      const targets: Values[] = [spec.stage3Prediction.target, spec.retentionHooks.reviewTarget!, ...spec.practice!.items.map((item) => item.target)];
      for (const target of targets) {
        const solution = calculusArea.solve(target, spec);
        expect(calculusArea.evaluate(solution, target, spec.stage3Prediction.tolerance, spec)).toEqual({ correct: true, delta: 0 });
        for (const c of calculusArea.predictionControls(spec, target)) {
          const value = solution[c.variableName]!;
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(c.min);
          expect(value).toBeLessThanOrEqual(c.max);
          if (c.choices) expect(c.choices).toContain(value);
          else expect(Math.abs((value - c.min) / c.step - Math.round((value - c.min) / c.step))).toBeLessThan(1e-6);
        }
      }
      for (const item of spec.practice!.items) for (const key of item.presetControls ?? []) expect(calculusArea.solve(item.target, spec)[key]).toBeDefined();
    }
  });
});
