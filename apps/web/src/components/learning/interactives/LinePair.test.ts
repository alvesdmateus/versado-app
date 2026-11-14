import { describe, expect, it } from "bun:test";
import type { ModuleSpec } from "@versado/core";
import { crossings, diagnose, ENDLESS, linePair } from "./LinePair";

const spec = {
  stage2Exploration: {
    prompt: "",
    controls: [
      { controlType: "slider", variableName: "m2", label: "Steepness", min: -3, max: 3, step: 1, initial: 1, colorToken: "amber", visualSignaling: "" },
      { controlType: "drag_handle", variableName: "b2", label: "Start height", min: -2, max: 6, step: 1, initial: 4, colorToken: "rose", visualSignaling: "" },
    ],
    fixed: { m: 2, b: 1 },
    spatialContiguityRules: [],
  },
} as unknown as ModuleSpec;

const parallel = { m: 2, b: 1, m2: 2, b2: 4 };
const same = { m: -1, b: 2, m2: -1, b2: 2 };
const tilted = { m: 2, b: 1, m2: 1, b2: 4 };

describe("linePair", () => {
  it("counts 0, 1 or endless crossings", () => {
    expect(crossings(2, 1, 2, 4)).toBe(0);
    expect(crossings(2, 1, 1, 4)).toBe(1);
    expect(crossings(-1, 2, -1, 2)).toBe(ENDLESS);
  });

  it("solves the lesson and review targets", () => {
    expect(linePair.solve(parallel)).toEqual({ count: 0 });
    expect(linePair.solve(same)).toEqual({ count: ENDLESS });
  });

  it("offers three labelled choices with nothing picked at the gate", () => {
    const [c] = linePair.predictionControls(spec, parallel);
    expect(c!.choices).toEqual([0, 1, ENDLESS]);
    expect(c!.choiceLabels?.[ENDLESS]).toBe("lesson.choice.endless");
    expect(linePair.initialValues(spec, 3, parallel)).toEqual({});
  });

  it("names every wrong pick against what is true", () => {
    expect(diagnose(1, 0)).toBe("alwaysOne");
    expect(diagnose(ENDLESS, 0)).toBe("endless");
    expect(diagnose(0, ENDLESS)).toBe("sameLine");
    expect(diagnose(1, ENDLESS)).toBe("sameLine");
    expect(diagnose(0, 1)).toBe("crosses");
    expect(diagnose(ENDLESS, 1)).toBe("crosses");
    expect(diagnose(1, 1)).toBeUndefined();
  });

  it("evaluates a committed count", () => {
    expect(linePair.evaluate({ count: 0 }, parallel, 0)).toEqual({ correct: true, delta: 0 });
    expect(linePair.evaluate({ count: 1 }, parallel, 0)).toEqual({ correct: false, delta: 1, kind: "alwaysOne" });
    expect(linePair.evaluate({ count: 1 }, same, 0)).toEqual({ correct: false, delta: -1, kind: "sameLine" });
    expect(linePair.evaluate({ count: 1 }, tilted, 0)).toEqual({ correct: true, delta: 0 });
  });

  it("starts exploration from the spec's controls", () => {
    expect(linePair.initialValues(spec, 2, parallel)).toEqual({ m2: 1, b2: 4 });
  });
});
