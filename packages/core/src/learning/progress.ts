import { calculateSM2, getDefaultSM2State, type ReviewRating } from "@versado/algorithms";
import type {
  LearningModule,
  ModuleProgress,
  ModuleProgressStatus,
  ModuleStage,
  ModuleWithStatus,
} from "./types";

export function createModuleProgress(userId: string, moduleId: string): ModuleProgress {
  const sm2 = getDefaultSM2State();
  return {
    userId,
    moduleId,
    stage: 1,
    predictionAttempts: 0,
    predictionCorrect: 0,
    completedAt: null,
    easeFactor: sm2.easeFactor,
    interval: sm2.interval,
    repetitions: sm2.repetitions,
    nextReviewAt: null,
    lastReviewedAt: null,
  };
}

/**
 * A module is available when all its prerequisites are completed
 * (or, without explicit prerequisites, when the previous module is completed).
 */
export function resolveModuleStatuses(
  modules: LearningModule[],
  progress: ModuleProgress[]
): ModuleWithStatus[] {
  const ordered = [...modules].sort((a, b) => a.position - b.position);
  const byModule = new Map(progress.map((p) => [p.moduleId, p]));
  const completed = new Set(progress.filter((p) => p.completedAt).map((p) => p.moduleId));

  return ordered.map((module, index) => {
    const p = byModule.get(module.id) ?? null;
    const requirements =
      module.prerequisites.length > 0
        ? module.prerequisites
        : index > 0
          ? [ordered[index - 1]!.id]
          : [];
    const unlocked = requirements.every((id) => completed.has(id));

    let progressStatus: ModuleProgressStatus;
    if (p?.completedAt) progressStatus = "completed";
    else if (!unlocked) progressStatus = "locked";
    else if (p) progressStatus = "in_progress";
    else progressStatus = "available";

    return { ...module, progressStatus, progress: p };
  });
}

/** Advance the stage pointer, never moving backwards. */
export function advanceStage(progress: ModuleProgress, stage: ModuleStage): ModuleProgress {
  return { ...progress, stage: Math.max(progress.stage, stage) as ModuleStage };
}

export function recordPrediction(progress: ModuleProgress, correct: boolean): ModuleProgress {
  return {
    ...progress,
    predictionAttempts: progress.predictionAttempts + 1,
    predictionCorrect: progress.predictionCorrect + (correct ? 1 : 0),
  };
}

/**
 * Completing a module queues its first spaced prediction check (+24h),
 * following the retention hooks in the learning bible.
 */
export function completeModule(progress: ModuleProgress, now = new Date()): ModuleProgress {
  if (progress.completedAt) return progress;
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return { ...progress, stage: 4, completedAt: now, nextReviewAt: next };
}

/** Map a spaced prediction check to an SM-2 rating. */
export function reviewRating(correct: boolean, attempts: number): ReviewRating {
  if (!correct) return 1;
  if (attempts <= 1) return 4;
  if (attempts === 2) return 3;
  return 2;
}

export function applyModuleReview(
  progress: ModuleProgress,
  correct: boolean,
  attempts: number,
  now = new Date()
): ModuleProgress {
  const result = calculateSM2(
    {
      easeFactor: progress.easeFactor,
      interval: progress.interval,
      repetitions: progress.repetitions,
    },
    reviewRating(correct, attempts)
  );
  const next = new Date(now);
  next.setDate(next.getDate() + result.interval);
  return {
    ...progress,
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewAt: next,
    lastReviewedAt: now,
  };
}

export function isReviewDue(progress: ModuleProgress, now = new Date()): boolean {
  return !!progress.completedAt && !!progress.nextReviewAt && progress.nextReviewAt <= now;
}
