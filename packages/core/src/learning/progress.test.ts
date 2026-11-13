import { describe, expect, it } from "bun:test";
import {
  applyModuleReview,
  completeModule,
  createModuleProgress,
  isReviewDue,
  recordPrediction,
  advanceStage,
  resolveModuleStatuses,
  reviewRating,
} from "./progress";
import type { LearningChapter, LearningModule } from "./types";

const spec = {} as LearningModule["spec"];
const mod = (id: string, position: number, prerequisites: string[] = []): LearningModule => ({
  id,
  trackId: "t",
  chapterId: "first",
  position,
  title: id,
  interactive: id,
  estimatedMinutes: 3,
  prerequisites,
  status: "published",
  spec,
});

describe("resolveModuleStatuses", () => {
  it("unlocks the first module and locks the rest", () => {
    const result = resolveModuleStatuses([mod("b", 1), mod("a", 0)], []);
    expect(result.map((m) => [m.id, m.progressStatus])).toEqual([
      ["a", "available"],
      ["b", "locked"],
    ]);
  });

  it("unlocks the next module once the previous one is completed", () => {
    const done = completeModule(createModuleProgress("u", "a"));
    const result = resolveModuleStatuses([mod("a", 0), mod("b", 1)], [done]);
    expect(result.map((m) => m.progressStatus)).toEqual(["completed", "available"]);
  });

  it("uses chapter order before module position when unlocking across chapters", () => {
    const chapter = (id: string, position: number): LearningChapter => ({
      id, trackId: "t", position, title: id, subtitle: "", description: "", status: "published",
    });
    const chapters = [chapter("second", 1), chapter("first", 0)];
    const modules = [{ ...mod("b", 0), chapterId: "second" }, mod("a", 9)];
    expect(resolveModuleStatuses(modules, [], chapters).map((m) => [m.id, m.progressStatus]))
      .toEqual([["a", "available"], ["b", "locked"]]);
    const done = completeModule(createModuleProgress("u", "a"));
    expect(resolveModuleStatuses(modules, [done], chapters).map((m) => m.progressStatus))
      .toEqual(["completed", "available"]);
  });

  it("honours explicit prerequisites", () => {
    const done = completeModule(createModuleProgress("u", "a"));
    const result = resolveModuleStatuses(
      [mod("a", 0), mod("b", 1), mod("c", 2, ["a"])],
      [done]
    );
    expect(result.find((m) => m.id === "c")?.progressStatus).toBe("available");
  });

  it("marks started modules as in progress", () => {
    const result = resolveModuleStatuses([mod("a", 0)], [createModuleProgress("u", "a")]);
    expect(result[0]?.progressStatus).toBe("in_progress");
  });
});

describe("progress transitions", () => {
  it("never moves the stage backwards", () => {
    const p = advanceStage(advanceStage(createModuleProgress("u", "a"), 3), 2);
    expect(p.stage).toBe(3);
  });

  it("counts prediction attempts", () => {
    const p = recordPrediction(recordPrediction(createModuleProgress("u", "a"), false), true);
    expect(p.predictionAttempts).toBe(2);
    expect(p.predictionCorrect).toBe(1);
  });

  it("queues the first review 24h after completion", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const p = completeModule(createModuleProgress("u", "a"), now);
    expect(p.nextReviewAt?.getTime()).toBe(now.getTime() + 24 * 3600 * 1000);
    expect(isReviewDue(p, now)).toBe(false);
    expect(isReviewDue(p, new Date(now.getTime() + 24 * 3600 * 1000))).toBe(true);
  });

  it("expands the interval after a correct review and resets after a miss", () => {
    const now = new Date("2026-01-02T10:00:00Z");
    const done = completeModule(createModuleProgress("u", "a"), new Date("2026-01-01T10:00:00Z"));
    const first = applyModuleReview(done, true, 1, now);
    expect(first.interval).toBe(1);
    const second = applyModuleReview(first, true, 1, now);
    expect(second.interval).toBe(6);
    const missed = applyModuleReview(second, false, 3, now);
    expect(missed.interval).toBe(1);
    expect(missed.repetitions).toBe(0);
  });

  it("maps review outcomes to SM-2 ratings", () => {
    expect(reviewRating(false, 1)).toBe(1);
    expect(reviewRating(true, 1)).toBe(4);
    expect(reviewRating(true, 2)).toBe(3);
    expect(reviewRating(true, 5)).toBe(2);
  });
});
