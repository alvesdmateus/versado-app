import { describe, expect, it } from "bun:test";
import { loadLearningContent } from "./index";

describe("learning content", () => {
  const content = loadLearningContent();

  it("parses every track and module against the bible-derived schema", () => {
    expect(content.length).toBeGreaterThan(0);
    for (const { modules } of content) expect(modules.length).toBeGreaterThan(0);
  });

  it("uses unique module ids and positions per track", () => {
    for (const { modules } of content) {
      expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
      expect(new Set(modules.map((m) => m.position)).size).toBe(modules.length);
    }
  });

  it("only references prerequisites that exist in the same track", () => {
    for (const { modules } of content) {
      const ids = new Set(modules.map((m) => m.id));
      for (const m of modules) for (const p of m.prerequisites) expect(ids.has(p)).toBe(true);
    }
  });
});
