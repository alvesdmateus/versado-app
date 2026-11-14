import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { logRuler, rulerCoordinate } from "./LogRuler";
import type { BoardProps, Values } from "./types";

// Dynamic path keeps API content outside the web tsconfig's rootDir, as in MatrixSystem.test.ts.
const contentPath = "../../../../../api/src/content/growth";
const { growthModules } = await import(contentPath) as { growthModules: LearningModuleInput[] };
const lessons = growthModules.filter((lesson) => lesson.interactive === "log-ruler");
const spec = lessons[0]!.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const review = spec.retentionHooks.reviewTarget!;

function render(overrides: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(logRuler.Board, {
    spec, stage: 3, target, values: { ruler_warp_factor: 1, marker_log: 2.5 },
    verdict: null, anchorT: 1, changed: null, ...overrides,
  }));
}

describe("logRuler", () => {
  it("morphs a linear ruler into equal tenfold gaps while preserving its endpoints", () => {
    for (const warp of [0, 0.25, 0.5, 1]) {
      expect(rulerCoordinate(1, warp)).toBe(0);
      expect(rulerCoordinate(1000, warp)).toBe(3);
      expect(rulerCoordinate(10, warp)).toBeLessThan(rulerCoordinate(100, warp));
    }
    expect(rulerCoordinate(500, 0)).toBeCloseTo(3 * 499 / 999);
    for (const [value, coordinate] of [[1, 0], [10, 1], [100, 2], [1000, 3]]) {
      expect(rulerCoordinate(value!, 1)).toBeCloseTo(coordinate!);
    }
    expect(rulerCoordinate(10, -2)).toBe(rulerCoordinate(10, 0));
    expect(rulerCoordinate(10, 2)).toBe(rulerCoordinate(10, 1));
  });

  it("solves log coordinates, including the review midpoint and practice configuration", () => {
    expect(logRuler.solve(target, spec)).toEqual({ ruler_warp_factor: 1, marker_log: 2.699 });
    expect(logRuler.solve(review, spec)).toEqual({ ruler_warp_factor: 1, marker_log: 2 });
    expect(logRuler.solve({ marker_log: 1.301, ruler_warp_factor: 1 }, spec)).toEqual({ ruler_warp_factor: 1, marker_log: 1.301 });
    expect(logRuler.solve({}).marker_log).toBeCloseTo(Math.log10(500));
  });

  it("accepts absolute log-coordinate tolerance and never accepts a raw 500", () => {
    expect(logRuler.evaluate({ marker_log: Math.log10(500) }, target, 0.01, spec).correct).toBe(true);
    expect(logRuler.evaluate({ marker_log: 2.689 }, target, 0.01, spec).correct).toBe(true);
    expect(logRuler.evaluate({ marker_log: 2.709 }, target, 0.01, spec).correct).toBe(true);
    expect(logRuler.evaluate({ marker_log: 2.688 }, target, 0.01, spec).correct).toBe(false);
    expect(logRuler.evaluate({ marker_log: 2.71 }, target, 0.01, spec).correct).toBe(false);
    for (const value of [500, -1, NaN, Infinity]) {
      expect(logRuler.evaluate({ marker_log: value }, target, 0.01, spec).correct).toBe(false);
    }
    expect(logRuler.evaluate({}, target, 0.01, spec).correct).toBe(false);
    expect(logRuler.evaluate({ marker_log: 2 }, review, 0, spec)).toEqual({ correct: true, delta: 0 });
  });

  it("diagnoses exactly the midpoint between 100 and 1000 and the old linear fraction", () => {
    for (const picked of [2.48, 2.5, 2.52]) {
      expect(logRuler.evaluate({ marker_log: picked }, target, 0.01, spec).kind).toBe("midpoint");
    }
    const linear = 2 + (500 - 100) / (1000 - 100);
    for (const picked of [linear - 0.02, linear, linear + 0.02]) {
      expect(logRuler.evaluate({ marker_log: picked }, target, 0.01, spec).kind).toBe("linearSpacing");
    }
    for (const picked of [1.5, 2.55, linear - 0.021]) {
      expect(logRuler.evaluate({ marker_log: picked }, target, 0.01, spec).kind).toBeUndefined();
    }
    expect(logRuler.evaluate({ marker_log: 2.5 }, review, 0.01, spec).kind).toBeUndefined();
    expect(logRuler.formatDelta({ correct: false, delta: -0.199 })).toBe("−0.2");
  });

  it("requires the logarithmic warp in practice, but fixes it in the main and review gates", () => {
    const practice = { ruler_warp_factor: 1, marker_log: 1.301 };
    expect(logRuler.evaluate({ marker_log: 1.301, ruler_warp_factor: 0.99 }, practice, 0.01, spec).correct).toBe(false);
    expect(logRuler.evaluate(logRuler.solve(practice), practice, 0.01, spec).correct).toBe(true);
    expect(logRuler.evaluate({ marker_log: 2 }, review, 0.01, spec).correct).toBe(true);
  });

  it("uses one horizontal placement rail and adds only the practice warp control", () => {
    expect(logRuler.axes).toEqual({ marker_log: "x" });
    const [marker] = logRuler.predictionControls(spec, target);
    expect(marker).toEqual({ variableName: "marker_log", label: "Marker", min: 0, max: 3, step: 0.001, colorToken: "slate" });
    expect(logRuler.predictionControls(spec, target)).toHaveLength(1);
    expect(logRuler.predictionControls(spec, review)).toHaveLength(1);
    const practiceControls = logRuler.predictionControls(spec, spec.practice!.items[1]!.target);
    expect(practiceControls.map((c) => c.variableName)).toEqual(["ruler_warp_factor", "marker_log"]);
    expect(practiceControls[0]).toMatchObject(spec.stage2Exploration.controls[0]!);
  });

  it("starts from authored exploration controls, clears placement, and solves formalization", () => {
    const custom = { ...spec, stage2Exploration: { ...spec.stage2Exploration, controls: spec.stage2Exploration.controls.map((c) => ({ ...c, initial: 0.4 })) } };
    expect(logRuler.initialValues(custom, 1, target)).toEqual({ ruler_warp_factor: 0.4 });
    expect(logRuler.initialValues(custom, 2, target)).toEqual({ ruler_warp_factor: 0.4 });
    expect(logRuler.initialValues(spec, 3, target)).toEqual({ ruler_warp_factor: 1, marker_log: 0 });
    expect(logRuler.initialValues(spec, 3, review)).toEqual({ ruler_warp_factor: 1, marker_log: 0 });
    expect(logRuler.initialValues(spec, 3, spec.practice!.items[2]!.target)).toEqual({ ruler_warp_factor: 0, marker_log: 0 });
    expect(logRuler.initialValues(spec, 4, target)).toEqual(logRuler.solve(target));
  });

  it("solves every real lesson, review, and practice target on its actual controls", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["math-log-scale-01"]);
    for (const lesson of lessons) {
      const s = lesson.spec as ModuleSpec;
      const targets: Values[] = [s.stage3Prediction.target, s.retentionHooks.reviewTarget!, ...s.practice!.items.map((item) => item.target)];
      for (const t of targets) {
        const solved = logRuler.solve(t, s);
        expect(logRuler.evaluate(solved, t, s.stage3Prediction.tolerance, s).correct).toBe(true);
        for (const c of logRuler.predictionControls(s, t)) {
          const value = solved[c.variableName]!;
          expect(value).toBeGreaterThanOrEqual(c.min);
          expect(value).toBeLessThanOrEqual(c.max);
          expect((value - c.min) / c.step).toBeCloseTo(Math.round((value - c.min) / c.step));
        }
      }
      for (const item of s.practice!.items) {
        const initial = logRuler.initialValues(s, 3, item.target);
        const solution = logRuler.solve(item.target, s);
        for (const key of item.presetControls ?? []) initial[key] = solution[key]!;
        for (const key of item.presetControls ?? []) expect(initial[key]).toBe(item.target[key]!);
        if (item.fade === "assisted") {
          expect(logRuler.predictionControls(s, item.target).some((c) => !(item.presetControls ?? []).includes(c.variableName))).toBe(true);
        }
      }
      for (const picked of [2.5, 2 + 400 / 900]) {
        const verdict = logRuler.evaluate({ marker_log: picked }, s.stage3Prediction.target, s.stage3Prediction.tolerance, s);
        expect(s.stage3Prediction.adaptiveFeedback.byKind?.[verdict.kind!]).toBeDefined();
      }
    }
  });

  it("keeps anchoring silent, preserves a before ghost at reduced motion, and reserves fixed rail space", () => {
    const silent = render({ stage: 1 });
    expect(silent).toContain("gb-anchoring");
    expect(silent).not.toContain("<text");
    expect(silent).toContain('data-log-ruler="before"');
    expect(silent).toContain('opacity="0.3"');
    expect(render({ stage: 1, anchorT: 0.1 })).not.toBe(silent);
    const boxes = [1, 2, 3, 4].map((stage) => render({ stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)?.[1]);
    expect(new Set(boxes).size).toBe(1);
    expect(render({ stage: 2, values: { ruler_warp_factor: 0 } })).not.toBe(render({ stage: 2, values: { ruler_warp_factor: 1 } }));
  });

  it("hides the marker value and answer segments until commitment, then draws the diagnostic gap", () => {
    const waiting = render();
    expect(waiting).toContain('data-log-ruler="marker"');
    expect(waiting).toContain(">?</text>");
    expect(waiting).not.toContain("≈316");
    expect(waiting).not.toContain('data-log-ruler="segments"');
    expect(waiting).not.toContain('data-log-ruler="gap"');
    const revealed = render({ verdict: logRuler.evaluate({ marker_log: 2.5 }, target, 0.01, spec) });
    expect(revealed).toContain('data-log-ruler="segments"');
    expect(revealed).toContain('data-log-ruler="gap"');
    expect(revealed).toContain("≈316.23");
    expect(revealed).toContain("Δ +0.2");
    expect(revealed).toContain('stroke-dasharray="6 4"');
    expect(revealed).toContain("gb-march");
    expect(render({ verdict: { correct: true, delta: 0 } })).not.toContain('data-log-ruler="gap"');
  });

  it("places the review midpoint at 100 and maps formula terms to their own colored lengths", () => {
    const reviewBoard = render({ target: review, values: logRuler.solve(review), verdict: { correct: true, delta: 0 } });
    expect(reviewBoard).toContain("≈100");
    expect(reviewBoard).toContain(spec.retentionHooks.spacedReviewPrompt);
    const formal = render({ stage: 4, values: logRuler.solve(target) });
    for (const [symbol, color] of [["log₁₀(10)", "blue"], ["log₁₀(50)", "amber"], ["log₁₀(500) = 2.699", "emerald"]]) {
      expect(formal).toMatch(new RegExp(`fill="var\\(--color-band-${color}\\)"[^>]*>${symbol!.replace(/[()]/g, "\\$&")}</text>`));
    }
    expect(formal).not.toContain('data-log-ruler="gap"');
  });

  it("fades guidance, waits for the warp before placement, and preserves assisted presets", () => {
    const item = spec.practice!.items[1]!;
    const controls = logRuler.predictionControls(spec, item.target);
    const moving = render({ target: spec.practice!.items[0]!.target, guide: 0.7 });
    expect(moving).toContain('data-log-ruler="marker"');
    expect(moving).not.toContain("<text");
    expect(render({ target: spec.practice!.items[0]!.target, guide: 1 })).toContain("≈10");
    expect(render({ target: item.target, values: { ruler_warp_factor: 0, marker_log: 0 }, input: { controls, onChange() {} } })).toContain('data-locked="true"');
    const unwarpedMiss = render({ target: item.target, values: { ruler_warp_factor: 0, marker_log: 0 }, verdict: { correct: false, delta: -1.301 } });
    expect(unwarpedMiss).toContain('data-log-ruler="warp-gap"');
    expect(unwarpedMiss).toContain("Δw +1");
    expect(unwarpedMiss).toContain('stroke-dasharray="6 4"');
    const assisted = render({ target: item.target, values: { ruler_warp_factor: 1, marker_log: 0 }, input: { controls, locked: ["ruler_warp_factor"], onChange() {} } });
    expect(assisted).toContain('cursor:ew-resize');
    expect(assisted).not.toContain('data-locked="true"');
  });

  it("moves the marker by keyboard and direct handle, respecting locks and the warp prerequisite", () => {
    const calls: [string, number][] = [];
    const props: BoardProps = {
      spec, stage: 3, target, values: { ruler_warp_factor: 1, marker_log: 2.5 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: logRuler.predictionControls(spec, target), onChange: (name, value) => calls.push([name, value]) },
    };
    const view = mount(createElement(logRuler.Board, props));
    try {
      fireEvent.keyDown(view.getByRole("slider"), { key: "ArrowRight" });
      expect(calls).toEqual([["marker_log", 2.501]]);
      calls.length = 0;
      const svg = view.container.querySelector("svg")!;
      const handle = view.container.querySelector(".gb-handle")!;
      Object.defineProperty(svg, "getScreenCTM", { value: () => null });
      Object.defineProperty(handle, "setPointerCapture", { value() {} });
      fireEvent.pointerDown(handle, { clientX: 28 + 304 * 2 / 3, clientY: 180, pointerId: 1 });
      expect(calls).toEqual([["marker_log", 2]]);
      calls.length = 0;
      view.rerender(createElement(logRuler.Board, { ...props, input: { ...props.input!, locked: ["marker_log"] } }));
      fireEvent.keyDown(view.getByRole("slider"), { key: "ArrowRight" });
      expect(calls).toEqual([]);
      expect(view.container.querySelector(".gb-handle")).toBeNull();
      view.rerender(createElement(logRuler.Board, { ...props, target: spec.practice!.items[2]!.target, values: { ruler_warp_factor: 0, marker_log: 0 } }));
      fireEvent.keyDown(view.getByRole("slider"), { key: "ArrowRight" });
      expect(calls).toEqual([]);
    } finally { view.unmount(); }
  });
});
