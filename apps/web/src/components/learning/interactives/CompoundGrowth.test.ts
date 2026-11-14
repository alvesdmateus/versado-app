import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render as mount } from "@testing-library/react";
import type { ModuleSpec } from "@versado/core";
import type { LearningModuleInput } from "@versado/validation";
import { compoundCase, compoundGrowth, compoundHeight } from "./CompoundGrowth";
import type { BoardProps, ControlDef, Values } from "./types";

// Load the actual authored targets without pulling API content into the web tsconfig's rootDir.
const contentPath = "../../../../../api/src/content/growth";
const { growthModules } = await import(contentPath) as { growthModules: LearningModuleInput[] };
const lesson = growthModules.find((module) => module.id === "math-compound-growth-01")!;
const spec = lesson.spec as ModuleSpec;
const target = spec.stage3Prediction.target;
const review = spec.retentionHooks.reviewTarget!;
const render = (overrides: Partial<BoardProps> = {}) => renderToStaticMarkup(createElement(compoundGrowth.Board, {
  spec, stage: 3, target, values: { height_y: 1 }, verdict: null, anchorT: 1, changed: null, ...overrides,
}));

describe("compoundGrowth", () => {
  it("compounds each gain on the existing stack at the fixed nominal rate", () => {
    expect(compoundHeight(1)).toBeCloseTo(2, 12);
    expect(compoundHeight(2)).toBeCloseTo(2.25, 12);
    expect(compoundHeight(10)).toBeCloseTo(2.5937424601, 10);
    expect(compoundHeight(1000)).toBeCloseTo(2.7169239322, 10);
    expect(compoundHeight(1_000_000)).toBeCloseTo(2.7182804693, 10);
    expect(compoundHeight(1_000_000, 2)).toBeCloseTo(5.4365609386, 10);
    expect(compoundHeight(10, 2, 0)).toBe(2);
    expect(compoundHeight(4, 1, 0.5)).toBeCloseTo(1.5625, 12);
    let previous = 0;
    for (const n of [1, 2, 4, 10, 100, 1000, 1_000_000]) {
      const height = compoundHeight(n);
      expect(height).toBeGreaterThan(previous);
      expect(height).toBeLessThan(Math.E);
      previous = height;
    }
  });

  it("distinguishes lesson, review and explicit practice counts", () => {
    expect(compoundCase(target, spec)).toEqual({ practice: false, n: 1_000_000, start: 1 });
    expect(compoundCase(review, spec)).toEqual({ practice: false, n: 1_000_000, start: 2 });
    expect(compoundCase({ split_count_n: 10, height_y: 2.594 }, spec)).toEqual({ practice: true, n: 10, start: 1 });
    expect(compoundGrowth.solve(target, spec)).toEqual({ height_y: 2.718 });
    // Calculate the answer from the setup, rather than parroting a target's answer field.
    expect(compoundGrowth.solve({ split_count_n: 10, height_y: 6 }, spec)).toEqual({ split_count_n: 10, height_y: 2.594 });
    expect(compoundGrowth.solve(review)).toEqual({ height_y: 5.437 });
  });

  it("keeps exploration defaults and starts predictions from the starting bar", () => {
    expect(compoundGrowth.initialValues(spec, 1, target)).toEqual({ split_count_n: 1 });
    expect(compoundGrowth.initialValues(spec, 2, target)).toEqual({ split_count_n: 1 });
    expect(compoundGrowth.initialValues(spec, 3, target)).toEqual({ height_y: 1 });
    expect(compoundGrowth.initialValues(spec, 3, review)).toEqual({ height_y: 2 });
    expect(compoundGrowth.initialValues(spec, 3, { split_count_n: 1000, height_y: 2.717 })).toEqual({ split_count_n: 1, height_y: 1 });
    expect(compoundGrowth.initialValues(spec, 4, target)).toEqual(compoundGrowth.solve(target, spec));
  });

  it("uses a three-decimal vertical marker and adds the count slider only in practice", () => {
    expect(compoundGrowth.axes).toEqual({ height_y: "y" });
    const marker: ControlDef = { variableName: "height_y", label: "y", min: 1, max: 6, step: 0.001, colorToken: "amber" };
    expect(compoundGrowth.predictionControls(spec, target)).toEqual([marker]);
    expect(compoundGrowth.predictionControls(spec, review)).toEqual([marker]);
    expect(compoundGrowth.predictionControls(spec, { split_count_n: 10 })).toEqual([
      { variableName: "split_count_n", label: "Growth splits", min: 1, max: 1000, step: 1, colorToken: "blue" }, marker,
    ]);
  });

  it("accepts rounded targets with absolute .005 tolerance in every numeric mode", () => {
    for (const task of [target, review, ...spec.practice!.items.map((item) => item.target)]) {
      const solved = compoundGrowth.solve(task, spec);
      expect(compoundGrowth.evaluate(solved, task, 0.005, spec).correct).toBe(true);
      for (const direction of [-1, 1]) {
        expect(compoundGrowth.evaluate({ ...solved, height_y: solved.height_y! + direction * 0.005 }, task, 0.005, spec).correct).toBe(true);
        expect(compoundGrowth.evaluate({ ...solved, height_y: solved.height_y! + direction * 0.006 }, task, 0.005, spec).correct).toBe(false);
      }
      expect(compoundGrowth.evaluate({ ...solved, height_y: task.height_y! }, task, 0.005, spec).correct).toBe(true);
    }
    expect(compoundGrowth.evaluate({ height_y: 2.73 }, target, 0.005, spec).delta).toBeCloseTo(0.012, 12);
  });

  it("requires the requested practice count, but ignores exploration leftovers in the million-step prediction", () => {
    const task = { split_count_n: 1000, height_y: 2.717 };
    const solved = compoundGrowth.solve(task, spec);
    expect(compoundGrowth.evaluate({ ...solved, split_count_n: 999 }, task, 0.005, spec).correct).toBe(false);
    expect(compoundGrowth.evaluate({ height_y: 2.717 }, task, 0.005, spec).correct).toBe(false);
    expect(compoundGrowth.evaluate({ split_count_n: 1, height_y: 2.718 }, target, 0.005, spec).correct).toBe(true);
  });

  it("names both content misconceptions relative to the starting height", () => {
    for (const [task, start] of [[target, 1], [review, 2]] as const) {
      expect(compoundGrowth.evaluate({ height_y: 3 * start }, task, 0.005, spec).kind).toBe("unbounded");
      expect(compoundGrowth.evaluate({ height_y: 2 * start }, task, 0.005, spec).kind).toBe("singleJump");
      expect(compoundGrowth.evaluate({ height_y: 2.03 * start }, task, 0.005, spec).kind).toBe("singleJump");
      expect(compoundGrowth.evaluate({ height_y: 2.5 * start }, task, 0.005, spec).kind).toBeUndefined();
    }
    const single = { split_count_n: 1, height_y: 2 };
    expect(compoundGrowth.evaluate(compoundGrowth.solve(single, spec), single, 0.005, spec)).toEqual({ correct: true, delta: 0 });
    for (const height_y of [undefined, NaN, Infinity, -Infinity]) {
      const values: Values = height_y === undefined ? {} : { height_y };
      expect(compoundGrowth.evaluate(values, target, 0.005, spec).correct).toBe(false);
    }
    expect(compoundGrowth.formatDelta({ correct: false, delta: 0.006 })).toBe("+0.006");
    expect(compoundGrowth.formatDelta({ correct: false, delta: -0.006 })).toBe("−0.006");
  });

  it("has silent anchoring and an informative static final frame on the same board scale", () => {
    const anchor = render({ stage: 1, anchorT: 1 });
    expect(anchor).not.toContain("<text");
    expect(anchor).toContain("gb-anchoring");
    expect(anchor).toContain("data-compound-ghost");
    expect(anchor).not.toContain("data-compound-shelf");
    for (const stage of [2, 3, 4] as const) {
      expect(anchor.match(/viewBox="[^"]+"/)?.[0]).toBe(render({ stage }).match(/viewBox="[^"]+"/)?.[0]);
    }
    for (const anchorT of [-1, 0, 0.5, 1, 2]) {
      expect(render({ stage: 1, anchorT })).not.toContain("NaN");
    }
  });

  it("explores one thousand splits at bounded rendering cost without exposing the shelf", () => {
    const shown = render({ stage: 2, values: { split_count_n: 1000 } });
    expect(shown).toContain("2.717");
    expect(shown).toContain(">1000</text>");
    expect(shown).not.toContain("data-compound-shelf");
    expect((shown.match(/data-compound-slice=/g) ?? []).length).toBe(64);
  });

  it("hides gain geometry, result, shelf and local zoom until a verdict in lesson, review and practice", () => {
    for (const task of [target, review, spec.practice!.items[1]!.target]) {
      const hidden = render({ target: task, values: { split_count_n: 10, height_y: 3 } });
      expect(hidden).toContain("data-compound-start");
      expect(hidden).toContain("data-compound-marker");
      for (const part of ["gains", "shelf", "miss", "zoom"]) expect(hidden).not.toContain(`data-compound-${part}`);
      expect(hidden).not.toContain(decimalSolution(task));
    }
  });

  it("reveals the gain stack and a red marching gap with a precise delta on a miss", () => {
    const values = { height_y: 3.2 };
    const verdict = compoundGrowth.evaluate(values, target, 0.005, spec);
    const shown = render({ values, verdict });
    expect(shown).toContain("data-compound-gains");
    expect(shown).toContain("data-compound-shelf");
    expect(shown).toContain("data-compound-miss");
    expect(shown).toContain('stroke-dasharray="6 4"');
    expect(shown).toContain("gb-march");
    expect(shown).toContain("Δ +0.482");
    expect((shown.match(/data-compound-slice=/g) ?? []).length).toBe(64);
    const close = { height_y: 2.724 };
    expect(render({ values: close, verdict: compoundGrowth.evaluate(close, target, 0.005, spec) })).toContain("data-compound-zoom");
    expect(render({ verdict: { correct: true, delta: 0 } })).not.toContain("data-compound-miss");
  });

  it("shows the doubled review bar and its own ceiling only after commitment", () => {
    const values = { height_y: 6 };
    const verdict = compoundGrowth.evaluate(values, review, 0.005, spec);
    const shown = render({ target: review, values, verdict });
    expect(shown).toContain("5.437");
    expect(shown).toContain("Δ +0.563");
    expect(shown).toContain(">2</text>");
  });

  it("guides the single jump from the start to the solved height, delaying tags and shelf", () => {
    const task = spec.practice!.items[0]!.target;
    const values = compoundGrowth.solve(task, spec);
    const beginning = render({ target: task, values, guide: 0 });
    const middle = render({ target: task, values, guide: 0.5 });
    const end = render({ target: task, values, guide: 1 });
    expect(beginning).not.toContain("<text");
    expect(middle).not.toContain("<text");
    expect(middle).not.toContain("data-compound-shelf");
    expect(end).toContain("2.000");
    expect(end).toContain("data-compound-shelf");
    expect(beginning).not.toBe(middle);
    expect(middle).not.toBe(end);
    expect(middle).not.toContain("data-compound-marker");
  });

  it("keeps assisted count solved and locked while the height rail and handle remain live", () => {
    const item = spec.practice!.items[1]!;
    const solved = compoundGrowth.solve(item.target, spec);
    expect(item.presetControls).toEqual(["split_count_n"]);
    const controls = compoundGrowth.predictionControls(spec, item.target);
    const shown = render({ target: item.target, values: { split_count_n: solved.split_count_n!, height_y: 1 }, input: {
      controls, locked: item.presetControls, onChange() {},
    } });
    expect(shown).toContain('role="slider"');
    expect(shown).toContain('aria-valuenow="1"');
    expect(shown).not.toContain('aria-disabled="true"');
    expect(shown).toContain("gb-handle-grip");
    const countMiss = { split_count_n: 20, height_y: 2.594 };
    const missed = render({ target: item.target, values: countMiss, verdict: compoundGrowth.evaluate(countMiss, item.target, 0.005, spec) });
    expect(missed).toContain("Δn = +10");
    expect(missed).toContain("Δ −0.059");
  });

  it("matches the formal symbols to the gain slices and shelf band colors", () => {
    const shown = render({ stage: 4, values: compoundGrowth.solve(target, spec) });
    expect(shown).toContain("n = 1000000");
    expect(shown).toContain("e ≈ 2.718");
    expect(shown).toContain("var(--color-band-blue)");
    expect(shown).toContain("var(--color-band-amber)");
  });

  it("moves the marker by exact thousandths from the keyboard and respects marker locks", () => {
    const calls: [string, number][] = [];
    const props: BoardProps = {
      spec, stage: 3, target, values: { height_y: 2.718 }, verdict: null, anchorT: 1, changed: null,
      input: { controls: compoundGrowth.predictionControls(spec, target), onChange: (name, value) => calls.push([name, value]) },
    };
    const view = mount(createElement(compoundGrowth.Board, props));
    try {
      fireEvent.keyDown(view.getByRole("slider", { name: "y" }), { key: "ArrowUp" });
      fireEvent.keyDown(view.getByRole("slider", { name: "y" }), { key: "ArrowDown" });
      expect(calls).toEqual([["height_y", 2.719], ["height_y", 2.717]]);
      calls.length = 0;
      view.rerender(createElement(compoundGrowth.Board, { ...props, input: { ...props.input!, locked: ["height_y"] } }));
      fireEvent.keyDown(view.getByRole("slider", { name: "y" }), { key: "ArrowUp" });
      expect(calls).toEqual([]);
      expect(view.container.querySelector(".gb-handle-grip")).toBeNull();
    } finally {
      view.unmount();
    }
  });

  it("solves every real lesson, review and practice target within every control's bounds and step", () => {
    const lessons = growthModules.filter((module) => module.interactive === "compound-growth");
    expect(lessons.map((module) => module.id)).toContain("math-compound-growth-01");
    for (const module of lessons) {
      const realSpec = module.spec as ModuleSpec;
      const targets: Values[] = [realSpec.stage3Prediction.target, realSpec.retentionHooks.reviewTarget!, ...realSpec.practice!.items.map((item) => item.target)];
      for (const task of targets) {
        const solved = compoundGrowth.solve(task, realSpec);
        expect(Math.abs(solved.height_y! - task.height_y!)).toBeLessThanOrEqual(0.005);
        expect(compoundGrowth.evaluate(solved, task, realSpec.stage3Prediction.tolerance, realSpec)).toEqual({ correct: true, delta: 0 });
        for (const control of compoundGrowth.predictionControls(realSpec, task)) {
          const answer = solved[control.variableName]!;
          expect(answer).toBeGreaterThanOrEqual(control.min);
          expect(answer).toBeLessThanOrEqual(control.max);
          const ticks = (answer - control.min) / control.step;
          expect(ticks).toBeCloseTo(Math.round(ticks), 8);
        }
        for (const key of Object.keys(realSpec.stage3Prediction.adaptiveFeedback.byKind!)) {
          expect(["unbounded", "singleJump"]).toContain(key);
        }
      }
    }
  });
});

function decimalSolution(task: Values) {
  return compoundGrowth.solve(task, spec).height_y!.toFixed(3);
}
