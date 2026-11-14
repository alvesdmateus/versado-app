import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import { exponentRibbon } from "./ExponentRibbon";
import { getInteractive } from "./index";
import type { BoardProps, Values } from "./types";

// Runtime import keeps API content outside the web TypeScript rootDir.
const contentPath = "../../../../../api/src/content/growth";
const { growthModules } = await import(contentPath) as {
  growthModules: { id: string; interactive: string; spec: ModuleSpec }[];
};
const lessons = growthModules.filter((lesson) => lesson.interactive === "exponent-ribbon");
const spec = lessons[0]!.spec;
const target = spec.stage3Prediction.target;
const assisted = spec.practice!.items.find((item) => item.fade === "assisted")!;
const render = (props: Partial<BoardProps> = {}) => renderToStaticMarkup(createElement(exponentRibbon.Board, {
  spec, stage: 3, values: { exponent_x: 0 }, target, verdict: null, anchorT: 1, changed: null, ...props,
}));

describe("exponentRibbon answers", () => {
  it("registers its slug and binds only the exponent to the horizontal rail", () => {
    expect(getInteractive("exponent-ribbon")).toBe(exponentRibbon);
    expect(exponentRibbon.axes).toEqual({ exponent_x: "x" });
    expect(exponentRibbon.predictionControls(spec, target)).toEqual([{
      variableName: "exponent_x", label: "Step position", min: -3, max: 3, step: 0.5, colorToken: "rose",
    }]);
  });

  it("starts from authored exploration values and a neutral prediction, then formalizes the solution", () => {
    for (const stage of [1, 2] as const) expect(exponentRibbon.initialValues(spec, stage, target)).toEqual({
      growth_base_b: 2, start_height: 1, exponent_x: 1,
    });
    expect(exponentRibbon.initialValues(spec, 3, target)).toEqual({ exponent_x: 0 });
    expect(exponentRibbon.initialValues(spec, 4, target)).toEqual({ exponent_x: -2 });
    expect(exponentRibbon.initialValues(spec, 3, assisted.target)).toEqual({ exponent_x: 0 });
  });

  it("solves positive, negative and half exponents and evaluates exponent positions", () => {
    for (const exponent_x of [-3, -2.5, -2, -1, -0.5, 0, 0.5, 1, 2.5, 3]) {
      const task = { exponent_x };
      expect(exponentRibbon.solve(task, spec)).toEqual(task);
      expect(exponentRibbon.evaluate(task, task, 0, spec)).toEqual({ correct: true, delta: 0 });
    }
    expect(exponentRibbon.evaluate({ exponent_x: -1 }, target, 0, spec)).toEqual({ correct: false, delta: 1 });
    expect(exponentRibbon.evaluate({ exponent_x: -1.995 }, target, 0.01, spec).correct).toBe(true);
    expect(exponentRibbon.evaluate({ exponent_x: -1.98 }, target, 0.01, spec).correct).toBe(false);
    expect(exponentRibbon.formatDelta({ correct: false, delta: -2 })).toBe("−2");
  });

  it("offers the length choices alongside the assisted preset, leaving the answer unpicked", () => {
    const controls = exponentRibbon.predictionControls(spec, assisted.target);
    expect(controls.map((c) => c.variableName)).toEqual(["exponent_x", "answer"]);
    expect(controls[1]).toMatchObject({ choices: [-2, 0, 0.5, 2], min: -2, max: 2, step: 0.5 });
    const solution = exponentRibbon.solve(assisted.target, spec);
    const initial = exponentRibbon.initialValues(spec, 3, assisted.target);
    for (const name of assisted.presetControls) initial[name] = solution[name]!;
    expect(initial).toEqual({ exponent_x: -1 });
    expect(exponentRibbon.evaluate(initial, assisted.target, 0, spec).correct).toBe(false);
    expect(exponentRibbon.evaluate({ ...initial, answer: 0.5 }, assisted.target, 0, spec)).toEqual({ correct: true, delta: 0 });
    // The answer is the physical length, not a copied target answer or a mutable preset.
    expect(exponentRibbon.solve({ exponent_x: -1, answer: 9 }, spec)).toEqual({ exponent_x: -1, answer: 0.5 });
    expect(exponentRibbon.evaluate({ exponent_x: 3, answer: 0.5 }, assisted.target, 0, spec).correct).toBe(true);
  });

  it("diagnoses every authored misconception without treating a negative exponent as a negative length", () => {
    for (const [answer, kind] of [[-2, "negativeValue"], [2, "forward"], [0, "additive"]] as const) {
      expect(exponentRibbon.evaluate({ exponent_x: -1, answer }, assisted.target, 0, spec)).toEqual({
        correct: false, delta: answer - 0.5, kind,
      });
    }
    expect(exponentRibbon.evaluate({ exponent_x: 2 }, target, 0, spec).kind).toBe("forward");
    expect(exponentRibbon.evaluate({ exponent_x: -2 }, target, 0, spec).kind).toBeUndefined();
    expect(exponentRibbon.evaluate({ exponent_x: Math.log2(1.5) }, { exponent_x: 0.5 }, 0, spec).kind).toBe("additive");
    expect(exponentRibbon.evaluate({ exponent_x: -0.75 }, target, 0, spec).kind).toBe("additive");
  });

  it("rejects absent and nonfinite responses in both modes", () => {
    for (const task of [target, assisted.target]) {
      const name = "answer" in task ? "answer" : "exponent_x";
      for (const values of [{}, { [name]: NaN }, { [name]: Infinity }, { [name]: -Infinity }]) {
        const verdict = exponentRibbon.evaluate(values, task, 0, spec);
        expect(verdict.correct).toBe(false);
        expect(Number.isFinite(verdict.delta)).toBe(true);
      }
    }
  });
});

describe("exponentRibbon stages and practice", () => {
  it("anchors without text and retains comparison ghosts in the reduced-motion final frame", () => {
    const start = render({ stage: 1, anchorT: 0 });
    const end = render({ stage: 1, anchorT: 1 });
    expect(end).toContain("gb-anchoring");
    expect(end).not.toContain("<text");
    expect(end).toContain('data-exponent-ribbon="ghost"');
    expect(end).toContain('data-exponent-ribbon="comparison"');
    expect(start).not.toBe(end);
    expect(end).not.toMatch(/NaN|Infinity/);
  });

  it("compares geometric half-step lengths using the same factor on both sides", () => {
    const markup = render({ stage: 2, values: { exponent_x: 0.5 } });
    expect(markup).toContain('data-exponent-ribbon="geometric-mean"');
    expect(markup).toContain('stroke="var(--color-band-amber)"');
    expect(markup.match(/×1.41/g)).toHaveLength(2);
    expect(markup).not.toContain("√2");
    expect(markup).toContain(">1.41</text>");
    expect(markup).toContain(">1</text>");
    expect(markup).toContain(">2</text>");
  });

  it("hides all resulting ribbons, lengths and fold ghosts until commitment, including the assisted task", () => {
    for (const task of [target, spec.retentionHooks.reviewTarget!, assisted.target]) {
      const before = render({ target: task, values: { exponent_x: -1, answer: 2 } });
      expect(before).toContain('data-exponent-ribbon="hidden"');
      expect(before).not.toContain('data-exponent-ribbon="revealed"');
      expect(before).not.toContain('data-exponent-ribbon="ghost"');
      expect(before).not.toContain(">1/2</text>");
      expect(before).not.toContain("b⁻ˣ");
      const values = exponentRibbon.solve(task, spec);
      expect(render({ target: task, values, verdict: { correct: true, delta: 0 } })).toContain('data-exponent-ribbon="revealed"');
    }
  });

  it("draws misses on the ribbon and track with a marching signed length gap", () => {
    const values = { exponent_x: 2 };
    const missed = render({ values, verdict: exponentRibbon.evaluate(values, target, 0, spec) });
    expect(missed).toContain('data-exponent-ribbon="discrepancy"');
    expect(missed).toContain('stroke-dasharray="6 4"');
    expect(missed).toContain("gb-march");
    expect(missed).toContain(">+3.75</text>");
    expect(missed).toContain(">1/4</text>");
    for (const answer of [-2, 0, 2]) {
      const choiceMiss = render({ target: assisted.target, values: { exponent_x: -1, answer },
        verdict: exponentRibbon.evaluate({ answer }, assisted.target, 0, spec) });
      expect(choiceMiss).toContain('data-exponent-ribbon="discrepancy"');
      expect(choiceMiss).toContain(">1/2</text>");
      expect(choiceMiss).not.toMatch(/NaN|Infinity|width="-/);
    }
  });

  it("plays guided folds without a verdict and delays moving labels until settled", () => {
    const props = { target: { exponent_x: -1 }, stage: 3 as const };
    const midway = render({ ...props, guide: 0.5 });
    const finished = render({ ...props, guide: 1 });
    expect(midway).toContain('data-exponent-ribbon="revealed"');
    expect(midway).not.toContain("<text");
    expect(finished).toContain(">1/2</text>");
    expect(midway).not.toBe(finished);
  });

  it("shows a keyboard rail and direct bead handle, honoring an assisted lock", () => {
    const free = render({ input: { controls: exponentRibbon.predictionControls(spec, target), onChange() {} } });
    expect(free).toContain('role="slider"');
    expect(free).toContain('aria-orientation="horizontal"');
    expect(free).toContain('class="gb-handle"');
    const locked = render({ target: assisted.target, values: { exponent_x: -1 }, input: {
      controls: exponentRibbon.predictionControls(spec, assisted.target), locked: assisted.presetControls, onChange() {},
    } });
    expect(locked).toContain('aria-disabled="true"');
    expect(locked).not.toContain('class="gb-handle"');
  });

  it("moves in half steps with the keyboard and keeps the preset immovable", () => {
    const calls: [string, number][] = [];
    const view = mount(createElement(exponentRibbon.Board, {
      spec, stage: 3, target, values: { exponent_x: 0 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: exponentRibbon.predictionControls(spec, target), onChange: (name, value) => calls.push([name, value]) },
    }));
    const rail = view.getByRole("slider", { name: "Step position" });
    fireEvent.keyDown(rail, { key: "ArrowLeft" });
    fireEvent.keyDown(rail, { key: "End" });
    expect(calls).toEqual([["exponent_x", -0.5], ["exponent_x", 3]]);
    view.rerender(createElement(exponentRibbon.Board, {
      spec, stage: 3, target: assisted.target, values: { exponent_x: -1 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: exponentRibbon.predictionControls(spec, assisted.target), locked: assisted.presetControls,
        onChange: (name, value) => calls.push([name, value]) },
    }));
    fireEvent.keyDown(view.getByRole("slider", { name: "Step position" }), { key: "ArrowRight" });
    expect(calls).toHaveLength(2);
    view.unmount();
  });

  it("keeps the viewport fixed and formalizes rose reciprocal folds and amber half steps", () => {
    const boxes = [1, 2, 3, 4].map((stage) => render({ stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)![1]);
    expect(new Set(boxes).size).toBe(1);
    const formal = render({ stage: 4 });
    expect(formal).toContain("b⁻ˣ = 1/bˣ");
    expect(formal).toContain("√b = √2 ≈ 1.41");
    expect(formal).toContain('fill="var(--color-band-rose)"');
    expect(formal).toContain('fill="var(--color-band-amber)"');
  });
});

describe("exponentRibbon real lesson contract", () => {
  it("solves every lesson, review and practice target on the offered controls", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["math-exponent-folding-01"]);
    for (const lesson of lessons) {
      const spec = lesson.spec;
      const targets: Values[] = [spec.stage3Prediction.target, spec.retentionHooks.reviewTarget!, ...spec.practice!.items.map((item) => item.target)];
      for (const target of targets) {
        const solution = exponentRibbon.solve(target, spec);
        expect(exponentRibbon.evaluate(solution, target, spec.stage3Prediction.tolerance, spec)).toEqual({ correct: true, delta: 0 });
        for (const c of exponentRibbon.predictionControls(spec, target)) {
          const v = solution[c.variableName]!;
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(c.min);
          expect(v).toBeLessThanOrEqual(c.max);
          expect(Math.abs((v - c.min) / c.step - Math.round((v - c.min) / c.step))).toBeLessThan(1e-6);
          if (c.choices) expect(c.choices).toContain(v);
        }
      }
      for (const item of spec.practice!.items) {
        const solution = exponentRibbon.solve(item.target, spec);
        for (const name of item.presetControls ?? []) expect(solution[name]).toBe(item.target[name]);
      }
      expect(Object.keys(spec.stage3Prediction.adaptiveFeedback.byKind!)).toEqual(["negativeValue", "forward", "additive"]);
    }
  });
});
