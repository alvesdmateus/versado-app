import type { LearningRepositories } from "./repositories";
import type {
  LearningModule,
  LearningTrack,
  ModuleProgress,
  ModuleStage,
  ModuleWithStatus,
  TrackSummary,
} from "./types";
import {
  advanceStage,
  applyModuleReview,
  completeModule,
  createModuleProgress,
  recordPrediction,
  resolveModuleStatuses,
} from "./progress";

export class LearningError extends Error {
  constructor(
    public readonly kind: "not_found" | "locked" | "invalid",
    message: string
  ) {
    super(message);
    this.name = "LearningError";
  }
}

export interface DueReview {
  module: LearningModule;
  progress: ModuleProgress;
}

export class LearningService {
  constructor(private readonly repos: LearningRepositories) {}

  async listTracks(userId: string, now = new Date()): Promise<TrackSummary[]> {
    const tracks = await this.repos.tracks.listPublished();
    const due = await this.repos.progress.listDue(userId, now);
    const dueIds = new Set(due.map((p) => p.moduleId));

    return Promise.all(
      tracks.map(async (track) => {
        const modules = await this.repos.modules.listByTrack(track.id);
        const progress = await this.repos.progress.listForUser(
          userId,
          modules.map((m) => m.id)
        );
        return this.summarize(track, resolveModuleStatuses(modules, progress), dueIds);
      })
    );
  }

  async getTrack(
    userId: string,
    trackId: string,
    now = new Date()
  ): Promise<{ track: TrackSummary; modules: ModuleWithStatus[] }> {
    const track = await this.repos.tracks.findById(trackId);
    if (!track || track.status !== "published") {
      throw new LearningError("not_found", "Track not found");
    }
    const modules = await this.repos.modules.listByTrack(trackId);
    const progress = await this.repos.progress.listForUser(
      userId,
      modules.map((m) => m.id)
    );
    const withStatus = resolveModuleStatuses(modules, progress);
    const due = await this.repos.progress.listDue(userId, now);
    return {
      track: this.summarize(track, withStatus, new Set(due.map((p) => p.moduleId))),
      modules: withStatus,
    };
  }

  async getModule(userId: string, moduleId: string): Promise<ModuleWithStatus> {
    const module = await this.repos.modules.findById(moduleId);
    if (!module || module.status !== "published") {
      throw new LearningError("not_found", "Module not found");
    }
    const { modules } = await this.getTrack(userId, module.trackId);
    const resolved = modules.find((m) => m.id === moduleId);
    if (!resolved) throw new LearningError("not_found", "Module not found");
    if (resolved.progressStatus === "locked") {
      throw new LearningError("locked", "Complete the previous modules first");
    }
    return resolved;
  }

  async updateProgress(
    userId: string,
    moduleId: string,
    input: { stage: ModuleStage; predictionAttempt?: { correct: boolean }; completed?: boolean },
    now = new Date()
  ): Promise<ModuleProgress> {
    const resolved = await this.getModule(userId, moduleId);
    let progress = resolved.progress ?? createModuleProgress(userId, moduleId);

    progress = advanceStage(progress, input.stage);
    if (input.predictionAttempt) {
      progress = recordPrediction(progress, input.predictionAttempt.correct);
    }
    if (input.completed) {
      // The prediction gate is mandatory: a module cannot complete without a correct prediction.
      if (progress.predictionCorrect === 0) {
        throw new LearningError("invalid", "A correct prediction is required before completing");
      }
      progress = completeModule(progress, now);
    }

    await this.repos.progress.save(progress);
    return progress;
  }

  async listDueReviews(userId: string, now = new Date()): Promise<DueReview[]> {
    const due = await this.repos.progress.listDue(userId, now);
    const reviews: DueReview[] = [];
    for (const progress of due) {
      const module = await this.repos.modules.findById(progress.moduleId);
      if (module && module.status === "published") reviews.push({ module, progress });
    }
    return reviews;
  }

  async submitReview(
    userId: string,
    moduleId: string,
    input: { correct: boolean; attempts: number },
    now = new Date()
  ): Promise<ModuleProgress> {
    const progress = await this.repos.progress.find(userId, moduleId);
    if (!progress?.completedAt) {
      throw new LearningError("invalid", "Module has not been completed yet");
    }
    const next = applyModuleReview(progress, input.correct, input.attempts, now);
    await this.repos.progress.save(next);
    return next;
  }

  private summarize(
    track: LearningTrack,
    modules: ModuleWithStatus[],
    dueIds: Set<string>
  ): TrackSummary {
    const next = modules.find(
      (m) => m.progressStatus === "in_progress" || m.progressStatus === "available"
    );
    return {
      ...track,
      moduleCount: modules.length,
      completedCount: modules.filter((m) => m.progressStatus === "completed").length,
      nextModuleId: next?.id ?? null,
      dueReviewCount: modules.filter((m) => dueIds.has(m.id)).length,
    };
  }
}
