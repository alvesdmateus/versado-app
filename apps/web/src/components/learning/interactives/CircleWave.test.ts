import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { circleWave, firstCrest, waveHeight } from "./CircleWave";
import { getInteractive } from "./index";
import type { BoardProps, Values } from "./types";

// Runtime import keeps API content outside the web tsconfig's rootDir.
const contentPath = "../../../../../api/src/content/trigonometry";
const { trigModules } = await import(contentPath) as { trigModules: LearningModuleInput[] };
const lessons = trigModules.filter((lesson) => lesson.interactive === "circle-wave");
const spec = lessons[0]!.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const TAU = Math.PI * 2;

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(circleWave.Board, {
    spec, stage: 3, target, values: { amplitude: 1, frequency: 1 }, verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

function mark(markup: string, name: string) {
  return markup.match(new RegExp(`<path data-wave="${name}"[^>]*`))?.[0];
}

describe("circleWave math and lesson contract", () => {
  it("registers the content slug and binds only amplitude to an axis", () => {
    expect(getInteractive("circle-wave")).toBe(circleWave);
    expect(circleWave.axes).toEqual({ amplitude: "y" });
  });

  it("uses angular frequency, amplitude, phase and the cosine comparison", () => {
    expect(waveHeight(2, 3, 0)).toBe(0);
    expect(waveHeight(2, 3, Math.PI / 6)).toBeCloseTo(2);
    expect(waveHeight(2, 3, Math.PI / 2)).toBeCloseTo(-2);
    expect(waveHeight(2, 3, 0, 1)).toBe(2);
    expect(waveHeight(2, 3, 0, 0, Math.PI / 2)).toBe(2);
    for (const f of [0.5, 1, 1.5, 2, 2.5, 3]) {
      const crest = firstCrest(f);
      expect(waveHeight(2, f, crest)).toBeCloseTo(2);
      expect(waveHeight(2, f, crest + TAU / f)).toBeCloseTo(2);
      expect(waveHeight(2, f, crest + Math.PI / f)).toBeCloseTo(-2);
    }
    expect(firstCrest(2, 1)).toBe(0);
    expect(firstCrest(2, 0, Math.PI)).toBeCloseTo(3 * Math.PI / 4);
  });

  it("solves the requested pair without treating context as a response", () => {
    expect(circleWave.solve({ ...target, mode: 1, timeSpan: 20 }, spec)).toEqual({ amplitude: 2, frequency: 3 });
    expect(circleWave.solve({ amplitude: 2 })).toEqual({});
    expect(circleWave.solve({ amplitude: 0, frequency: 2 })).toEqual({});
    expect(circleWave.solve({ amplitude: 2, frequency: NaN })).toEqual({});
  });

  it("diagnoses height, spacing, and exchanged parameters with the content's exact kinds", () => {
    expect(circleWave.evaluate({ amplitude: 1, frequency: 3 }, target, 0)).toEqual({ correct: false, delta: -1, kind: "amplitude" });
    expect(circleWave.evaluate({ amplitude: 2, frequency: 1 }, target, 0)).toEqual({ correct: false, delta: -2, kind: "frequency" });
    expect(circleWave.evaluate({ amplitude: 3, frequency: 2 }, target, 0)).toEqual({ correct: false, delta: 1, kind: "swapped" });
    expect(circleWave.evaluate({ amplitude: 1, frequency: 1 }, target, 0)).toEqual({ correct: false, delta: -1 });
    expect(Object.keys(spec.stage3Prediction.adaptiveFeedback.byKind!)).toEqual(["amplitude", "frequency", "swapped"]);
    expect(circleWave.formatDelta({ correct: false, delta: -1 })).toBe("−1");
  });

  it("checks both parameters in their own units, including the exact tolerance boundary", () => {
    expect(circleWave.evaluate(circleWave.solve(target), target, 0)).toEqual({ correct: true, delta: 0 });
    expect(circleWave.evaluate({ amplitude: 2.125, frequency: 2.875 }, target, 0.125).correct).toBe(true);
    expect(circleWave.evaluate({ amplitude: 2.125, frequency: 2.875 }, target, 0.1).correct).toBe(false);
    expect(circleWave.evaluate({ amplitude: 2.25, frequency: 3 }, target, 0.125).kind).toBe("amplitude");
    expect(circleWave.evaluate({ amplitude: 2, frequency: 2.75 }, target, 0.125).kind).toBe("frequency");
    const invalidValues: Values[] = [{}, { amplitude: 2 }, { amplitude: Infinity, frequency: 3 }, { amplitude: 2, frequency: NaN }, { amplitude: 2, frequency: 0 }];
    for (const values of invalidValues) {
      expect(circleWave.evaluate(values, target, 0).correct).toBe(false);
    }
    expect(circleWave.evaluate({ amplitude: 2, frequency: 3 }, {}, 0).correct).toBe(false);
  });

  it("preserves labels, steps, ranges and bands from the spec in its two prediction controls", () => {
    const controls = circleWave.predictionControls(spec, target);
    expect(controls).toHaveLength(2);
    for (const c of controls) {
      const source = spec.stage2Exploration.controls.find((control) => control.variableName === c.variableName)!;
      expect(c).toEqual({ variableName: source.variableName, label: source.label, min: source.min, max: source.max, step: source.step, colorToken: source.colorToken });
      expect(c.choices).toBeUndefined();
    }
  });

  it("starts from exploration settings without copying any target, and formalizes the solved pair", () => {
    for (const stage of [1, 2, 3] as const) expect(circleWave.initialValues(spec, stage, target)).toEqual({ amplitude: 1, frequency: 1 });
    expect(circleWave.initialValues(spec, 3, { amplitude: 3, frequency: 0.5 })).toEqual({ amplitude: 1, frequency: 1 });
    expect(circleWave.initialValues(spec, 4, target)).toEqual({ amplitude: 2, frequency: 3 });
    const custom = { ...spec, stage2Exploration: { ...spec.stage2Exploration, controls: spec.stage2Exploration.controls.map((c) => ({ ...c, initial: 0.5 })) } };
    expect(circleWave.initialValues(custom, 3, target)).toEqual({ amplitude: 0.5, frequency: 0.5 });
  });

  it("solves every real lesson, review and practice target on reachable controls", () => {
    expect(lessons.map((lesson) => lesson.id)).toContain("math-trig-waves-01");
    for (const lesson of lessons) {
      const real = lesson.spec as ModuleSpec;
      const targets = [real.stage3Prediction.target, real.retentionHooks.reviewTarget!, ...(real.practice?.items ?? []).map((item) => item.target)];
      for (const goal of targets) {
        const solved = circleWave.solve(goal, real);
        expect(solved).toEqual({ amplitude: goal.amplitude!, frequency: goal.frequency! });
        expect(circleWave.evaluate(solved, goal, real.stage3Prediction.tolerance, real).correct).toBe(true);
        for (const c of circleWave.predictionControls(real, goal)) {
          const value = solved[c.variableName]!;
          expect(value).toBeGreaterThanOrEqual(c.min);
          expect(value).toBeLessThanOrEqual(c.max);
          expect((value - c.min) / c.step).toBeCloseTo(Math.round((value - c.min) / c.step));
        }
      }
      for (const item of real.practice?.items ?? []) {
        const initial = circleWave.initialValues(real, 3, item.target);
        const solved = circleWave.solve(item.target, real);
        for (const key of item.presetControls ?? []) initial[key] = solved[key]!;
        for (const key of item.presetControls ?? []) expect(initial[key]).toBe(solved[key]);
        if (item.fade === "assisted") expect(circleWave.predictionControls(real, item.target).some((c) => !item.presetControls.includes(c.variableName))).toBe(true);
      }
    }
  });
});

describe("circleWave board states", () => {
  it("keeps anchoring silent, draws a growing trail and preserves a useful final-frame ghost", () => {
    const start = render({ stage: 1, anchorT: 0.2 });
    const end = render({ stage: 1, anchorT: 1 });
    expect(start).toContain("gb-anchoring");
    expect(end).not.toContain("<text");
    expect(end).not.toContain('role="slider"');
    expect(end).toContain('data-wave="shadow-link"');
    expect(end).toContain('stroke-opacity="0.3"');
    expect(mark(start, "trace")).not.toBe(mark(end, "trace"));
  });

  it("keeps a fixed viewport in all stages, review and guided practice", () => {
    const views = [1, 2, 3, 4].map((stage) => render({ stage: stage as BoardProps["stage"] }));
    views.push(render({ target: spec.retentionHooks.reviewTarget! }), render({ guide: 0.5 }));
    expect(new Set(views.map((markup) => markup.match(/viewBox="[^"]+"/)?.[0])).size).toBe(1);
    expect(views[0]).toContain('viewBox="-44 0 444 300"');
  });

  it("hides every candidate output and freezes the wheel until commitment, including assisted practice", () => {
    const waiting = render();
    const adjusted = render({ values: { amplitude: 3, frequency: 2 } });
    expect(mark(waiting, "ghost")).toBe(mark(adjusted, "ghost"));
    for (const name of ["trace", "pen", "shadow-link", "spacing", "diagnosis", "area-gap"]) expect(waiting).not.toContain(`data-wave="${name}"`);
    const item = spec.practice!.items.find((item) => item.fade === "assisted")!;
    const assisted = render({ target: item.target, values: { amplitude: item.target.amplitude!, frequency: 2 }, input: { controls: circleWave.predictionControls(spec, item.target), onChange() {}, locked: item.presetControls } });
    expect(assisted).toContain('data-wave="ghost"');
    expect(assisted).not.toContain('data-wave="trace"');
    expect(assisted).toContain('data-locked="true"');
    expect(assisted).not.toContain('class="gb-handle"');
  });

  it("reveals height and crest-spacing discrepancies as red marching geometry with signed deltas", () => {
    const revealed = render({ verdict: circleWave.evaluate({ amplitude: 1, frequency: 1 }, target, 0) });
    expect(revealed).toContain('data-wave="trace"');
    expect(revealed).toContain('data-wave="shadow-link"');
    expect(revealed).toContain('data-wave="area-gap"');
    expect(revealed).toContain('data-wave="diagnosis"');
    expect(revealed).toContain('stroke-dasharray="6 4"');
    expect(revealed).toContain("gb-march");
    expect(revealed).toContain("Δ −1");
    expect(revealed).toContain("Δt +1.05");
    expect(revealed).not.toMatch(/(?:NaN|Infinity)/);
    const correct = render({ values: target, verdict: { correct: true, delta: 0 } });
    expect(correct).toContain('data-wave="trace"');
    expect(correct).not.toContain('data-wave="diagnosis"');
  });

  it("shows a guided trace without a verdict and delays tags and handles until the motion ends", () => {
    const item = spec.practice!.items[0]!;
    const middle = render({ guide: 0.5, target: item.target, values: { amplitude: 1.25, frequency: 1.5 } });
    expect(middle).toContain('data-wave="trace"');
    expect(middle).not.toContain("<text");
    expect(middle).not.toContain('class="gb-handle"');
    const end = render({ guide: 1, target: item.target, values: item.target });
    expect(end).toContain(">1.5</text>");
    expect(end).toContain('data-wave="spacing"');
  });

  it("uses blue A, amber ω and rose sin(ωt) on their shapes during formalization", () => {
    const formal = render({ stage: 4 });
    expect(formal).toMatch(/fill="var\(--color-band-blue\)"[^>]*>A = 2<\/text>/);
    expect(formal).toMatch(/fill="var\(--color-band-amber\)"[^>]*>ω = 3<\/text>/);
    expect(formal).toMatch(/fill="var\(--color-band-rose\)"[^>]*>sin\(ωt\)<\/text>/);
    expect(formal).toContain("2π/ω = 2.09");
    expect(formal).not.toContain('data-wave="ghost"');
  });

  it("shows continued spacing when a slow wave's next crest is outside the fixed time window", () => {
    const slow = render({ stage: 2, values: { amplitude: 3, frequency: 0.5 } });
    expect(slow).toContain(">12.57</text>");
    expect(slow).not.toMatch(/(?:NaN|Infinity)/);
    expect(slow).toContain('data-wave="spacing"');
  });

  it("supports phase and the optional horizontal-shadow cosine comparison", () => {
    const cosineSpec = { ...spec, stage2Exploration: { ...spec.stage2Exploration, fixed: { mode: 1, phase: 0, timeSpan: TAU } } };
    const cosine = render({ spec: cosineSpec, stage: 4 });
    expect(cosine).toContain("cos(ωt)");
    expect(cosine).not.toContain("sin(ωt)");
    const miss = render({ spec: cosineSpec, values: { amplitude: 2, frequency: 1 }, verdict: { correct: false, delta: -2, kind: "frequency" } });
    expect(miss).toContain("Δt +2.09");
    expect(miss).not.toMatch(/(?:NaN|Infinity)/);
  });

  it("supports keyboard and in-plane amplitude adjustment, respects assisted locks and reduced motion", () => {
    const previous = window.matchMedia;
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
    const calls: [string, number][] = [];
    const props: BoardProps = {
      spec, stage: 3, target, values: { amplitude: 1, frequency: 1 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: circleWave.predictionControls(spec, target), onChange: (name, value) => calls.push([name, value]) },
    };
    const view = mount(createElement(circleWave.Board, props));
    try {
      fireEvent.keyDown(view.getByRole("slider", { name: "Peak height" }), { key: "ArrowUp" });
      expect(calls).toEqual([["amplitude", 1.5]]);
      calls.length = 0;
      const svg = view.container.querySelector("svg")!;
      const handle = view.container.querySelector(".gb-handle")!;
      Object.defineProperty(svg, "getScreenCTM", { value: () => null });
      Object.defineProperty(handle, "setPointerCapture", { value() {} });
      fireEvent.pointerDown(handle, { clientX: 86, clientY: 106, pointerId: 1 });
      fireEvent.pointerUp(handle);
      expect(calls).toEqual([["amplitude", 2]]);
      calls.length = 0;
      view.rerender(createElement(circleWave.Board, { ...props, input: { ...props.input!, locked: ["amplitude"] } }));
      fireEvent.keyDown(view.getByRole("slider", { name: "Peak height" }), { key: "ArrowUp" });
      expect(calls).toEqual([]);
      expect(view.container.querySelector(".gb-handle")).toBeNull();
      view.rerender(createElement(circleWave.Board, { ...props, stage: 2 }));
      expect(view.container.querySelector('[data-wave="pen"]')?.getAttribute("cx")).toBe("229.6");
    } finally {
      view.unmount();
      Object.defineProperty(window, "matchMedia", { configurable: true, value: previous });
    }
  });

  it("keeps fractional-speed rotation continuous as the paper advances to the next time window", () => {
    const previous = { raf: globalThis.requestAnimationFrame, cancel: globalThis.cancelAnimationFrame, now: performance.now, media: window.matchMedia };
    let frame: FrameRequestCallback | undefined;
    globalThis.requestAnimationFrame = (callback) => { frame = callback; return 1; };
    globalThis.cancelAnimationFrame = () => {};
    performance.now = () => 0;
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
    const view = mount(createElement(circleWave.Board, { spec, stage: 2, target, values: { amplitude: 2, frequency: 1.5 }, verdict: null, anchorT: 1, changed: null }));
    try {
      const tick = (time: number) => act(() => { frame!((time - TAU / 5) * 1000); });
      const spoke = () => view.container.querySelector('[data-wave="wheel"] > line')!;
      tick(TAU - 0.001);
      const before = { x: Number(spoke().getAttribute("x2")), y: Number(spoke().getAttribute("y2")) };
      tick(TAU + 0.001);
      const after = { x: Number(spoke().getAttribute("x2")), y: Number(spoke().getAttribute("y2")) };
      expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(1);
      const pen = view.container.querySelector('[data-wave="pen"]')!;
      expect(Number(pen.getAttribute("cy"))).toBeCloseTo(after.y);
      expect(Number(pen.getAttribute("cx"))).toBeLessThan(191);
    } finally {
      view.unmount();
      globalThis.requestAnimationFrame = previous.raf;
      globalThis.cancelAnimationFrame = previous.cancel;
      performance.now = previous.now;
      Object.defineProperty(window, "matchMedia", { configurable: true, value: previous.media });
    }
  });
});
