import { describe, expect, it } from "bun:test";
import { loadLearningContent } from "./index";
import { algebraChapter, algebraModules } from "./mathematics";

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

  it("uses unique chapter ids and positions per track", () => {
    for (const { chapters } of content) {
      expect(new Set(chapters.map((c) => c.id)).size).toBe(chapters.length);
      expect(new Set(chapters.map((c) => c.position)).size).toBe(chapters.length);
    }
  });

  it("keeps all 11 lessons in the Algebra chapter of Mathematics", () => {
    expect(content).toHaveLength(1);
    expect(content[0]!.track).toMatchObject({ id: "mathematics", title: "Mathematics", domain: "mathematics" });
    expect(content[0]!.chapters).toHaveLength(1);
    expect(content[0]!.chapters[0]).toMatchObject({ id: "math-algebra", title: "Algebra" });
    expect(content[0]!.modules).toHaveLength(11);
    for (const { track, chapters, modules } of content) {
      expect(chapters.every((c) => c.trackId === track.id)).toBe(true);
      for (const module of modules) {
        expect(module.trackId).toBe(track.id);
        expect(chapters.some((c) => c.id === module.chapterId && c.trackId === module.trackId)).toBe(true);
      }
    }
  });

  it("rejects a chapter belonging to another course", () => {
    const original = algebraChapter.trackId;
    try {
      algebraChapter.trackId = "another-course";
      expect(() => loadLearningContent()).toThrow('Chapter "math-algebra" belongs to');
    } finally {
      algebraChapter.trackId = original;
    }
  });

  it("rejects lessons belonging to another course or chapter", () => {
    const module = algebraModules[0]!;
    const { trackId, chapterId } = module;
    try {
      module.trackId = "another-course";
      expect(() => loadLearningContent()).toThrow("must belong to track");
      module.trackId = trackId;
      module.chapterId = "another-chapter";
      expect(() => loadLearningContent()).toThrow("must belong to track");
    } finally {
      module.trackId = trackId;
      module.chapterId = chapterId;
    }
  });

  it("only references prerequisites that exist in the same track", () => {
    for (const { modules } of content) {
      const ids = new Set(modules.map((m) => m.id));
      for (const m of modules) for (const p of m.prerequisites) expect(ids.has(p)).toBe(true);
    }
  });
});
