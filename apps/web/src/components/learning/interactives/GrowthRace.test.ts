import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { firstOvertake, growthRace, heights, raceFrame, raceOf } from "./GrowthRace";
import { getInteractive } from "./index";
import type { BoardProps } from "./types";

// Keep API content outside web's rootDir while exercising the actual authored lesson.
const contentPath = "../../../../../api/src/content/growth";
const { growthModules } = await import(contentPath) as { growthModules: LearningModuleInput[] };
const lessons = growthModules.filter((lesson) => lesson.interactive === "growth-race");
const spec = lessons[0]!.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const review = spec.retentionHooks.reviewTarget;
const baseProps: BoardProps = { spec, target, values: {}, stage: 3, verdict: null, anchorT: 1, changed: null };
const render = (props: Partial<BoardProps> = {}) => renderToStaticMarkup(createElement(growthRace.Board, { ...baseProps, ...props }));

describe("growthRace", () => {
  it("registers the lesson slug", () => {
    expect(getInteractive("growth-race")).toBe(growthRace);
  });
  it("computes a strict first overtake for the lesson, head start and tripling", () => {
    expect(heights(raceOf(target), 3)).toEqual({ blue: 10, amber: 8 });
    expect(heights(raceOf(target), 4)).toEqual({ blue: 13, amber: 16 });
    expect(firstOvertake(raceOf(target))).toBe(4);
    expect(heights(raceOf(review), 4)).toEqual({ blue: 28, amber: 16 });
    expect(heights(raceOf(review), 5)).toEqual({ blue: 30, amber: 32 });
    expect(growthRace.solve(review, spec)).toEqual({ answer: 5 });
    expect(growthRace.solve({ growth_base_b: 3, answer: 2 }, spec)).toEqual({ growth_base_b: 3, answer: 2 });
    expect(firstOvertake({ base: 2, start: 1, linearStart: 1, gain: 1, review: false })).toBe(2);
    expect(firstOvertake({ base: 1, start: 1, linearStart: 1, gain: 3, review: false })).toBe(Infinity);
  });

  it("evaluates the step choice rather than a tower height, and names every authored miss", () => {
    for (const [caseTarget, correct, neighbors, linear] of [[target, 4, [3, 5], 6], [review, 5, [4, 6], 13]] as const) {
      expect(growthRace.evaluate({ answer: correct }, caseTarget, 0, spec)).toEqual({ correct: true, delta: 0 });
      for (const answer of neighbors) expect(growthRace.evaluate({ answer }, caseTarget, 0, spec)).toEqual({ correct: false, delta: answer - correct, kind: "offByOne" });
      expect(growthRace.evaluate({ answer: linear }, caseTarget, 0, spec)).toEqual({ correct: false, delta: linear - correct, kind: "linearThinking" });
    }
    const triple = { growth_base_b: 3, answer: 2 };
    for (const answer of [1, 3]) expect(growthRace.evaluate({ growth_base_b: 3, answer }, triple, 0, spec).kind).toBe("offByOne");
    expect(growthRace.evaluate({ answer: 16 }, target, 0, spec).correct).toBe(false);
    for (const answer of [undefined, NaN, Infinity, 3.9]) expect(growthRace.evaluate({ answer: answer! }, target, 0, spec).correct).toBe(false);
    expect(growthRace.evaluate({ answer: 2, growth_base_b: 2 }, triple, 0, spec).correct).toBe(false);
    expect(growthRace.evaluate({ answer: 2 }, triple, 0, spec).correct).toBe(false);
    expect(growthRace.evaluate({ answer: 2, growth_base_b: NaN }, triple, 0, spec)).toEqual({ correct: false, delta: Infinity });
    expect(growthRace.formatDelta({ correct: false, delta: 2 })).toBe("+2");
    expect(growthRace.formatDelta({ correct: false, delta: -1 })).toBe("−1");
  });

  it("exposes exactly the race choices, plus a practice multiplier that can be preset", () => {
    expect(growthRace.axes).toEqual({ step_count_x: "x" });
    expect(growthRace.predictionControls(spec, target)).toEqual([{
      variableName: "answer", label: "Step", min: 3, max: 6, step: 1, colorToken: "blue", choices: [3, 4, 5, 6],
    }]);
    expect(growthRace.predictionControls(spec, review).map((c) => c.choices)).toEqual([[4, 5, 6, 13]]);
    const practice = growthRace.predictionControls(spec, { growth_base_b: 3, answer: 2 });
    expect(practice.map((c) => c.variableName)).toEqual(["growth_base_b", "answer"]);
    expect(practice[0]).toMatchObject({ min: 1.5, max: 3, step: 0.5, colorToken: "amber" });
    expect(practice[1]!.choices).toEqual([1, 2, 3]);
  });

  it("uses authored initial exploration values, resets prediction, and solves formalization", () => {
    expect(growthRace.initialValues(spec, 1, target)).toEqual({ step_count_x: 1, growth_base_b: 2 });
    expect(growthRace.initialValues(spec, 2, target)).toEqual({ step_count_x: 1, growth_base_b: 2 });
    expect(growthRace.initialValues(spec, 3, target)).toEqual({});
    expect(growthRace.initialValues(spec, 3, review)).toEqual({});
    expect(growthRace.initialValues(spec, 3, { growth_base_b: 3, answer: 2 })).toEqual({ growth_base_b: 2 });
    expect(growthRace.initialValues(spec, 4, target)).toEqual({ answer: 4, step_count_x: 4 });
  });

  it("solves every real lesson, review and practice target with legal controls and named feedback", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["math-growth-race-01"]);
    for (const lesson of lessons) {
      const s = lesson.spec as ModuleSpec;
      const targets = [s.stage3Prediction.target, s.retentionHooks.reviewTarget, ...(s.practice?.items.map((item) => item.target) ?? [])];
      for (const t of targets) {
        const solution = growthRace.solve(t, s);
        expect(solution.answer).toBe(t.answer);
        expect(growthRace.evaluate(solution, t, s.stage3Prediction.tolerance, s).correct).toBe(true);
        const controls = growthRace.predictionControls(s, t);
        expect(controls.length).toBeLessThanOrEqual(2);
        for (const control of controls) {
          const value = solution[control.variableName]!;
          expect(value).toBeGreaterThanOrEqual(control.min);
          expect(value).toBeLessThanOrEqual(control.max);
          if (control.choices) expect(control.choices).toContain(value);
          for (const answer of control.choices ?? []) {
            const verdict = growthRace.evaluate({ ...solution, [control.variableName]: answer }, t, 0, s);
            if (!verdict.correct) {
              expect(verdict.kind).toBeDefined();
              expect(s.stage3Prediction.adaptiveFeedback.byKind?.[verdict.kind!]).toBeDefined();
            }
          }
        }
      }
      for (const item of s.practice?.items ?? []) {
        const values = growthRace.initialValues(s, 3, item.target);
        const solved = growthRace.solve(item.target, s);
        for (const preset of item.presetControls ?? []) values[preset] = solved[preset]!;
        if (item.fade === "assisted") {
          expect(values.growth_base_b).toBe(3);
          expect(values.answer).toBeUndefined();
        }
      }
    }
  });

  it("keeps every prediction at its starting heights until a verdict", () => {
    for (const t of [target, review, { growth_base_b: 3, answer: 2 }]) {
      const values = { answer: 6, step_count_x: 6, growth_base_b: 3 };
      const frame = raceFrame({ ...baseProps, target: t, values });
      expect(frame.hidden).toBe(true);
      expect(frame.step).toBe(0);
      expect(frame.current).toEqual({ blue: t === review ? 20 : 1, amber: 1 });
      if (t.growth_base_b === undefined) expect(frame.race.base).toBe(2);
      const waiting = render({ target: t, values });
      expect(waiting).not.toContain('data-race="previous"');
      expect(waiting).not.toContain('data-race="gap"');
      expect(waiting).not.toContain('data-race="step-discrepancy"');
      expect(waiting).not.toContain("Δ");
    }
  });

  it("reveals adjacent comparisons and marching red discrepancies after a miss", () => {
    const verdict = growthRace.evaluate({ answer: 3 }, target, 0, spec);
    const result = render({ values: { answer: 3 }, verdict });
    expect(result).toContain('data-race="previous"');
    expect(result).toContain('data-race="gap"');
    expect(result).toContain('data-race="step-discrepancy"');
    expect(result).toContain('stroke-dasharray="6 4"');
    expect(result).toContain("gb-march");
    expect(result).toContain("Δ −2");
    expect(result).toContain("Δ −1");
    const late = render({ target: review, values: { answer: 13 }, verdict: growthRace.evaluate({ answer: 13 }, review, 0, spec) });
    expect(late).toContain("8192");
    expect(late).toContain("4096");
    expect(late).not.toMatch(/(?:NaN|Infinity)/);
  });

  it("animates anchoring and guided practice without text, and retains copy geometry at the static endpoint", () => {
    expect(render({ stage: 1 })).toContain("gb-anchoring");
    expect(render({ stage: 1 })).not.toContain("<text");
    const start = raceFrame({ ...baseProps, stage: 1, anchorT: 0 });
    const end = raceFrame({ ...baseProps, stage: 1, anchorT: 1 });
    expect(start.current).toEqual({ blue: 1, amber: 1 });
    expect(end.current).toEqual({ blue: 13, amber: 16 });
    expect(render({ stage: 1 })).toContain('stroke-dasharray="3 3"');
    expect(raceFrame({ ...baseProps, guide: 0 }).current).toEqual({ blue: 1, amber: 1 });
    expect(raceFrame({ ...baseProps, guide: 1 }).current).toEqual({ blue: 13, amber: 16 });
    expect(render({ guide: 0.5 })).not.toContain("<text");
    expect(render({ guide: 1 })).toContain(">16</text>");
  });

  it("draws the multiplier discrepancy on the tower when an autonomous base is wrong", () => {
    const practiceTarget = { growth_base_b: 2, answer: 4 };
    const values = { growth_base_b: 3, answer: 4 };
    const result = render({ target: practiceTarget, values, verdict: growthRace.evaluate(values, practiceTarget, 0, spec) });
    expect(result).toContain('data-race="base-discrepancy"');
    expect(result).toContain("Δ b +1");
    expect(result).not.toContain('data-race="step-discrepancy"');
  });

  it("honors fixed exploration parameters and maps formal symbols to their bands", () => {
    const custom = { ...spec, stage2Exploration: { ...spec.stage2Exploration, fixed: { start_height: 2, linear_start: 5, linear_gain: 2 } } };
    expect(raceFrame({ ...baseProps, stage: 2, spec: custom, values: { step_count_x: 2, growth_base_b: 3 } }).current).toEqual({ blue: 9, amber: 18 });
    const result = render({ stage: 4, values: growthRace.initialValues(spec, 4, target) });
    expect(result).toContain('fill="var(--color-band-slate)"');
    expect(result).toContain("a = 1");
    expect(result).toContain("b = 2");
    expect(result).toContain("x = 4");
    const views = [1, 2, 3, 4].map((stage) => render({ stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)?.[1]);
    expect(new Set(views).size).toBe(1);
  });

  it("provides keyboard and in-plane step input, snapping and honoring locks", () => {
    const calls: [string, number][] = [];
    const props: BoardProps = { ...baseProps, stage: 2, values: { step_count_x: 1, growth_base_b: 2 }, input: {
      controls: spec.stage2Exploration.controls, onChange: (name, value) => calls.push([name, value]),
    } };
    const view = mount(createElement(growthRace.Board, props));
    try {
      fireEvent.keyDown(view.getByRole("slider", { name: "Step" }), { key: "ArrowRight" });
      expect(calls).toEqual([["step_count_x", 2]]);
      calls.length = 0;
      const svg = view.container.querySelector("svg")!;
      const handle = view.container.querySelector(".gb-handle")!;
      Object.defineProperty(svg, "getScreenCTM", { value: () => null });
      Object.defineProperty(handle, "setPointerCapture", { value() {} });
      fireEvent.pointerDown(handle, { clientX: 183, clientY: 300, pointerId: 1 });
      expect(calls).toEqual([["step_count_x", 3]]);
      calls.length = 0;
      view.rerender(createElement(growthRace.Board, { ...props, input: { ...props.input!, locked: ["step_count_x"] } }));
      fireEvent.keyDown(view.getByRole("slider", { name: "Step" }), { key: "ArrowRight" });
      expect(calls).toEqual([]);
      expect(view.container.querySelector(".gb-handle")).toBeNull();
    } finally { view.unmount(); }
  });
});
