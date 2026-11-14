import { describe, expect, it } from "bun:test";
import { learningChapterSchema, learningModuleSchema, moduleSpecSchema, type ModuleSpecInput } from "./learning";

const base: ModuleSpecInput = {
  targetSkill: "A line is fixed by its climb and its start.",
  cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
  stage1Anchoring: {
    visualMetaphor: "A point walks right.",
    caption: "Same climb at every step.",
    durationSeconds: 8,
    pretrainingElements: [{ label: "Climb", colorToken: "amber" }],
  },
  stage2Exploration: {
    prompt: "Tilt the line.",
    controls: [
      { controlType: "slider", variableName: "m", label: "m", min: -3, max: 3, initial: 1, colorToken: "amber", visualSignaling: "pulse" },
      { controlType: "slider", variableName: "c", label: "c", min: -2, max: 5, initial: 0, colorToken: "violet", visualSignaling: "pulse" },
    ],
  },
  stage3Prediction: {
    icapTarget: "interactive",
    challengePrompt: "Set the line through both points.",
    userAction: "Adjust m and c",
    target: { x1: 0, y1: 1, x2: 2, y2: 5 },
    adaptiveFeedback: { onCommonMisconception: "See the gaps.", onSuccess: "Exactly." },
  },
  stage4Formalization: {
    formalExpression: "y = m·x + c",
    caption: "m tilts, c lifts.",
    colorMapping: [{ symbol: "m", matchesVisual: "Climb", colorToken: "amber" }],
  },
  retentionHooks: {
    interleavedVariation: "Falling line.",
    spacedReviewPrompt: "Set the line.",
    reviewOnSuccess: "Exactly.",
    reviewTarget: { x1: 0, y1: 4, x2: 2, y2: 0 },
  },
};

const item = (fade: "guided" | "assisted" | "autonomous", presetControls: string[] = []) => ({
  prompt: "Set the line.",
  fade,
  target: { x1: 0, y1: 0, x2: 1, y2: 1 },
  presetControls,
});

describe("moduleSpecSchema", () => {
  it("accepts a spec without practice and defaults fixed to {}", () => {
    const spec = moduleSpecSchema.parse(base);
    expect(spec.stage2Exploration.fixed).toEqual({});
    expect(spec.practice).toBeUndefined();
  });

  it("rejects more controls than the cognitive-load budget allows", () => {
    const r = moduleSpecSchema.safeParse({ ...base, cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 25 } });
    expect(r.success).toBe(false);
  });

  it("requires a toggle to name its two states", () => {
    const toggle = { controlType: "toggle" as const, variableName: "order", label: "Order", min: 0, max: 1, initial: 0, colorToken: "slate" as const, visualSignaling: "flip" };
    const withControls = (c: object) => ({ ...base, stage2Exploration: { ...base.stage2Exploration, controls: [c] } });
    expect(moduleSpecSchema.safeParse(withControls(toggle)).success).toBe(false);
    expect(moduleSpecSchema.safeParse(withControls({ ...toggle, stateLabels: ["Stretch first", "Turn first"] })).success).toBe(true);
  });

  it("rejects prompts over the 12-word budget", () => {
    const r = moduleSpecSchema.safeParse({
      ...base,
      stage3Prediction: { ...base.stage3Prediction, challengePrompt: "one two three four five six seven eight nine ten eleven twelve thirteen" },
    });
    expect(r.success).toBe(false);
  });

  it("accepts practice that fades guided → assisted → autonomous", () => {
    const r = moduleSpecSchema.safeParse({
      ...base,
      practice: { items: [item("guided"), item("assisted", ["c"]), item("autonomous")] },
    });
    expect(r.success).toBe(true);
  });

  it("rejects practice that adds help back after fading", () => {
    const r = moduleSpecSchema.safeParse({
      ...base,
      practice: { items: [item("autonomous"), item("guided")] },
    });
    expect(r.success).toBe(false);
  });

  it("requires assisted items to preset a known control", () => {
    expect(moduleSpecSchema.safeParse({ ...base, practice: { items: [item("guided"), item("assisted")] } }).success).toBe(false);
    expect(
      moduleSpecSchema.safeParse({ ...base, practice: { items: [item("guided"), item("assisted", ["nope"])] } }).success
    ).toBe(false);
  });
});


describe("learning hierarchy schemas", () => {
  const chapter = { id: "math-algebra", trackId: "mathematics", position: 0, title: "Algebra", status: "published" };
  const module = {
    id: "math-line", trackId: "mathematics", chapterId: "math-algebra", position: 0,
    title: "Line", interactive: "line", estimatedMinutes: 3, spec: base,
  };

  it("defaults chapter subtitle and description", () => {
    expect(learningChapterSchema.parse(chapter)).toMatchObject({ subtitle: "", description: "" });
  });

  it("validates chapter slugs, ordering, copy limits and status", () => {
    for (const invalid of [
      { id: "Bad Slug" }, { trackId: "Bad Slug" }, { position: -1 }, { position: 0.5 },
      { title: "" }, { title: "a".repeat(81) }, { subtitle: "a".repeat(161) },
      { description: "a".repeat(401) }, { status: "retired" }, { status: undefined },
    ]) expect(learningChapterSchema.safeParse({ ...chapter, ...invalid }).success).toBe(false);
  });

  it("requires every module to reference a chapter", () => {
    expect(learningModuleSchema.safeParse(module).success).toBe(true);
    expect(learningModuleSchema.safeParse({ ...module, chapterId: undefined }).success).toBe(false);
    expect(learningModuleSchema.safeParse({ ...module, chapterId: "Bad Slug" }).success).toBe(false);
  });
});
