import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { doublingMachine, machineCase } from "./DoublingMachine";
import type { BoardProps, Values } from "./types";

// Runtime import keeps the API content outside the web tsconfig's rootDir.
const contentPath = "../../../../../api/src/content/growth";
const { growthModules } = await import(contentPath) as { growthModules: LearningModuleInput[] };
const lessons = growthModules.filter((lesson) => lesson.interactive === "doubling-machine");
const spec = lessons[0]!.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const assisted = spec.practice!.items[1]!.target;
const review = spec.retentionHooks.reviewTarget!;

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(doublingMachine.Board, {
    spec, stage: 3, target, values: { target_value_y: 5 }, verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

describe("doublingMachine", () => {
  it("distinguishes height placement, assisted doubling counts and tenfold review", () => {
    expect(machineCase(target, spec)).toMatchObject({ base: 2, start: 1, height: 16, steps: 4, countChoice: false });
    expect(machineCase(assisted, spec)).toMatchObject({ base: 2, height: 8, steps: 3, countChoice: true, review: false });
    expect(machineCase(review, spec)).toMatchObject({ base: 10, start: 1, height: 1000, steps: 3, review: true });
  });

  it("solves both prediction inputs and preserves assisted presets", () => {
    expect(doublingMachine.solve(target, spec)).toEqual({ target_value_y: 16 });
    expect(doublingMachine.solve(assisted, spec)).toEqual({ target_value_y: 8, answer: 3 });
    expect(doublingMachine.solve(review, spec)).toEqual({ answer: 3 });
    expect(doublingMachine.solve(target)).toEqual({ target_value_y: 16 });
  });

  it("evaluates the requested input without leaking truth from target keys", () => {
    expect(doublingMachine.evaluate({ target_value_y: 16 }, target, 0, spec)).toEqual({ correct: true, delta: 0 });
    expect(doublingMachine.evaluate({ target_value_y: 8, answer: 2 }, assisted, 0, spec).correct).toBe(false);
    expect(doublingMachine.evaluate({ target_value_y: 20, answer: 3 }, assisted, 0, spec)).toEqual({ correct: true, delta: 0 });
    expect(doublingMachine.evaluate({ answer: 3 }, review, 0, spec)).toEqual({ correct: true, delta: 0 });
    expect(doublingMachine.evaluate({ target_value_y: 16.01 }, target, 0.02, spec).correct).toBe(true);
    expect(doublingMachine.evaluate({ target_value_y: 16.03 }, target, 0.02, spec).correct).toBe(false);
    for (const value of [undefined, NaN, Infinity, -Infinity]) {
      const values: Values = value === undefined ? {} : { target_value_y: value };
      expect(doublingMachine.evaluate(values, target, 0, spec)).toEqual({ correct: false, delta: Infinity });
    }
    expect(doublingMachine.evaluate({}, review, 0, spec).correct).toBe(false);
  });

  it("diagnoses every named misconception in height, assisted and review modes", () => {
    for (const y of [8, 32]) {
      expect(doublingMachine.evaluate({ target_value_y: y }, target, 0, spec).kind).toBe("offByOne");
    }
    for (const y of [5, 9]) {
      expect(doublingMachine.evaluate({ target_value_y: y }, target, 0, spec).kind).toBe("additive");
    }
    for (const t of [assisted, review]) {
      for (const answer of [2, 4]) expect(doublingMachine.evaluate({ answer }, t, 0, spec).kind).toBe("offByOne");
    }
    expect(doublingMachine.evaluate({ answer: 8 }, assisted, 0, spec).kind).toBe("additive");
    expect(doublingMachine.evaluate({ answer: 100 }, review, 0, spec).kind).toBe("additive");
    expect(doublingMachine.evaluate({ target_value_y: 12 }, target, 0, spec)).toEqual({ correct: false, delta: -4 });
    expect(doublingMachine.formatDelta({ correct: false, delta: -4 })).toBe("−4");
  });

  it("uses spec controls, neutral prediction values and solved formalization", () => {
    expect(doublingMachine.initialValues(spec, 1, target)).toEqual({ target_value_y: 2 });
    expect(doublingMachine.initialValues(spec, 2, target)).toEqual({ target_value_y: 2 });
    expect(doublingMachine.initialValues(spec, 3, target)).toEqual({ target_value_y: 1 });
    expect(doublingMachine.initialValues(spec, 3, assisted)).toEqual({});
    expect(doublingMachine.initialValues(spec, 3, review)).toEqual({});
    expect(doublingMachine.initialValues(spec, 4, target)).toEqual({ target_value_y: 16 });
    const [height] = doublingMachine.predictionControls(spec, target);
    expect(height).toMatchObject({ variableName: "target_value_y", min: 1, max: 32, step: 0.25, colorToken: "amber" });
    expect(doublingMachine.axes).toEqual({ target_value_y: "y" });
    expect(doublingMachine.predictionControls(spec, assisted).map((c) => c.variableName)).toEqual(["target_value_y", "answer"]);
    expect(doublingMachine.predictionControls(spec, assisted)[1]!.choices).toEqual([2, 3, 4, 8]);
    expect(doublingMachine.predictionControls(spec, review)).toMatchObject([{ variableName: "answer", choices: [2, 3, 4, 100] }]);
  });

  it("solves every real lesson, review and practice target with legal controls and feedback", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["math-logarithm-01"]);
    for (const lesson of lessons) {
      const s = lesson.spec as ModuleSpec;
      const targets: Values[] = [s.stage3Prediction.target, s.retentionHooks.reviewTarget!, ...s.practice!.items.map((item) => item.target)];
      for (const t of targets) {
        const solution = doublingMachine.solve(t, s);
        expect(doublingMachine.evaluate(solution, t, s.stage3Prediction.tolerance, s).correct).toBe(true);
        for (const control of doublingMachine.predictionControls(s, t)) {
          const value = solution[control.variableName]!;
          expect(value).toBeGreaterThanOrEqual(control.min);
          expect(value).toBeLessThanOrEqual(control.max);
          expect((value - control.min) / control.step).toBeCloseTo(Math.round((value - control.min) / control.step));
          if (control.choices) {
            expect(control.choices).toContain(value);
            for (const answer of control.choices.filter((choice) => choice !== value)) {
              const verdict = doublingMachine.evaluate({ ...solution, [control.variableName]: answer }, t, 0, s);
              expect(verdict.correct).toBe(false);
              expect(s.stage3Prediction.adaptiveFeedback.byKind?.[verdict.kind!]).toBeDefined();
            }
          }
        }
      }
      for (const item of s.practice!.items) {
        for (const name of item.presetControls ?? []) expect(doublingMachine.solve(item.target, s)[name]).toBeDefined();
      }
    }
  });

  it("keeps anchoring silent with growing copies in the final frame and a fixed viewport", () => {
    const silent = render({ stage: 1 });
    expect(silent).toContain("gb-anchoring");
    expect(silent).not.toContain("<text");
    expect(silent).toContain('data-machine="trail"');
    expect(render({ stage: 1, anchorT: 0 })).not.toBe(silent);
    const boxes = [1, 2, 3, 4].map((stage) => render({ stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)?.[1]);
    expect(new Set(boxes).size).toBe(1);
  });

  it("freezes the counter and hides copies, log result, links and gaps before commitment", () => {
    const waiting = render({ values: { target_value_y: 12 } });
    expect(waiting).toContain('data-machine="height"');
    expect(waiting).toContain('data-machine="bead" cx="30"');
    for (const name of ["trail", "link", "gap"]) expect(waiting).not.toContain(`data-machine="${name}"`);
    expect(waiting).not.toContain("3.58");
    expect(waiting).not.toContain("Δ");
    const revealed = render({ verdict: doublingMachine.evaluate({ target_value_y: 5 }, target, 0, spec) });
    expect(revealed).toContain('data-machine="trail"');
    expect(revealed).toContain('data-machine="gap"');
    expect(revealed).toContain('stroke-dasharray="6 4"');
    expect(revealed).toContain("gb-march");
    expect(revealed).toContain("Δ −11");
  });

  it("shows tenfold review with no height control and bounds extreme count misses", () => {
    const controls = doublingMachine.predictionControls(spec, review);
    const waiting = render({ target: review, values: { answer: 100 }, input: { controls, onChange() {} } });
    expect(waiting).toContain(">1000</text>");
    expect(waiting).not.toContain('role="slider"');
    expect(waiting).not.toContain('data-machine="trail"');
    const revealed = render({ target: review, values: { answer: 100 }, verdict: doublingMachine.evaluate({ answer: 100 }, review, 0, spec) });
    for (const number of [10, 100, 1000]) expect(revealed).toContain(`>${number}</text>`);
    expect(revealed).toContain("Δ +97");
    expect(revealed).not.toMatch(/NaN|Infinity/);
  });

  it("animates guided practice, delays tags, and preserves amber y / blue x in formalization", () => {
    const moving = render({ target: { target_value_y: 4 }, values: { target_value_y: 2.5 }, guide: 0.5 });
    expect(moving).toContain('data-machine="trail"');
    expect(moving).not.toContain("<text");
    expect(render({ guide: 1, values: { target_value_y: 4 } })).toContain(">4</text>");
    const formal = render({ stage: 4, values: doublingMachine.solve(target, spec) });
    expect(formal).toContain('fill="var(--color-band-amber)"');
    expect(formal).toContain("y = 16");
    expect(formal).toContain("x = 4");
    expect(formal).toContain("×2");
  });

  it("offers a keyboard rail and in-plane handle, and locks the assisted height", () => {
    const changes: [string, number][] = [];
    const mounted = mount(createElement(doublingMachine.Board, {
      spec, stage: 2, target, values: { target_value_y: 2 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: doublingMachine.predictionControls(spec, target), onChange: (name, value) => changes.push([name, value]) },
    }));
    fireEvent.keyDown(mounted.getByRole("slider", { name: "Target height" }), { key: "ArrowUp" });
    expect(changes).toEqual([["target_value_y", 2.25]]);
    expect(mounted.container.innerHTML).toContain("cursor: ns-resize");
    mounted.unmount();
    const locked = render({ target: assisted, values: { target_value_y: 8 }, input: {
      controls: doublingMachine.predictionControls(spec, assisted), locked: ["target_value_y"], onChange() {},
    } });
    expect(locked).toContain('data-locked="true"');
    expect(locked).not.toContain("cursor:ns-resize");
  });
});
