import type { LearningTrack, LearningChapter, LearningModule, ModuleProgress } from "./types";

/**
 * Storage-agnostic ports for learning content and progress.
 * The API ships a PostgreSQL/Drizzle adapter; any other backend can be plugged in
 * by implementing these interfaces.
 */
export interface LearningTrackRepository {
  listPublished(): Promise<LearningTrack[]>;
  findById(id: string): Promise<LearningTrack | null>;
  upsert(track: LearningTrack): Promise<void>;
}

export interface LearningChapterRepository {
  listByTrack(trackId: string, opts?: { includeDrafts?: boolean }): Promise<LearningChapter[]>;
  upsert(chapter: LearningChapter): Promise<void>;
}

export interface LearningModuleRepository {
  listByTrack(trackId: string, opts?: { includeDrafts?: boolean }): Promise<LearningModule[]>;
  findById(id: string): Promise<LearningModule | null>;
  upsert(module: LearningModule): Promise<void>;
}

export interface ModuleProgressRepository {
  listForUser(userId: string, moduleIds?: string[]): Promise<ModuleProgress[]>;
  find(userId: string, moduleId: string): Promise<ModuleProgress | null>;
  save(progress: ModuleProgress): Promise<void>;
  listDue(userId: string, now: Date): Promise<ModuleProgress[]>;
}

export interface LearningRepositories {
  tracks: LearningTrackRepository;
  chapters: LearningChapterRepository;
  modules: LearningModuleRepository;
  progress: ModuleProgressRepository;
}
