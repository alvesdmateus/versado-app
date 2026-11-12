import { describe, expect, test } from "bun:test";
import { railKey, railValue, snapTo } from "./rail";
import { INTERACTIVES } from "./index";
import { binomialSquare, choicesFor } from "./BinomialSquare";

describe("snapTo (in-plane handles)", () => {
  const k = { variableName: "k", label: "k", min: -4, max: 3, step: 0.25, colorToken: "violet" as const };
  test("snaps a dragged plane value to the control's grid and range", () => {
    expect(snapTo(k, -2.2)).toBe(-2.25);
    expect(snapTo(k, 9)).toBe(3);
    expect(snapTo(k, -7)).toBe(-4);
  });
});

describe("square of a sum: multiple choice", () => {
  test("lesson target offers the truth and three named misconceptions", () => {
    // a = 3, b = 2: (a+b)² = 25, a²+b² = 13, a²+ab+b² = 19, 2(a+b) = 10
    expect(choicesFor(3, 2)).toEqual([10, 13, 19, 25]);
  });

  test("always four distinct options including the truth", () => {
    for (const [a, b] of [[1, 1], [5, 1], [2, 2], [8, 5]] as const) {
      const c = choicesFor(a, b);
      expect(c).toHaveLength(4);
      expect(new Set(c).size).toBe(4);
      expect(c).toContain((a + b) ** 2);
    }
  });

  test("doubling instead of squaring is diagnosed by name", () => {
    expect(binomialSquare.evaluate({ total: 10 }, { a: 3, b: 2 }, 0).kind).toBe("doubled");
    expect(binomialSquare.evaluate({ total: 25 }, { a: 3, b: 2 }, 0).correct).toBe(true);
  });
});

describe("railValue", () => {
  // A vertical rail: value 1 sits low on screen (y = 200), value 8 high (y = 4), as on a board.
  const p0 = 200;
  const p1 = 4;

  test("maps the ends of the track to min and max", () => {
    expect(railValue(200, p0, p1, 1, 8, 1)).toBe(1);
    expect(railValue(4, p0, p1, 1, 8, 1)).toBe(8);
  });

  test("snaps to the step between the ends", () => {
    const at4 = p0 + ((4 - 1) / 7) * (p1 - p0);
    expect(railValue(at4 + 3, p0, p1, 1, 8, 1)).toBe(4);
    expect(railValue(at4 - 3, p0, p1, 1, 8, 1)).toBe(4);
  });

  test("clamps a drag past either end", () => {
    expect(railValue(260, p0, p1, 1, 8, 1)).toBe(1);
    expect(railValue(-40, p0, p1, 1, 8, 1)).toBe(8);
  });

  test("keeps fractional steps exact", () => {
    // k from −4 to 3 in quarters along a horizontal-style track.
    const v = railValue(0.3 * 100, 0, 100, -4, 3, 0.25);
    expect(v).toBe(-2);
    expect(Number.isInteger(v * 4)).toBe(true);
  });
});

describe("railKey", () => {
  test("arrows step by one step in either orientation", () => {
    expect(railKey("ArrowUp", 2, 1, 8, 1)).toBe(3);
    expect(railKey("ArrowRight", 2, 1, 8, 1)).toBe(3);
    expect(railKey("ArrowDown", 2, 1, 8, 1)).toBe(1);
    expect(railKey("ArrowLeft", 2, 1, 8, 1)).toBe(1);
  });

  test("home/end jump to the ends and steps never leave the range", () => {
    expect(railKey("Home", 5, -2, 5, 0.5)).toBe(-2);
    expect(railKey("End", 0, -2, 5, 0.5)).toBe(5);
    expect(railKey("ArrowUp", 5, -2, 5, 0.5)).toBe(5);
  });

  test("ignores keys it does not own", () => {
    expect(railKey("Tab", 2, 1, 8, 1)).toBeNull();
  });
});

describe("axis bindings", () => {
  test("every bound variable names a real axis", () => {
    for (const def of Object.values(INTERACTIVES)) {
      for (const axis of Object.values(def.axes ?? {})) expect(["x", "y"]).toContain(axis);
    }
  });
});
