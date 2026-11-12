import { beforeEach, describe, expect, it } from "bun:test";
import { LearningError, LearningService } from "./learning-service";
import { createMemoryLearningRepositories } from "./memory-repositories";
import type { LearningChapter, LearningModule, LearningTrack } from "./types";

const track: LearningTrack = {
  id: "math",
  domain: "mathematics",
  title: "Math",
  subtitle: "s",
  description: "d",
  icon: "Sigma",
  colorToken: "blue",
  position: 0,
  status: "published",
};

const chapter: LearningChapter = {
  id: "algebra", trackId: "math", position: 0, title: "Algebra",
  subtitle: "", description: "", status: "published",
};

const mod = (id: string, position: number, status: "draft" | "published" = "published") =>
  ({
    id,
    trackId: "math",
    chapterId: "algebra",
    position,
    title: id,
    interactive: id,
    estimatedMinutes: 3,
    prerequisites: [],
    status,
    spec: {} as LearningModule["spec"],
  }) satisfies LearningModule;

describe("LearningService", () => {
  let service: LearningService;

  beforeEach(() => {
    service = new LearningService(
      createMemoryLearningRepositories({
        tracks: [track, { ...track, id: "draft-track", status: "draft" }],
        chapters: [chapter],
        modules: [mod("a", 0), mod("b", 1), mod("hidden", 2, "draft")],
      })
    );
  });

  it("lists published tracks with module counts and next module", async () => {
    const [summary, ...rest] = await service.listTracks("u");
    expect(rest).toHaveLength(0);
    expect(summary).toMatchObject({ id: "math", chapterCount: 1, moduleCount: 2, completedCount: 0, nextModuleId: "a" });
  });

  it("groups the same module objects by chapter, in chapter then module order", async () => {
    const repos = createMemoryLearningRepositories({
      tracks: [track],
      chapters: [{ ...chapter, id: "second", position: 1 }, chapter],
      modules: [
        { ...mod("c", 0), chapterId: "second" },
        mod("b", 6), mod("a", 5),
      ],
    });
    service = new LearningService(repos);
    const result = await service.getTrack("u", "math");
    expect(result.modules.map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(result.chapters.map((c) => c.id)).toEqual(["algebra", "second"]);
    expect(result.chapters.map((c) => [c.moduleCount, c.completedCount])).toEqual([[2, 0], [1, 0]]);
    expect(result.chapters.flatMap((c) => c.modules)).toEqual(result.modules);
    expect(result.chapters[1]!.modules[0]).toBe(result.modules[2]);
    await expect(service.getModule("u", "c")).rejects.toThrow("previous");
    for (const id of ["a", "b"]) {
      await service.updateProgress("u", id, { stage: 4, predictionAttempt: { correct: true }, completed: true });
    }
    expect((await service.getModule("u", "c")).progressStatus).toBe("available");
    const updated = await service.getTrack("u", "math");
    expect(updated.track).toMatchObject({ chapterCount: 2, nextModuleId: "c", completedCount: 2 });
    expect(updated.chapters[0]!.completedCount).toBe(2);
    expect((await service.listTracks("u"))[0]!.nextModuleId).toBe("c");
  });

  it("hides draft chapters and their published lessons from paths, counts, access and reviews", async () => {
    const repos = createMemoryLearningRepositories({
      tracks: [track],
      chapters: [{ ...chapter, id: "draft-chapter", status: "draft", position: 0 }, { ...chapter, position: 1 }],
      modules: [{ ...mod("hidden", 0), chapterId: "draft-chapter" }, mod("a", 5)],
    });
    service = new LearningService(repos);
    await repos.progress.save({
      userId: "u", moduleId: "hidden", stage: 4, predictionAttempts: 1, predictionCorrect: 1,
      completedAt: new Date("2026-01-01"), easeFactor: 2.5, interval: 1, repetitions: 0,
      nextReviewAt: new Date("2026-01-02"), lastReviewedAt: null,
    });
    const result = await service.getTrack("u", "math");
    expect(result.chapters.map((c) => c.id)).toEqual(["algebra"]);
    expect(result.modules.map((m) => [m.id, m.progressStatus])).toEqual([["a", "available"]]);
    expect(result.track).toMatchObject({ chapterCount: 1, moduleCount: 1, completedCount: 0, dueReviewCount: 0 });
    expect((await service.listTracks("u"))[0]).toMatchObject({ chapterCount: 1, moduleCount: 1 });
    await expect(service.getModule("u", "hidden")).rejects.toMatchObject({ kind: "not_found" });
    expect(await service.listDueReviews("u")).toEqual([]);
    expect(await repos.chapters.listByTrack("math", { includeDrafts: true })).toHaveLength(2);
  });

  it("refuses locked modules", async () => {
    await expect(service.getModule("u", "b")).rejects.toBeInstanceOf(LearningError);
  });

  it("requires a correct prediction before completion", async () => {
    await expect(
      service.updateProgress("u", "a", { stage: 4, completed: true })
    ).rejects.toThrow("correct prediction");
  });

  it("completes a module, unlocks the next and schedules a review", async () => {
    const start = new Date("2026-03-01T09:00:00Z");
    await service.updateProgress("u", "a", { stage: 3, predictionAttempt: { correct: false } }, start);
    await service.updateProgress("u", "a", { stage: 3, predictionAttempt: { correct: true } }, start);
    const done = await service.updateProgress("u", "a", { stage: 4, completed: true }, start);
    expect(done.predictionAttempts).toBe(2);
    expect(done.completedAt).toEqual(start);

    const { track: summary, modules } = await service.getTrack("u", "math", start);
    expect(summary.completedCount).toBe(1);
    expect(summary.nextModuleId).toBe("b");
    expect(modules.map((m) => m.progressStatus)).toEqual(["completed", "available"]);

    const later = new Date("2026-03-02T09:00:00Z");
    const due = await service.listDueReviews("u", later);
    expect(due.map((d) => d.module.id)).toEqual(["a"]);

    const reviewed = await service.submitReview("u", "a", { correct: true, attempts: 1 }, later);
    expect(reviewed.nextReviewAt!.getTime()).toBeGreaterThan(later.getTime());
    expect(await service.listDueReviews("u", later)).toHaveLength(0);
  });

  it("rejects reviews for modules that are not completed", async () => {
    await expect(service.submitReview("u", "a", { correct: true, attempts: 1 })).rejects.toThrow();
  });
});
