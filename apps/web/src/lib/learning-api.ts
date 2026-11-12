import type {
  LearningModule,
  ModuleProgress,
  ModuleStage,
  ModuleWithStatus,
  TrackSummary,
} from "@versado/core";
import { apiClient } from "./api-client";

/** JSON dates arrive as ISO strings. */
type Wire<T> = {
  [K in keyof T]: T[K] extends Date | null ? string | null : T[K] extends Date ? string : T[K];
};

export type WireProgress = Wire<ModuleProgress>;
export type WireModule = Omit<ModuleWithStatus, "progress"> & { progress: WireProgress | null };

export interface DueReview {
  module: LearningModule;
  progress: WireProgress;
}

export const learningApi = {
  listTracks() {
    return apiClient<{ tracks: TrackSummary[] }>("/api/learn/tracks").then((r) => r.tracks);
  },

  getTrack(trackId: string) {
    return apiClient<{ track: TrackSummary; modules: WireModule[] }>(
      `/api/learn/tracks/${encodeURIComponent(trackId)}`
    );
  },

  getModule(moduleId: string) {
    return apiClient<{ module: WireModule }>(
      `/api/learn/modules/${encodeURIComponent(moduleId)}`
    ).then((r) => r.module);
  },

  updateProgress(
    moduleId: string,
    input: { stage: ModuleStage; predictionAttempt?: { correct: boolean }; completed?: boolean }
  ) {
    return apiClient<{ progress: WireProgress }>(
      `/api/learn/modules/${encodeURIComponent(moduleId)}/progress`,
      { method: "POST", body: JSON.stringify(input) }
    ).then((r) => r.progress);
  },

  listDueReviews() {
    return apiClient<{ reviews: DueReview[] }>("/api/learn/reviews/due").then((r) => r.reviews);
  },

  submitReview(moduleId: string, input: { correct: boolean; attempts: number }) {
    return apiClient<{ progress: WireProgress }>(
      `/api/learn/modules/${encodeURIComponent(moduleId)}/review`,
      { method: "POST", body: JSON.stringify(input) }
    ).then((r) => r.progress);
  },
};
