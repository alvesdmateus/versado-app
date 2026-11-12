/**
 * Skill-track learning domain (see intuitive_interactive_learning.md).
 * Course → Chapter → Module: track = course in the code/API. Each Module follows
 * the 4-stage lesson blueprint and carries its full spec as data.
 */
import type { ModuleSpec, LearningDomain, ColorToken } from "@versado/validation";

export type { ModuleSpec, LearningDomain, ColorToken };

export type ContentStatus = "draft" | "published";

/** 1 Anchoring · 2 Exploration · 3 Prediction gate · 4 Formalization */
export type ModuleStage = 1 | 2 | 3 | 4;

export const MODULE_STAGES: readonly ModuleStage[] = [1, 2, 3, 4] as const;

export interface LearningTrack {
  id: string;
  domain: LearningDomain;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  colorToken: ColorToken;
  position: number;
  status: ContentStatus;
}

export interface LearningChapter {
  id: string;
  trackId: string;
  position: number;
  title: string;
  subtitle: string;
  description: string;
  status: ContentStatus;
}

export interface LearningModule {
  id: string;
  trackId: string;
  chapterId: string;
  position: number;
  title: string;
  interactive: string;
  estimatedMinutes: number;
  prerequisites: string[];
  status: ContentStatus;
  spec: ModuleSpec;
}

export type ModuleProgressStatus = "locked" | "available" | "in_progress" | "completed";

export interface ModuleProgress {
  userId: string;
  moduleId: string;
  /** Highest stage reached. */
  stage: ModuleStage;
  predictionAttempts: number;
  predictionCorrect: number;
  completedAt: Date | null;
  // Spaced-review state (SM-2), active once the module is completed.
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
}

export interface ModuleWithStatus extends LearningModule {
  progressStatus: ModuleProgressStatus;
  progress: ModuleProgress | null;
}

export interface ChapterWithModules extends LearningChapter {
  modules: ModuleWithStatus[];
  completedCount: number;
  moduleCount: number;
}

export interface TrackSummary extends LearningTrack {
  chapterCount: number;
  moduleCount: number;
  completedCount: number;
  nextModuleId: string | null;
  dueReviewCount: number;
}
