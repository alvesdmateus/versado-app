import { beforeEach, describe, expect, it } from "bun:test";
import { LearningError, LearningService } from "./learning-service";
import { createMemoryLearningRepositories } from "./memory-repositories";
import type { LearningModule, LearningTrack } from "./types";

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

const mod = (id: string, position: number, status: "draft" | "published" = "published") =>
  ({
    id,
    trackId: "math",
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
        modules: [mod("a", 0), mod("b", 1), mod("hidden", 2, "draft")],
      })
    );
  });

  it("lists published tracks with module counts and next module", async () => {
    const [summary, ...rest] = await service.listTracks("u");
    expect(rest).toHaveLength(0);
    expect(summary).toMatchObject({ id: "math", moduleCount: 2, completedCount: 0, nextModuleId: "a" });
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
