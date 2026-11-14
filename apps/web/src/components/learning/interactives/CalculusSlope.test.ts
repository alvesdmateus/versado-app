import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { bridgeSlope, calculusSlope, practiceInput, slopeCase, slopeGraph } from "./CalculusSlope";
import { splitControls, unanswered } from "../controls";
import { getInteractive } from "./index";
import type { BoardProps, Values } from "./types";

// Runtime import keeps API content outside the web TypeScript rootDir.
const contentPath = "../../../../../api/src/content/calculus";
const { calculusModules } = await import(contentPath) as { calculusModules: LearningModuleInput[] };
const lessons = calculusModules.filter((lesson) => lesson.interactive === "calculus-slope");
const specs = lessons.map((lesson) => lesson.spec as ModuleSpec);
const [secant, derivative, extrema] = specs as [ModuleSpec, ModuleSpec, ModuleSpec];
const goal = (s: ModuleSpec) => s.stage3Prediction.target;
const review = (s: ModuleSpec) => s.retentionHooks.reviewTarget!;

function render(spec: ModuleSpec, overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(calculusSlope.Board, {
    spec, stage: 3, target: goal(spec), values: calculusSlope.initialValues(spec, 3, goal(spec)),
    verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

describe("calculusSlope", () => {
  it("registers the board and solves every real lesson, review, and practice target", () => {
    expect(getInteractive("calculus-slope")).toBe(calculusSlope);
    expect(lessons.map((l) => l.id)).toEqual(["math-secant-01", "math-derivative-01", "math-extrema-01"]);
    for (const s of specs) {
      for (const t of [goal(s), review(s), ...s.practice!.items.map((item) => item.target)]) {
        const solution = calculusSlope.solve(t, s);
        expect(calculusSlope.evaluate(solution, t, s.stage3Prediction.tolerance, s)).toEqual({ correct: true, delta: 0 });
        const controls = calculusSlope.predictionControls(s, t);
        expect(controls.length).toBeLessThanOrEqual(2);
        for (const c of controls) {
          const value = solution[c.variableName]!;
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(c.min);
          expect(value).toBeLessThanOrEqual(c.max);
          if (c.choices) expect(c.choices).toContain(value);
          else expect((value - c.min) / c.step).toBeCloseTo(Math.round((value - c.min) / c.step));
        }
      }
      for (const item of s.practice!.items) {
        for (const name of item.presetControls ?? []) expect(calculusSlope.solve(item.target, s)[name]).toBeDefined();
      }
    }
  });

  it("changes only the review case, preserving the parabola and anchor in practice", () => {
    expect(slopeCase(goal(secant), secant).anchor).toBe(1);
    expect(slopeCase(review(secant), secant).anchor).toBe(-1);
    expect(calculusSlope.solve(review(secant), secant)).toEqual({ answer: -2 });
    expect(slopeCase(review(derivative), derivative).straight).toBe(true);
    expect(calculusSlope.solve(review(derivative), derivative)).toEqual({ answer: 5 });
    expect(calculusSlope.solve(review(extrema), extrema)).toEqual({ surfer_x: 1 });
    for (const item of secant.practice!.items) expect(slopeCase(item.target, secant).anchor).toBe(1);
    for (const item of derivative.practice!.items) expect(slopeCase(item.target, derivative).straight).toBe(false);
  });

  it("never divides by zero, and uses the unrounded bridge geometry", () => {
    expect(bridgeSlope(1, 3)).toBe(5);
    expect(bridgeSlope(1, 0.01)).toBe(2.01);
    expect(bridgeSlope(-1, 3)).toBe(1);
    expect(bridgeSlope(1, 0)).toBe(2.01);
    expect(bridgeSlope(1, -3)).toBe(2.01);
    expect(calculusSlope.evaluate({ answer: 2.001 }, goal(secant), 0, secant).correct).toBe(false);
    expect(calculusSlope.evaluate({ surfer_x: -1.049 }, goal(extrema), 0.05, extrema).correct).toBe(true);
    expect(calculusSlope.evaluate({ surfer_x: -1.051 }, goal(extrema), 0.05, extrema).correct).toBe(false);
  });

  it("names every misconception in the real lesson feedback", () => {
    const cases: [ModuleSpec, Values, Values, string][] = [
      [secant, goal(secant), { answer: 5 }, "secant"],
      [secant, review(secant), { answer: 1 }, "secant"],
      [secant, goal(secant), { answer: 0 }, "zero"],
      [secant, goal(secant), { answer: -2 }, "sign"],
      [secant, review(secant), { answer: 2 }, "sign"],
      [derivative, goal(derivative), { answer: 2 }, "height"],
      [derivative, goal(derivative), { answer: 3 }, "sign"],
      [derivative, goal(derivative), { answer: 4 }, "reversed"],
      [derivative, review(derivative), { answer: 6 }, "height"],
      [derivative, review(derivative), { answer: 7 }, "intercept"],
      [derivative, review(derivative), { answer: 8 }, "flat"],
      [extrema, goal(extrema), { surfer_x: 0 }, "height"],
      [extrema, goal(extrema), { surfer_x: 1 }, "swapped"],
      [extrema, review(extrema), { surfer_x: -1 }, "swapped"],
      [extrema, { surfer_x: -1, answer: -1 }, { surfer_x: -1, answer: 0 }, "shelf"],
      [extrema, { surfer_x: -1, answer: -1 }, { surfer_x: -1, answer: 1 }, "swapped"],
    ];
    for (const [s, t, v, kind] of cases) {
      const result = calculusSlope.evaluate(v, t, s.stage3Prediction.tolerance, s);
      expect(result.correct).toBe(false);
      expect(result.kind).toBe(kind as typeof result.kind);
      expect(s.stage3Prediction.adaptiveFeedback.byKind?.[kind]).toBeDefined();
    }
  });

  it("evaluates setup as well as answer, rejects missing/nonfinite values, and keeps answers discrete", () => {
    for (const s of specs) {
      for (const t of [goal(s), review(s), ...s.practice!.items.map((item) => item.target)]) {
        const solution = calculusSlope.solve(t, s);
        for (const key of Object.keys(solution)) {
          for (const bad of [undefined, NaN, Infinity]) {
            const v = { ...solution, [key]: bad } as Values;
            expect(calculusSlope.evaluate(v, t, 0.05, s).correct).toBe(false);
          }
        }
      }
    }
    expect(calculusSlope.evaluate({ step_gap_h: 1, answer: 2 }, { step_gap_h: 0.01, answer: 2 }, 0, secant).correct).toBe(false);
    expect(calculusSlope.evaluate({ zoom_magnification: 49, answer: 1 }, { zoom_magnification: 50, answer: 1 }, 0, derivative).correct).toBe(false);
    expect(calculusSlope.evaluate({ surfer_x: -1, answer: -0.99 }, { surfer_x: -1, answer: -1 }, 0.05, extrema).correct).toBe(false);
    expect(calculusSlope.formatDelta({ correct: false, delta: 3 })).toBe("Δ +3");
  });

  it("provides numeric slope choices and translated graph/direction choices", () => {
    expect(calculusSlope.predictionControls(secant, goal(secant))[0]!.choices).toEqual([2, 5, 0, -2]);
    expect(calculusSlope.predictionControls(secant, review(secant))[0]!.choices).toEqual([-2, 1, 0, 2]);
    for (const [t, expected] of [[goal(derivative), [1, 2, 3, 4]], [review(derivative), [5, 6, 7, 8]]] as const) {
      const [c] = calculusSlope.predictionControls(derivative, t);
      expect(c!.choices).toEqual([...expected]);
      for (const option of c!.choices!) expect(c!.choiceLabels?.[option]).toStartWith("lesson.choice.calculus-slope.");
    }
    expect(calculusSlope.predictionControls(extrema, goal(extrema))).toHaveLength(1);
    expect(calculusSlope.predictionControls(extrema, goal(extrema))[0]!.variableName).toBe("surfer_x");
    const practice = calculusSlope.predictionControls(extrema, { surfer_x: -1, answer: -1 });
    expect(practice[1]!.choices).toEqual([-1, 1, 0]);
    expect(practice[1]!.choiceLabels?.[0]).toBe("lesson.choice.calculus-slope.level");
  });

  it("honors spec initial values and leaves choices unpicked at every gate", () => {
    for (const s of specs) {
      const initial = Object.fromEntries(s.stage2Exploration.controls.map((c) => [c.variableName, c.initial]));
      expect(calculusSlope.initialValues(s, 1, goal(s))).toEqual(initial);
      expect(calculusSlope.initialValues(s, 2, goal(s))).toEqual(initial);
      expect(calculusSlope.initialValues(s, 4, goal(s))).toEqual({ ...initial, ...calculusSlope.solve(goal(s), s) });
      for (const t of [goal(s), review(s), ...s.practice!.items.map((item) => item.target)]) {
        const values = calculusSlope.initialValues(s, 3, t);
        expect(values.answer).toBeUndefined();
        const controls = calculusSlope.predictionControls(s, t);
        if (controls.some((c) => c.choices)) expect(unanswered(controls, values)).toBe(true);
        // Locally owned controls never duplicate the host's sliders or choices.
        expect(splitControls(calculusSlope, controls).free).toEqual([]);
      }
    }
    const changed = { ...derivative, stage2Exploration: { ...derivative.stage2Exploration, controls: derivative.stage2Exploration.controls.map((c) => ({ ...c, initial: c.variableName === "probe_x" ? -0.5 : 7 })) } };
    expect(calculusSlope.initialValues(changed, 2, goal(changed))).toEqual({ probe_x: -0.5, zoom_magnification: 7 });
  });

  it("runs setup then choice, retaining assisted presets and only one live practice variable", () => {
    for (const s of specs) {
      for (const item of s.practice!.items.filter((i) => i.fade !== "guided")) {
        const controls = calculusSlope.predictionControls(s, item.target);
        const initial = calculusSlope.initialValues(s, 3, item.target);
        const setup = controls.find((c) => !c.choices)!;
        const waiting = practiceInput({ controls, onChange() {} }, initial, item.target, s)!;
        expect(waiting.controls.filter((c) => !waiting.locked?.includes(c.variableName))).toHaveLength(1);
        expect(waiting.controls.some((c) => c.choices)).toBe(false);
        const solved = calculusSlope.solve(item.target, s);
        const ready = practiceInput({ controls, onChange() {}, locked: item.presetControls }, { [setup.variableName]: solved[setup.variableName]! }, item.target, s)!;
        expect(ready.locked).toContain(setup.variableName);
        expect(ready.controls.filter((c) => !ready.locked?.includes(c.variableName))).toHaveLength(1);
        expect(ready.controls.some((c) => c.choices)).toBe(true);
      }
    }
  });

  it("keeps anchoring silent, changes geometry over time, and retains informative final ghosts", () => {
    for (const s of specs) {
      const first = render(s, { stage: 1, anchorT: 0 });
      const last = render(s, { stage: 1, anchorT: 1 });
      expect(last).toContain("gb-anchoring");
      expect(last).not.toContain("<text");
      expect(first).not.toEqual(last);
      expect(last).toMatch(/opacity="0\.(25|3)"/);
      const boxes = [1, 2, 3, 4].map((stage) => render(s, { stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)?.[1]);
      expect(new Set(boxes).size).toBe(1);
    }
  });

  it("hides limiting rails and slope traces until commit, including the negative-slope review", () => {
    for (const t of [goal(secant), review(secant)]) {
      const waiting = render(secant, { target: t, values: { step_gap_h: 3, answer: t.answer! } });
      expect(waiting).not.toContain('data-slope="limit"');
      expect(waiting).not.toContain('data-slope="trace"');
      expect(waiting).not.toContain('data-slope="slope-dot"');
      expect(waiting).toContain('data-slope="bridge"');
      const revealed = render(secant, { target: t, values: { answer: 0 }, verdict: { correct: false, delta: -t.answer!, kind: "zero" } });
      expect(revealed).toContain('data-slope="limit"');
      expect(revealed).toContain('data-slope="miss"');
      expect(revealed).toContain('stroke-dasharray="6 4"');
      expect(revealed).toContain("gb-march");
      expect(revealed).toContain("Δ");
      // The committed reveal shrinks the finite bridge, stopping before the zero-gap singularity.
      expect(revealed).toContain(">0.01</text>");
      expect(revealed).toContain(t.answer === 2 ? ">2.01</text>" : ">-1.99</text>");
    }
    for (const t of [goal(derivative), review(derivative)]) {
      const waiting = render(derivative, { target: t });
      expect(waiting).not.toContain('data-slope="trace"');
      expect(waiting).not.toContain('data-slope="slope-dot"');
      expect(waiting).toContain('data-slope="candidates"');
      const picked = render(derivative, { target: t, values: { answer: 2, probe_x: 1 } });
      expect(picked).toContain('data-slope="candidate"');
      expect(picked).not.toContain('data-slope="trace"');
      const revealed = render(derivative, { target: t, values: { answer: 2 }, verdict: { correct: false, delta: 1, kind: "height" } });
      expect(revealed).toContain('data-slope="trace"');
      expect(revealed).toContain('data-slope="miss"');
      expect(revealed).toContain("gb-march");
    }
  });

  it("hides the upper hill while keeping the slope graph and pin controllable", () => {
    const hidden = render(extrema);
    expect(hidden).not.toContain('data-slope="curve"');
    expect(hidden).not.toContain('data-slope="surfer"');
    expect(hidden).toContain('data-slope="trace"');
    expect(hidden).toContain('data-slope="hidden-pin"');
    const revealed = render(extrema, { values: { surfer_x: 1 }, verdict: { correct: false, delta: 2, kind: "swapped" } });
    expect(revealed).toContain('data-slope="curve"');
    expect(revealed).toContain('data-slope="surfer"');
    expect(revealed).toContain('data-slope="level"');
    expect(revealed).toContain('data-slope="miss"');
    expect(revealed).toContain("Δx +2");
  });

  it("drives guided geometry and delays readouts until the demo settles", () => {
    for (const s of specs) {
      const t = s.practice!.items[0]!.target;
      const moving = render(s, { target: t, guide: 0.5, values: calculusSlope.solve(t, s) });
      expect(moving).toContain('data-slope="curve"');
      expect(moving).toContain('data-slope="trace"');
      expect(moving).not.toContain('data-slope="hidden-pin"');
      // Axis ticks remain; value tags are withheld during the demonstration.
      expect(moving).not.toContain('stroke-width="4" stroke-linejoin="round"');
      expect(render(s, { target: t, guide: 1, values: calculusSlope.solve(t, s) })).toContain('stroke-width="4" stroke-linejoin="round"');
    }
  });

  it("shows the exact derivative candidates and formal colors/zero-slope shelf", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((a) => slopeGraph(a, -1))).toEqual([-2, 1, 2, 2, 3, -2, 1, 0]);
    expect(render(secant, { stage: 4 })).toContain("f(x+h) − f(x)");
    const bowl = render(derivative, { stage: 4, values: { probe_x: 1, zoom_magnification: 50 } });
    expect(bowl).toContain('fill="var(--color-band-blue)"');
    expect(bowl).toContain("x²");
    expect(bowl).toContain('fill="var(--color-band-emerald)"');
    expect(bowl).toContain("2x");
    const turning = render(extrema, { stage: 4, values: { surfer_x: -1 } });
    expect(turning).toContain("f′(x) = 0");
    expect(turning).toContain('data-slope="shelf"');
    expect(turning).toContain("+ 0 +");
    expect(turning).toContain("+ 0 −");
    expect(turning).toContain("− 0 +");
  });

  it("moves rails by keyboard and handles, then locks the surfer before direction choice", () => {
    const calls: [string, number][] = [];
    const t = { surfer_x: -1, answer: -1 };
    const controls = calculusSlope.predictionControls(extrema, t);
    const props: BoardProps = {
      spec: extrema, stage: 3, target: t, values: { surfer_x: -1.5 }, verdict: null, anchorT: 1, changed: null,
      input: { controls, onChange: (name, value) => calls.push([name, value]) },
    };
    const view = mount(createElement(calculusSlope.Board, props));
    try {
      expect(view.queryByRole("radiogroup")).toBeNull();
      fireEvent.keyDown(view.getByRole("slider"), { key: "ArrowRight" });
      expect(calls).toEqual([["surfer_x", -1.4]]);
      calls.length = 0;
      const svg = view.container.querySelector("svg")!;
      const handle = view.container.querySelector(".gb-handle")!;
      Object.defineProperty(svg, "getScreenCTM", { value: () => null });
      Object.defineProperty(handle, "setPointerCapture", { value() {} });
      fireEvent.pointerDown(handle, { clientX: 170, clientY: 100, pointerId: 1 });
      expect(calls).toEqual([["surfer_x", 0]]);
      calls.length = 0;
      view.rerender(createElement(calculusSlope.Board, { ...props, values: { surfer_x: -1 }, input: { ...props.input!, locked: ["surfer_x"] } }));
      expect(view.getByRole("slider").getAttribute("aria-disabled")).toBe("true");
      expect(view.container.querySelector(".gb-handle")).toBeNull();
      expect(view.getByRole("radiogroup")).toBeDefined();
      fireEvent.keyDown(view.getByRole("slider"), { key: "ArrowRight" });
      expect(calls).toEqual([]);
      fireEvent.click(view.getAllByRole("radio")[0]!);
      expect(calls).toEqual([["answer", -1]]);
    } finally { view.unmount(); }
  });

  it("keeps zoom and probe as two exploration variables, with a keyboard probe rail", () => {
    const calls: [string, number][] = [];
    const input = { controls: derivative.stage2Exploration.controls.map((c) => ({ ...c })), onChange: (name: string, value: number) => calls.push([name, value]) };
    const props: BoardProps = { spec: derivative, stage: 2, target: goal(derivative), values: { probe_x: 1, zoom_magnification: 1 }, verdict: null, anchorT: 1, changed: null, input };
    const view = mount(createElement(calculusSlope.Board, props));
    try {
      expect(view.getAllByRole("slider")).toHaveLength(2);
      expect(view.getByRole("group", { name: "Probe position" })).toBeDefined();
      fireEvent.keyDown(view.getByRole("slider", { name: "x" }), { key: "ArrowLeft" });
      expect(calls).toEqual([["probe_x", 0.9]]);
      const before = view.container.querySelector('[data-slope="lens-curve"]')!.getAttribute("d");
      view.rerender(createElement(calculusSlope.Board, { ...props, values: { probe_x: 1, zoom_magnification: 50 } }));
      expect(view.container.querySelector('[data-slope="lens-curve"]')!.getAttribute("d")).not.toEqual(before);
    } finally { view.unmount(); }
  });
});
