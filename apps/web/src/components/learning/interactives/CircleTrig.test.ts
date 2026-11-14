import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModuleSpec } from "@versado/core";
import { angleDelta, circleTrig, modeOf, wallStrike } from "./CircleTrig";
import type { BoardProps, Values } from "./types";

// Runtime import keeps the API content outside the web TypeScript rootDir.
const contentPath = "../../../../../api/src/content/trigonometry";
const { trigModules } = await import(contentPath) as { trigModules: { id: string; interactive: string; spec: ModuleSpec }[] };
const lessons = trigModules.filter((lesson) => lesson.interactive === "circle-trig");
const specs = ["math-trig-radians-01", "math-trig-sincos-01", "math-trig-tangent-01", "math-trig-identity-01"]
  .map((id) => lessons.find((lesson) => lesson.id === id)!.spec);
const radians = specs[0]!;
const shadows = specs[1]!;
const tangent = specs[2]!;
const squares = specs[3]!;
const PI = Math.PI;

function render(spec: ModuleSpec, props: Partial<BoardProps> = {}) {
  return renderToStaticMarkup(createElement(circleTrig.Board, {
    spec, stage: 3, target: spec.stage3Prediction.target,
    values: circleTrig.initialValues(spec, 3, spec.stage3Prediction.target),
    anchorT: 1, changed: null, verdict: null, ...props,
  }));
}

describe("circleTrig controls and state", () => {
  it("uses each fixed mode, exploration values, and formal solution", () => {
    for (const [mode, spec] of specs.entries()) {
      expect(modeOf(spec)).toBe(mode);
      expect(circleTrig.initialValues(spec, 2, {})).toEqual({ theta: spec.stage2Exploration.controls[0]!.initial });
      const target = spec.stage3Prediction.target;
      expect(circleTrig.initialValues(spec, 4, target)).toEqual(circleTrig.solve(target, spec));
    }
    expect(circleTrig.axes?.theta).toBeUndefined();
  });

  it("keeps radians on an angular control, accepts between-tick targets within tolerance", () => {
    for (const spec of [radians, shadows, tangent]) {
      expect(circleTrig.predictionControls(spec, { theta: 3 })).toHaveLength(1);
      expect(circleTrig.predictionControls(spec, { theta: 3 })[0]).toMatchObject({ variableName: "theta", step: PI / 180, colorToken: "amber" });
    }
    const snapped = Math.round(3 / (PI / 180)) * PI / 180;
    expect(circleTrig.evaluate({ theta: snapped }, { theta: 3 }, 0.02, radians).correct).toBe(true);
    expect(circleTrig.evaluate({ theta: PI + 0.021 }, { theta: PI }, 0.02, radians).correct).toBe(false);
  });

  it("leaves result choices unanswered and includes theta for assisted presets", () => {
    const expected = [[PI / 2, PI, 2 * PI, 90], [0, 1, -1], [1, Math.SQRT1_2, -1], [0.25, 0.5, 0.75, 1]];
    for (const [mode, spec] of specs.entries()) {
      const item = spec.practice!.items.find((item) => item.fade === "assisted")!;
      const controls = circleTrig.predictionControls(spec, item.target);
      expect(controls.map((control) => control.variableName)).toEqual(["theta", "answer"]);
      expect(controls[1]!.choices).toEqual(expected[mode]);
      const values = circleTrig.initialValues(spec, 3, item.target);
      const solved = circleTrig.solve(item.target, spec);
      for (const name of item.presetControls ?? []) values[name] = solved[name]!;
      expect(values.answer).toBeUndefined();
      expect(circleTrig.evaluate(values, item.target, 0.02, spec).correct).toBe(false);
      expect(circleTrig.evaluate({ ...solved, theta: 0 }, item.target, 0.02, spec).correct).toBe(false);
    }
    expect(circleTrig.predictionControls(squares, { answer: 0.8 })[0]!.choices).toEqual([0.8, -0.8, 0.64, 0.4]);
    expect(circleTrig.initialValues(squares, 3, { answer: 0.8 })).toEqual({});
  });
});

describe("circleTrig evaluation and diagnostic kinds", () => {
  it("diagnoses arc length, degree, diameter and full-turn mistakes", () => {
    for (const [theta, kind] of [[3, "shortArc"], [90, "degrees"], [2, "diameter"], [2 * PI, "fullTurn"]] as const) {
      expect(circleTrig.evaluate({ theta }, { theta: PI }, 0.02, radians).kind).toBe(kind);
    }
    expect(circleTrig.evaluate({ theta: 4 }, { theta: PI }, 0.02, radians).kind).toBeUndefined();
    const target = { theta: PI / 2, answer: PI / 2 };
    expect(circleTrig.evaluate({ theta: PI / 2, answer: 90 }, target, 0.02, radians).kind).toBe("degrees");
    expect(circleTrig.evaluate({ theta: PI / 2, answer: 2 * PI }, target, 0.02, radians).kind).toBe("fullTurn");
    expect(circleTrig.evaluate({ theta: PI / 2, answer: 2 }, target, 0.02, radians).kind).toBe("diameter");
  });

  it("compares signed shadows and names exchanged axes", () => {
    expect(circleTrig.evaluate({ theta: PI / 6 }, { theta: PI / 4 }, 0.02, shadows).kind).toBe("unequal");
    expect(circleTrig.evaluate({ theta: 5 * PI / 4 }, { theta: PI / 4 }, 0.02, shadows).kind).toBe("sign");
    expect(circleTrig.evaluate({ theta: 0 }, { theta: PI / 2 }, 0.02, shadows).kind).toBe("swapped");
    expect(circleTrig.evaluate({ theta: PI / 4 + 2 * PI }, { theta: PI / 4 }, 0.02, shadows).correct).toBe(true);
    expect(circleTrig.evaluate({ theta: PI / 2, answer: -1 }, { theta: PI / 2, answer: 0 }, 0, shadows).kind).toBe("sign");
    expect(circleTrig.evaluate({ theta: PI / 2, answer: 1 }, { theta: PI / 2, answer: 0 }, 0, shadows).kind).toBe("swapped");
  });

  it("compares tangent modulo pi, diagnoses sine-only heights, and handles upright lines", () => {
    expect(angleDelta(-3 * PI / 4, PI / 4, PI)).toBeCloseTo(0);
    for (const theta of [PI / 4, -3 * PI / 4, 5 * PI / 4]) {
      expect(circleTrig.evaluate({ theta }, { theta: PI / 4 }, 0.02, tangent)).toEqual({ correct: true, delta: 0 });
    }
    expect(circleTrig.evaluate({ theta: PI / 6 }, { theta: PI / 4 }, 0.02, tangent).kind).toBe("height");
    expect(circleTrig.evaluate({ theta: Math.atan(Math.SQRT1_2) }, { theta: PI / 4 }, 0.02, tangent).kind).toBe("sineOnly");
    expect(circleTrig.evaluate({ theta: -PI / 4 }, { theta: PI / 4 }, 0.02, tangent).kind).toBe("sign");
    expect(circleTrig.evaluate({ theta: PI / 4, answer: Math.SQRT1_2 }, { theta: PI / 4, answer: 1 }, 0, tangent).kind).toBe("sineOnly");
    expect(wallStrike(PI / 2)).toBeNull();
    expect(wallStrike(-PI / 2)).toBeNull();
    expect(wallStrike(PI / 2 + 0.001)!).toBeLessThan(-4);
    expect(circleTrig.evaluate({ theta: PI / 2 }, { theta: PI / 4 }, 0.02, tangent).correct).toBe(false);
  });

  it("distinguishes a squared area from a signed side, without constraining guesses", () => {
    expect(circleTrig.evaluate({ answer: 0.64 }, { answer: 0.8 }, 0, squares).kind).toBe("areaAsLength");
    expect(circleTrig.evaluate({ answer: 0.4 }, { answer: 0.8 }, 0, squares).kind).toBe("linearRemainder");
    expect(circleTrig.evaluate({ answer: -0.8 }, { answer: 0.8 }, 0, squares).kind).toBe("sign");
    expect(circleTrig.evaluate({ answer: 0.8 }, { answer: -0.8 }, 0, squares).kind).toBe("sign");
    expect(circleTrig.evaluate({ theta: PI / 6, answer: 0.5 }, { theta: PI / 6, answer: 0.25 }, 0, squares).kind).toBe("areaAsLength");
    expect(circleTrig.evaluate({ theta: PI / 6, answer: 0.75 }, { theta: PI / 6, answer: 0.25 }, 0, squares).kind).toBe("linearRemainder");
    for (const spec of specs) {
      for (const invalid of [{}, { theta: NaN, answer: NaN }, { theta: Infinity, answer: Infinity }] as Values[]) {
        expect(circleTrig.evaluate(invalid, spec.stage3Prediction.target, 0.02, spec).correct).toBe(false);
      }
    }
    expect(circleTrig.formatDelta({ correct: false, delta: -0.4 })).toBe("−0.4");
  });
});

describe("circleTrig stage and reveal rendering", () => {
  it("keeps anchoring silent, informative with reduced motion, and the viewport fixed", () => {
    for (const spec of specs) {
      const anchor = render(spec, { stage: 1, values: { theta: 0.3 } });
      expect(anchor).toContain("gb-anchoring");
      expect(anchor).not.toContain("<text");
      expect(anchor).not.toContain('class="gb-handle"');
      if (modeOf(spec) !== 0) expect(anchor).toContain('stroke-dasharray="3 3"');
      const viewBoxes = [1, 2, 3, 4].map((stage) => render(spec, { stage: stage as BoardProps["stage"] }).match(/viewBox="([^"]+)"/)![1]);
      expect(new Set(viewBoxes).size).toBe(1);
    }
  });

  it("hides all dependent geometry and readouts before commitment", () => {
    expect(render(radians)).not.toContain('data-circle="ribbon"');
    expect(render(radians)).not.toContain('data-circle="endpoint-ticks"');
    expect(render(shadows)).not.toContain('data-circle="shadows"');
    expect(render(shadows)).not.toContain('data-circle="projection-lengths"');
    expect(render(tangent)).not.toContain('data-circle="wall-strike"');
    expect(render(squares)).not.toContain('data-circle="vertical-square"');
    expect(render(squares)).not.toContain('data-circle="bead"');
    for (const spec of specs) {
      const assisted = spec.practice!.items[1]!.target;
      const before = render(spec, { target: assisted, values: { theta: assisted.theta! } });
      expect(before).not.toContain('data-circle="projection-lengths"');
      if (modeOf(spec) === 2) expect(before).not.toContain('data-circle="wall-goal"');
    }
  });

  it("draws marching diagnostic gaps after each miss and supports guided reveals", () => {
    for (const spec of specs) {
      const html = render(spec, { values: { theta: 0.2, answer: 0.4 }, verdict: { correct: false, delta: -0.4 } });
      expect(html).toContain('data-circle="discrepancy"');
      expect(html).toContain('stroke-dasharray="6 4"');
      expect(html).toContain("gb-march");
      const guided = render(spec, { guide: 0.6, target: spec.practice!.items[0]!.target });
      expect(guided).not.toContain('data-circle="projection-lengths"');
      if (modeOf(spec) === 0) expect(guided).toContain('data-circle="ribbon"');
      if (modeOf(spec) === 3) expect(guided).toContain('data-circle="vertical-square"');
    }
  });

  it("shows backward supporting lines, undefined parallel lines and off-screen arrows", () => {
    expect(render(tangent, { stage: 2, values: { theta: 3 * PI / 4 } })).toContain('data-circle="backward-extension"');
    const upright = render(tangent, { stage: 2, values: { theta: PI / 2 } });
    expect(upright).toContain('data-circle="parallel"');
    expect(upright).not.toContain('data-circle="forward-extension"');
    expect(upright).not.toContain("Infinity");
    expect(render(tangent, { stage: 2, values: { theta: PI / 2 - 0.01 } })).toContain('data-circle="offscreen"');
  });

  it("shows the radius/distance review and independent signed legs with area gaps", () => {
    const review = render(radians, { target: { theta: 3 }, values: { theta: 1 } });
    expect(review).toContain('data-circle="review-distance"');
    expect(review).toContain("s = 6");
    expect(review).toContain(">2</text>");
    const miss = render(squares, { values: { answer: 0.4 }, verdict: { correct: false, delta: -0.4 } });
    expect(miss).toContain('data-circle="independent-leg"');
    expect(miss).toContain("ΔA −0.48");
    const negative = render(squares, { target: { answer: -0.8 }, values: { answer: -0.8 }, verdict: { correct: true, delta: 0 } });
    expect(negative).toContain(">-0.8</text>");
    expect(negative).toContain(">0.64</text>");
  });

  it("offers rim handles only for movable angular controls and labels formal quantities", () => {
    const controls = circleTrig.predictionControls(shadows, { theta: PI / 4 });
    expect(render(shadows, { input: { controls, onChange() {} } })).toContain('data-circle="angular-input"');
    expect(render(shadows, { input: { controls, locked: ["theta"], onChange() {} } })).not.toContain('data-circle="angular-input"');
    for (const spec of specs) {
      const formal = render(spec, { stage: 4, values: circleTrig.solve(spec.stage3Prediction.target, spec) });
      expect(formal).not.toContain('data-circle="missing-leg"');
      if (modeOf(spec) === 3) {
        expect(formal).toContain("cos²θ");
        expect(formal).toContain("sin²θ");
      }
    }
  });
});

describe("circleTrig real lesson contract", () => {
  it("solves every lesson, review, and guided/assisted/autonomous practice target", () => {
    expect(lessons).toHaveLength(4);
    for (const lesson of lessons) {
      const spec = lesson.spec;
      const targets: Values[] = [spec.stage3Prediction.target, spec.retentionHooks.reviewTarget!, ...spec.practice!.items.map((item) => item.target)];
      for (const target of targets) {
        const solved = circleTrig.solve(target, spec);
        expect(circleTrig.evaluate(solved, target, spec.stage3Prediction.tolerance, spec)).toEqual({ correct: true, delta: 0 });
        for (const control of circleTrig.predictionControls(spec, target)) {
          const value = solved[control.variableName]!;
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(control.min);
          expect(value).toBeLessThanOrEqual(control.max);
          if (control.choices) expect(control.choices).toContain(value);
          else {
            const nearest = control.min + Math.round((value - control.min) / control.step) * control.step;
            expect(circleTrig.evaluate({ ...solved, [control.variableName]: nearest }, target, spec.stage3Prediction.tolerance, spec).correct).toBe(true);
          }
        }
      }
      const availableKinds = new Set(Object.keys(spec.stage3Prediction.adaptiveFeedback.byKind ?? {}));
      const samples: Values[] = modeOf(spec) === 0 ? [3, 90, 2, 2 * PI].map((theta) => ({ theta }))
        : modeOf(spec) === 1 ? [{ theta: PI / 6 }, { theta: 5 * PI / 4 }]
        : modeOf(spec) === 2 ? [{ theta: PI / 6 }, { theta: Math.atan(Math.SQRT1_2) }, { theta: -PI / 4 }]
        : [{ answer: 0.64 }, { answer: 0.4 }, { answer: -0.8 }];
      for (const values of samples) {
        const verdict = circleTrig.evaluate(values, spec.stage3Prediction.target, spec.stage3Prediction.tolerance, spec);
        expect(availableKinds.has(verdict.kind!)).toBe(true);
      }
    }
  });
});
